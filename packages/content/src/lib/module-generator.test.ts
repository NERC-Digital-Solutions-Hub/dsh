import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTypeScriptModule } from './module-generator';

test('serializes typed exports through JSON.parse assertions', () => {
	const module = createTypeScriptModule({
		imports: ["import type { Example } from './types';"],
		exports: [{ name: 'example', type: 'Example', value: { type: 'field', enabled: true } }]
	});

	assert.match(module, /import type \{ Example \}/);
	assert.match(module, /export const example: Example = JSON\.parse/);
	assert.match(module, / as Example;/);
});
