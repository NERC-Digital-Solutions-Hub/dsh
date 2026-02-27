import type { ITagDefinitionProvider } from '$lib/Services/ITagDefinitionProvider';
import type { TagDefinition } from '$lib/Types/Configuration.types';

/**
 * Implementation of ITagDefinitionProvider to provide tag definitions.
 */
export class TagDefinitionProvider implements ITagDefinitionProvider {
	private tagDefinitionMap: Map<string, TagDefinition> = new Map();

	/**
	 * Initialize an instance of TagDefinitionProvider.
	 * @param tagDefinitions Array of TagDefinition to initialize the provider with.
	 */
	constructor(tagDefinitions: TagDefinition[]) {
		for (const tagDef of tagDefinitions) {
			this.tagDefinitionMap.set(tagDef.id, tagDef);
		}
	}

	/** @inheritdoc */
	public getTagDefinition(tagId: string): TagDefinition {
		const definition = this.tagDefinitionMap.get(tagId);
		if (definition) {
			return definition;
		}

		console.warn(`[TagDefinitionProvider] Tag definition not found for id: ${tagId}`);
		return {
			id: tagId,
			label: tagId,
			color: '#9CA3AF'
		};
	}

	/** @inheritdoc */
	public getAllTagDefinitions(): TagDefinition[] {
		return Array.from(this.tagDefinitionMap.values());
	}
}
