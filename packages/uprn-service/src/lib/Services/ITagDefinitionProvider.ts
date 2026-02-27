import type { TagDefinition } from '$lib/Types/Configuration.types';

/**
 * Interface for providing tag definitions associated with specific tag IDs.
 */
export interface ITagDefinitionProvider {
	/**
	 * Gets the tag definition for a given tag ID.
	 * @param tagId The tag ID to receive the tag definitions for.
	 */
	getTagDefinition(tagId: string): TagDefinition;

	/**
	 * Gets all tag definitions.
	 * @returns An array of all tag definitions.
	 */
	getAllTagDefinitions(): TagDefinition[];
}
