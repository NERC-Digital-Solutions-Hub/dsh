export type TypeScriptExport = {
	name: string;
	value: unknown;
	type?: string;
	readonly?: boolean;
};

export type TypeScriptModuleOptions = {
	imports?: string[];
	exports: TypeScriptExport[];
};

export function createTypeScriptModule(options: TypeScriptModuleOptions): string {
	const imports = options.imports?.length ? `${options.imports.join('\n')}\n\n` : '';
	const exports = options.exports
		.map((item) => {
			const typeAnnotation = item.type ? `: ${item.type}` : '';
			const serialized = JSON.stringify(item.value);
			if (item.type) {
				return `export const ${item.name}${typeAnnotation} = JSON.parse(${JSON.stringify(serialized)}) as ${item.type};`;
			}

			const readonlyAssertion = item.readonly ? ' as const' : '';
			return `export const ${item.name}${typeAnnotation} = ${JSON.stringify(item.value, null, 2)}${readonlyAssertion};`;
		})
		.join('\n\n');

	return `${imports}${exports}\n`;
}
