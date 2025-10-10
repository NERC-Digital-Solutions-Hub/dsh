export class TreeNode {
	id: string;
	name: string;
	children: TreeNode[];
	parent: TreeNode | null;

	constructor(id: string, name: string, children: TreeNode[] = [], parent: TreeNode | null = null) {
		this.id = id;
		this.name = name;
		this.children = children;
		this.parent = parent;
	}
}

export class TreeLayerNode extends TreeNode {
	layer: __esri.Layer | __esri.Sublayer;

	constructor(
		id: string,
		name: string,
		layer: __esri.Layer | __esri.Sublayer,
		children: TreeNode[] = [],
		parent: TreeNode | null = null
	) {
		super(id, name, children, parent);
		this.layer = layer;
	}
}

export class TreeFieldNode extends TreeLayerNode {
	featureLayer: __esri.FeatureLayer;
	field: __esri.Field;

	constructor(
		id: string,
		name: string,
		layer: __esri.FeatureLayer,
		field: __esri.Field,
		children: TreeNode[] = [],
		parent: TreeNode | null = null
	) {
		super(id, name, layer, children, parent);
		this.field = field;
		this.featureLayer = layer;
	}
}
