// throwaway script for manually invoking the dispatch provider during dev.
// delete or rename once we have real promptfoo configs wired up.

import DispatchProvider from './dispatch.ts';

const provider = new DispatchProvider({});

const result = await provider.callApi('', {
	vars: {
		fixture: 'minimal',
		message: 'What knowledge bases do I have? Use mnemo.',
		prime: true,
	},
});

console.log(JSON.stringify(result, null, 2));
