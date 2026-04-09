// assembles the save agent brief from structured vars
// single source of truth for the save brief template

// ----------------------------------------------------------------------------

interface Variables {
	state: string;
	brief: string;
	context: string;
	user_said: string;
	base_hint?: string;
	destination_hint?: string;
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
		`Base hint: ${vars.base_hint ?? 'eval'}`,
	];

	if (vars.destination_hint) {
		parts.push(`Destination hint: ${vars.destination_hint}`);
	}

	return parts.join('\n');
}
