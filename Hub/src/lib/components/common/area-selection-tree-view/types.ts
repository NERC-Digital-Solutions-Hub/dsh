export type TreeNode = {
	id: string;
	name: string;
	layer: __esri.Layer | __esri.Sublayer;
	layerView?: __esri.LayerView;
	children?: TreeNode[];
};
