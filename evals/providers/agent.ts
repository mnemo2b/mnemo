import { readFileSync, writeFileSync, rmSync, readdirSync, statSync, existsSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

import { setupFixture } from './_shared';
import type { ProviderResponse, ProviderOptions } from './_shared';

//-----------------------------------------------------------------------------

interface FileChange {
	path: string;
	content: string;
}

interface InspectResult {
	created: FileChange[];
	modified: FileChange[];
}

interface ToolCall {
	name: string;
	summary: string;
}

interface CallApiContext {
	vars: {
		agent: string;
		message: string;
		prompt: string;
		fixture: string;
		model?: string;
	}
}

//-----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

//-----------------------------------------------------------------------------

export default class AgentProvider {

	// cached across test cases within a single eval run
	private authToken: string | null = null;
	private agentPrompts = new Map<string, string>();
	private timeoutMs: number;

	constructor(options: ProviderOptions) {
		this.timeoutMs = options.config?.timeoutMs ?? 120_000;
	}

	id () {
		return "agent";
	}

	/** copies a fixture to a temp directory and registers bases */

	private setup (fixtureName: string) {
		const { fixtureDir, mnemoConfig } = setupFixture(fixtureName, 'mnemo-eval-');
		return { tempDir: fixtureDir, tempConfig: mnemoConfig };
	}

	/** snapshots the files (path, content) in a directory */

	private listFiles (dir: string) {
		const files = new Map<string, string>();
		const walk = (current: string, prefix: string) => {
			for (const entry of readdirSync(current)) {
				if (entry.startsWith('.')) continue;
				const full = join(current, entry);
				const relative = prefix ? `${prefix}/${entry}` : entry;
				if (statSync(full).isDirectory()) {
					walk(full, relative);
				} else {
					files.set(relative, readFileSync(full, 'utf-8'))
				}
			}
		};
		walk(dir, '');
		return files;
	}

	/** diffs before/after snapshots to surface created and modified files */

	private inspect (tempDir: string, before: Map<string, string>): InspectResult {
		const after = this.listFiles(tempDir);
		const created: FileChange[] = [];
		const modified: FileChange[] = [];
		for (const [path, content] of after) {
			if (!before.has(path)) {
				created.push({ path, content })
			} else if (before.get(path) !== content) {
				modified.push({ path, content })
			}
		}
		return { created, modified }
	}

	/** deletes the temp directory */

	private teardown(tempDir: string) {
		rmSync(tempDir, { recursive: true, force: true })
	}

	/** extracts the tool call sequence from the session jsonl */

	private extractToolCalls(sessionId: string): ToolCall[] {
		const projectDir = join(homedir(), '.claude', 'projects', '-Users-neil---mnemo-mnemo');
		const jsonlPath = join(projectDir, `${sessionId}.jsonl`);
		if (!existsSync(jsonlPath)) return [];

		const lines = readFileSync(jsonlPath, 'utf-8').split('\n').filter(Boolean);
		const toolCalls: ToolCall[] = [];

		for (const line of lines) {
			const row = JSON.parse(line);
			const msg = row.message;
			if (msg?.role !== 'assistant') continue;

			for (const block of msg.content ?? []) {
				if (block.type !== 'tool_use') continue;
				const name = block.name;
				const input = block.input ?? {};

				// summarize each tool call into a readable one-liner
				let summary: string;
				if (name === 'Bash') summary = input.command?.slice(0, 120) ?? '';
				else if (['Read', 'Write', 'Edit'].includes(name)) summary = input.file_path ?? '';
				else if (name === 'Glob') summary = input.pattern ?? '';
				else if (name === 'Grep') summary = input.pattern ?? '';
				else summary = JSON.stringify(input).slice(0, 120);

				toolCalls.push({ name, summary });
			}
		}

		return toolCalls;
	}

	/** loads the agent prompt and appends the brief */

	private buildPrompt(agent: string, brief: string) {
		if (!this.agentPrompts.has(agent)) {
			const agentPromptPath = join(__dirname, '..', '..', 'skill', 'agents', `${agent}.md`);
			this.agentPrompts.set(agent, readFileSync(agentPromptPath, 'utf-8'));
		}
		return [this.agentPrompts.get(agent)!, brief].join('\n')
	}

	/** fetches an oauth token for --bare mode */

	private getAuthToken() {
		if (!this.authToken) {
			const creds = execSync(
				'security find-generic-password -s "Claude Code-credentials" -w',
				{ encoding: 'utf-8' }
			).trim();
			const parsed = JSON.parse(creds);
			this.authToken = parsed.claudeAiOauth.accessToken;
		}
		return this.authToken;
	}

	/** runs the agent using claude -p one-shots */

	private async execute(prompt: string, tempDir: string, tempConfig: string, message: string, model?: string) {
		const token = this.getAuthToken();
		const settings = JSON.stringify({ apiKeyHelper: `echo ${token}` })
		// substitute {FIXTURE_PATH} with the temp dir so test-authored briefs
		// can reference real base paths without knowing the runtime path
		const substituted = prompt.replaceAll('{FIXTURE_PATH}', tempDir);
		writeFileSync(join(tempDir, '.system-prompt.md'), substituted);

		return new Promise<{ raw: string; parsed: Record<string, unknown> }>((resolve, reject) => {
			let stdout = '';
			let stderr = '';
			let settled = false;

			const settle = (fn: () => void) => {
				if (settled) return;
				settled = true;
				if (timer) clearTimeout(timer);
				fn();
			};

			const args = [
				"-p",
				"--bare",
				"--system-prompt-file", join(tempDir, '.system-prompt.md'),
				"--allowed-tools", "Read Glob Grep Write Edit Bash(mnemo:*)",
				"--add-dir", tempDir,
				"--output-format", "json",
				"--permission-mode", "bypassPermissions",
				"--settings", settings,
			];
			if (model) args.push("--model", model);
			args.push(message);

			const proc = spawn("claude", args, {
				env: { ...process.env, MNEMO_CONFIG: tempConfig },
				stdio: ['ignore', 'pipe', 'pipe'],
			});

			proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
			proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

			proc.on('error', (err) => {
				settle(() => reject(new Error(`Failed to spawn claude: ${err.message}`)));
			});

			proc.on('close', (code) => {
				settle(() => {
					if (code !== 0) {
						reject(new Error(`claude exited with code ${code}: ${stderr}`));
						return;
					}
					try {
						const parsed = JSON.parse(stdout);
						resolve({ raw: stdout, parsed });
					} catch {
						reject(new Error(`Failed to parse output: ${stdout.slice(0, 200)}`));
					}
				});
			});

			// timeout — configurable via provider config, defaults to 120s
			const timer = setTimeout(() => {
				proc.kill('SIGTERM');
				setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} }, 2000);
				settle(() => reject(new Error(`Agent timed out after ${this.timeoutMs / 1000}s. stderr: ${stderr}`)));
			}, this.timeoutMs);
		});
	}

	/** orchestrates the eval */

	async callApi (prompt: string, context: CallApiContext): Promise<ProviderResponse> {
		const { agent, fixture, message, model } = context.vars
		const { tempDir, tempConfig } = this.setup(fixture);
		const before = this.listFiles(tempDir);

		try {
			const agentPrompt = this.buildPrompt(agent, prompt);
			const { parsed } = await this.execute(agentPrompt, tempDir, tempConfig, message, model);
			const { created, modified } = this.inspect(tempDir, before);
			const sessionId = parsed.session_id as string;
			const toolCalls = this.extractToolCalls(sessionId);

			// extract the agents response
			const result = typeof parsed.result === 'string' ? parsed.result : '';

			// parse the status
			const statusMatch = result.match(/## Status: (\w+)/);
			const status = statusMatch ? statusMatch[1] : 'UNKNOWN';

			// extract model info from per-model usage breakdown
			const modelUsage = parsed.modelUsage as Record<string, Record<string, unknown>> | undefined;
			const resolvedModel = modelUsage ? Object.keys(modelUsage)[0] : 'unknown';

			const usage = parsed.usage as Record<string, unknown> | undefined;

			return {
				output: {
					status,
					files_created: created,
					files_modified: modified,
					tool_calls: toolCalls,
					reasoning: result,
					session_id: sessionId,
					duration_ms: parsed.duration_ms,
					duration_api_ms: parsed.duration_api_ms,
					num_turns: parsed.num_turns,
					stop_reason: parsed.stop_reason,
					model: resolvedModel,
					cache_read_tokens: (usage?.cache_read_input_tokens as number) ?? 0,
				},
				tokenUsage: {
					total: (usage?.input_tokens as number ?? 0)
						+ (usage?.output_tokens as number ?? 0),
					prompt: usage?.input_tokens as number,
					completion: usage?.output_tokens as number,
				},
				cost: parsed.total_cost_usd as number,
			};

		} catch (error) {
			return {
				output: { status: 'ERROR', message: String(error) },
				error: String(error),
			};

		} finally {
			this.teardown(tempDir);
		}
	}

}

