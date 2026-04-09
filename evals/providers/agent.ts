import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

//-----------------------------------------------------------------------------

interface ProviderResponse {
	output: string | object;
	error?: string;
	tokenUsage?: {
		total?: number;
		prompt?: number;
		completion?: number;
	};
	cost?: number;
}

interface FileChange {
	path: string;
	content: string;
}

interface InspectResult {
	created: FileChange[];
	modified: FileChange[];
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

	id () {
		return "agent";
	}

	// copy the fixture knowledge base to a temp directory

	private setup (fixtureName: string) {
		const fixtureSource = join(__dirname, '..', 'fixtures', fixtureName);
		const tempDir = mkdtempSync(join(tmpdir(), 'mnemo-eval-'));
		cpSync(fixtureSource, tempDir, { recursive: true })
		const tempConfig = join(tempDir, '.mnemo-config.yml');
		writeFileSync(tempConfig, `bases:\n  eval: ${tempDir}\n`)
		return { tempDir, tempConfig };
	}

	// snapshots the files (path, content) in the temp directory

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

	// captures snapshots to surface modified files

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

	// deletes the temp directory

	private teardown(tempDir: string) {
		rmSync(tempDir, { recursive: true, force: true })
	}

	// load the agent prompt and append the brief

	private buildPrompt(agent: string, brief: string) {
		const agentPromptPath = join(__dirname, '..', '..', 'skill', 'agents', `${agent}.md`);
		const agentPrompt = readFileSync(agentPromptPath, 'utf-8');
		return [agentPrompt, brief].join('\n')
	}

	// need an oauth token to use with --bare
	// https://github.com/anthropics/claude-code/issues/38022

	private getAuthToken() {
		const creds = execSync(
			'security find-generic-password -s "Claude Code-credentials" -w',
			{ encoding: 'utf-8' }
		).trim();
		const parsed = JSON.parse(creds);
		return parsed.claudeAiOauth.accessToken;
	}

	// run the agent (using claude -p one shots)

	private async execute(prompt: string, tempDir: string, tempConfig: string, message: string, model?: string) {
		const token = this.getAuthToken();
		const settings = JSON.stringify({ apiKeyHelper: `echo ${token}` })
		writeFileSync(join(tempDir, '.system-prompt.md'), prompt);

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

			// timeout
			const timer = setTimeout(() => {
				proc.kill('SIGTERM');
				setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} }, 2000);
				settle(() => reject(new Error(`Agent timed out after 120s. stderr: ${stderr}`)));
			}, 120000);
		});
	}

	// orchestrates the eval

	async callApi (prompt: string, context: CallApiContext): Promise<ProviderResponse> {
		const { agent, fixture, message, model } = context.vars
		const { tempDir, tempConfig } = this.setup(fixture);
		const before = this.listFiles(tempDir);

		try {
			const agentPrompt = this.buildPrompt(agent, prompt);
			const { parsed } = await this.execute(agentPrompt, tempDir, tempConfig, message, model);
			const { created, modified } = this.inspect(tempDir, before);

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
					reasoning: result,
					session_id: parsed.session_id,
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

