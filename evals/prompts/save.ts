// assembles the save agent brief from structured vars
// single source of truth for the save brief template
//
// destination signals are mutually exclusive — a brief has at most one of
// Specified / Suggested / Candidates. if more than one is set, order of
// precedence is Specified > Suggested > Candidates (the most authoritative
// wins). setting none produces a brief with no destination signal, which
// is the correct shape for topical saves where routing is entirely the
// agent's job.
//
// {FIXTURE_PATH} in bases is substituted by the agent.ts provider at
// runtime with the temp fixture directory.

// ----------------------------------------------------------------------------

interface Variables {
	state: string;
	brief: string;
	context: string;
	user_said: string;
	specified?: string;
	suggested?: string;
	candidates?: string;
	bases?: string;
	structure?: string;
}

// ----------------------------------------------------------------------------

export default function ({ vars }: { vars: Variables }): string {
	const parts = [
		`## State: ${vars.state}`, '',
		'## Brief',
		vars.brief, '',
		'## Context',
		vars.context, '',
		`User said: "${vars.user_said}"`,
	];

	if (vars.specified) {
		parts.push(`Specified: ${vars.specified}`);
	} else if (vars.suggested) {
		parts.push(`Suggested: ${vars.suggested}`);
	} else if (vars.candidates) {
		parts.push(`Candidates: ${vars.candidates}`);
	}

	if (vars.bases || vars.structure) {
		parts.push('', '## Knowledge base');
		if (vars.bases) {
			parts.push('Bases:');
			parts.push(vars.bases);
		}
		if (vars.structure) {
			if (vars.bases) parts.push('');
			parts.push('Structure:');
			parts.push(vars.structure);
		}
	}

	return parts.join('\n');
}
