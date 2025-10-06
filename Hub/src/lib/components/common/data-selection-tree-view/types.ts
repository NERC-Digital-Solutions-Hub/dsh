export type TreeNode = {
	id: string;
	name: string;
	layer: __esri.Layer | __esri.Sublayer;
	visibilityGroup?: string;
	children?: TreeNode[];
	parent?: TreeNode | null;
};
