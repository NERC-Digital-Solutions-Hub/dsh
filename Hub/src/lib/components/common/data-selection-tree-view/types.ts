export type TreeNode = {
	id: string;
	name: string;
	layer: __esri.Layer | __esri.Sublayer;
	children?: TreeNode[];
};
