import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

//-----------------------------------------------------------------------------

export default class SaveAgentProvider {

	id () {
		return "save-agent";
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
	private listFiles (dir: string): Map<string, string> {
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

	// compares snapshots (before vs after), tracks created and modified
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

	// assemble instructions to pass to the agent
	private buildPrompt (brief: string): string {
		const agentPromptPath = join(__dirname, '..', '..', 'skill', 'agents', 'save.md');
		const agentPrompt = readFileSync(agentPromptPath, 'utf-8');
		return [
			agentPrompt,
			'## State: INITIAL',
			'First pass - research the knowledge base and determine your confidence.', '',
			'## Brief: ',
			brief, '',
			'Base name: eval',
		].join('\n')
	}

	// need an oauth token to use with --bare
	// https://github.com/anthropics/claude-code/issues/38022
	private getAuthToken(): string {
		const creds = execSync(
			'security find-generic-password -s "Claude Code-credentials" -w',
			{ encoding: 'utf-8' }
		).trim();
		const parsed = JSON.parse(creds);
		return parsed.claudeAiOauth.accessToken;
	}

	// run the agent (using claude -p one shots)
	private async execute (
		prompt: string,
		tempDir: string,
		tempConfig: string,
	): Promise<{ raw: string; parsed: Record<string, unknown> }> {
		const token = this.getAuthToken();
		const settings = JSON.stringify({ apiKeyHelper: `echo ${token}` })
		const { execFile } = await import("child_process");
		const { promisify } = await import("util");
		writeFileSync(join(tempDir, '.system-prompt.md'), prompt);
		const execFileAsync = promisify(execFile);
		const { stdout } = await execFileAsync("claude", [
			"-p",
			"--bare",
			"--system-prompt-file", join(tempDir, '.system-prompt.md'),
			"--allowed-tools", "Read Glob Grep Write Edit Bash(mnemo:*)",
			"--add-dir", tempDir,
			"--output-format", "json",
			"--permission-mode", "bypassPermissions",
			"--settings", settings,
			"Save the content described in the brief to the knowledge base."
		], {
			env: { ...process.env, MNEMO_CONFIG: tempConfig },
			maxBuffer: 1024 * 1024,
			timeout: 120000
		})
		const parsed = JSON.parse(stdout);
		return { raw: stdout, parsed};
	}

	// orchestrates the test, called by promptfoo
	async callApi (prompt: string): Promise<ProviderResponse> {
		const { tempDir, tempConfig } = this.setup('minimal');
		const before = this.listFiles(tempDir);

		try {
			// call the agent with the prompt
			const agentPrompt = this.buildPrompt(prompt);
			const { parsed } = await this.execute(agentPrompt, tempDir, tempConfig);
			const { created, modified } = this.inspect(tempDir, before);

			// extract the agents response
			const result = typeof parsed.result === 'string' ? parsed.result : '';

			// parse the status
			const statusMatch = result.match(/## Status: (\w+)/);
			const status = statusMatch ? statusMatch[1] : 'UNKNOWN';

			return {
				output: {
					status,
					files_created: created,
					files_modified: modified,
					reasoning: result,
				},
				tokenUsage: {
					total: (parsed.usage as Record<string, number>)?.input_tokens
						+ (parsed.usage as Record<string, number>)?.output_tokens,
					prompt: (parsed.usage as Record<string, number>)?.input_tokens,
					completion: (parsed.usage as Record<string, number>)?.output_tokens,
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

