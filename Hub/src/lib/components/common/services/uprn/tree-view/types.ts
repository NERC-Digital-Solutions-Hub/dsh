export type TreeNode = {
	id: string;
	name: string;
	layer: __esri.Layer | __esri.Sublayer;
	visibilityDependencyIds?: string[];
	visibilityGroupId?: string;
	children?: TreeNode[];
	parent?: TreeNode;
};
