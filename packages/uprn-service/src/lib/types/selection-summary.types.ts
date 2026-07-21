import type { TreeviewNodeTypology } from './treeview.types';

/** Display-only tree node shared by export and download summaries. */
export type SelectionSummaryNode = {
	id: string;
	name: string;
	isVariable: boolean;
	isLeaf: boolean;
	children: SelectionSummaryNode[];
	typology?: TreeviewNodeTypology;
	nameStatus?: 'loading' | 'loaded' | 'unavailable';
};
