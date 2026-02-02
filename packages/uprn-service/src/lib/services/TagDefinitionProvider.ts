import type { ITagDefinitionProvider } from '$lib/services/ITagDefinitionProvider';
import type { TagDefinition } from '$lib/types/config';

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
		throw new Error('Method not implemented.');
	}
}
