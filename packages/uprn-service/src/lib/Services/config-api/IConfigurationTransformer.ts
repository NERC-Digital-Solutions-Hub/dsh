/**
 * Generic interface for transforming configuration data.
 */
export interface IConfigurationTransformer<TInput, TOutput> {
	/**
	 * Transforms a configuration item.
	 */
	transform(item: TInput): Promise<TOutput>;
}
