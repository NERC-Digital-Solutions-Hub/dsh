import type { NodeDrawState, TreeviewNode } from '$lib/Models/Treeview/index';

export type NodeVisibilityRenderTarget =
	| {
			kind: 'source';
			nodeId: string;
			sourceId: string;
			drawStateNodeId: string;
	  }
	| {
			kind: 'source-member';
			nodeId: string;
			sourceId: string;
			memberId: string;
			drawStateNodeId: string;
	  };

export type NodeVisibilityRenderChange = {
	sourceNode: TreeviewNode;
	target: NodeVisibilityRenderTarget;
	isVisible: boolean;
	setDrawState: (drawState: NodeDrawState | undefined) => void;
};

export type NodeVisibilityDependencyChange = {
	sourceNode: TreeviewNode;
	dependentNode: TreeviewNode;
	target: NodeVisibilityRenderTarget;
	isVisible: boolean;
};

/**
 * Renderer-neutral bridge for applying tree visibility state to a map/rendering engine.
 */
export interface INodeVisibilityRenderer {
	/** Applies visibility for a node's render target. */
	applyVisibility(change: NodeVisibilityRenderChange): void | Promise<void>;

	/** Applies visibility for a dependency target without changing tree node state. */
	applyDependencyVisibility(change: NodeVisibilityDependencyChange): void | Promise<void>;

	/** Cleans up renderer subscriptions and transient state. */
	reset(): void;
}
