import { mkdtempSync, cpSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

//-----------------------------------------------------------------------------

export interface ProviderResponse {
  output: string | object;
  error?: string;
  tokenUsage?: {
    total?: number;
    prompt?: number;
    completion?: number;
  };
  cost?: number;
}

export interface ProviderOptions {
  id?: string;
  config?: {
    timeoutMs?: number;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  is_error?: boolean;
}

export interface ExecuteResult {
  toolCalls: ToolCall[];
  result: string;
  finalText: string;
  sessionId: string;
  usage?: Record<string, unknown>;
  modelUsage?: Record<string, Record<string, unknown>>;
  cost?: number;
  durationMs?: number;
  numTurns?: number;
  stopReason?: string;
}

//-----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//-----------------------------------------------------------------------------

/** detects fixture layout and returns the bases to register */
export function detectBases(fixtureDir: string): Record<string, string> {
  if (existsSync(join(fixtureDir, "AGENTS.md"))) {
    return { eval: fixtureDir };
  }

  const bases: Record<string, string> = {};
  for (const entry of readdirSync(fixtureDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      bases[entry.name] = join(fixtureDir, entry.name);
    }
  }
  return bases;
}

/** copies a fixture to a temp dir and writes a mnemo config with detected bases */
export function setupFixture(fixtureName: string, tempPrefix: string) {
  const fixtureSource = join(__dirname, "..", "fixtures", fixtureName);
  const fixtureDir = mkdtempSync(join(tmpdir(), tempPrefix));
  cpSync(fixtureSource, fixtureDir, { recursive: true });

  const bases = detectBases(fixtureDir);
  const basesYaml = Object.entries(bases)
    .map(([name, path]) => `  ${name}: ${path}`)
    .join("\n");
  const mnemoConfig = join(fixtureDir, ".mnemo-config.yml");
  writeFileSync(mnemoConfig, `bases:\n${basesYaml}\n`);

  return { fixtureDir, mnemoConfig };
}

//-----------------------------------------------------------------------------

/** accumulates stream-json events into a complete trajectory */

export class TrajectoryAccumulator {

  private toolUsesById = new Map<string, ToolCall>();
  private toolCallOrder: string[] = [];
  private dispatcherTextBlocks: string[] = [];
  private state: ExecuteResult = {
    toolCalls: [],
    result: '',
    finalText: '',
    sessionId: '',
  };

  /** processes a single stream-json event */

  processEvent(event: Record<string, unknown>): void {
    const type = event.type;

    if (type === 'system' && event.subtype === 'init') {
      this.state.sessionId = (event.session_id as string) ?? this.state.sessionId;
      return;
    }

    if (type === 'assistant') {
      const msg = event.message as Record<string, unknown> | undefined;
      const content = (msg?.content as Array<Record<string, unknown>>) ?? [];
      // sub-agent events carry a parent_tool_use_id pointing at the Agent
      // tool call that spawned them. top-level dispatcher events have null.
      // we only collect text from the dispatcher — sub-agent narration is
      // not what the user sees at the top of the conversation.
      const isDispatcher = event.parent_tool_use_id == null;
      for (const block of content) {
        if (block.type === 'tool_use') {
          const id = block.id as string;
          const call: ToolCall = {
            id,
            name: block.name as string,
            input: (block.input as Record<string, unknown>) ?? {},
          };
          this.toolUsesById.set(id, call);
          this.toolCallOrder.push(id);
          continue;
        }
        if (block.type === 'text' && isDispatcher) {
          const text = (block.text as string) ?? '';
          if (text) this.dispatcherTextBlocks.push(text);
        }
      }
      return;
    }

    if (type === 'user') {
      // tool results come back as user-turn messages with tool_result blocks
      const msg = event.message as Record<string, unknown> | undefined;
      const content = (msg?.content as Array<Record<string, unknown>>) ?? [];
      for (const block of content) {
        if (block.type !== 'tool_result') continue;
        const call = this.toolUsesById.get(block.tool_use_id as string);
        if (!call) continue;
        call.output = block.content;
        call.is_error = (block.is_error as boolean) ?? false;
      }
      return;
    }

    if (type === 'result') {
      this.state.finalText = (event.result as string) ?? '';
      this.state.usage = event.usage as Record<string, unknown> | undefined;
      this.state.modelUsage = event.modelUsage as Record<string, Record<string, unknown>> | undefined;
      this.state.cost = event.total_cost_usd as number | undefined;
      this.state.durationMs = event.duration_ms as number | undefined;
      this.state.numTurns = event.num_turns as number | undefined;
      this.state.stopReason = event.stop_reason as string | undefined;
      return;
    }
  }

  /** returns the accumulated trajectory as a complete result */

  finalize(): ExecuteResult {
    this.state.toolCalls = this.toolCallOrder.map((id) => this.toolUsesById.get(id)!);
    // result = everything the dispatcher said across the turn, joined in order.
    // finalText = just the last block (what event.result gave us). tests that
    // want "did the dispatcher use this word anywhere" use result; tests that
    // want "how did the dispatcher end" use finalText.
    this.state.result = this.dispatcherTextBlocks.join('\n\n');
    return this.state;
  }

}
