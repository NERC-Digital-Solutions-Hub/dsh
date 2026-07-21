/**
 * Renderer-neutral binding for a tree node that can be shown in a map or rendering engine.
 */
export type RenderBinding =
	| {
			kind: 'source';
			sourceId: string;
			drawStateNodeId?: string;
	  }
	| {
			kind: 'source-member';
			sourceId: string;
			memberId: string;
			drawStateNodeId?: string;
	  };

/**
 * Export/download binding for a tree node that can contribute to a data selection.
 */
export type SelectionBinding =
	| {
			kind: 'dataset';
			sourceId: string;
	  }
	| {
			kind: 'field';
			sourceId: string;
			fieldId: string;
	  };

/**
 * Binding for nodes that can drive source styling, such as a custom field renderer.
 */
export type StyleBinding = {
	kind: 'field';
	sourceId: string;
	fieldId: string;
};

/**
 * Domain capabilities exposed by tree nodes. These are deliberately independent of
 * ArcGIS/OpenLayers/parquet layer implementations.
 */
export type TreeviewNodeCapabilities = {
	render?: RenderBinding;
	selection?: SelectionBinding;
	style?: StyleBinding;
};
