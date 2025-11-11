import type { Component, Snippet } from 'svelte';

export type MapCommand = {
	id: string;
	name: string;
	description?: string;
	group?: string;
	shortcut?: string[];
	execute: () => Promise<void> | void;
	component: Component<any>;
	props?: () => object;
};
