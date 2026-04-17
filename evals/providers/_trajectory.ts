// consumes claude -p stream-json events one at a time and accumulates a full
// trajectory. knows how to interpret the event shapes (system.init, assistant,
// user, result) and correlates tool_use blocks with their tool_result blocks.
// has no knowledge of subprocesses or stdout — pure event-driven state machine.
//
// shared between dispatch.ts (dispatcher evals) and agent.ts (sub-agent evals,
// once agent.ts migrates from session-jsonl-reads to stream-json).

//-----------------------------------------------------------------------------

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
