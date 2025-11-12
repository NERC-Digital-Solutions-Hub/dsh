import type { Component } from 'svelte';

export type MapCommandSurfaceProps =
	| Record<string, unknown>
	| ((runtime: MapCommandRuntime) => Record<string, unknown>);

export type MapCommandSurface = {
	component: Component<Record<string, unknown>>;
	props?: MapCommandSurfaceProps;
};

export type MapCommandSession = {
	input?: MapCommandSurface | null;
	content?: MapCommandSurface | null;
	dispose?: () => void;
};

export interface MapCommandRuntime {
	deactivate: () => void;
	isActive: (commandId?: string) => boolean;
	setInputSurface: (surface: MapCommandSurface | null) => void;
	setContentSurface: (surface: MapCommandSurface | null) => void;
	setIsOpen: (open: boolean, options?: { preserveActive?: boolean }) => void;
	getInputValue: () => string;
	setInputValue: (value: string) => void;
	setInputHandler: (handler: ((nextValue: string) => void) | null) => void;
	setPlaceholder: (value: string) => void;
	resetPlaceholder: () => void;
}

export interface MapCommand {
	id: string;
	name: string;
	description?: string;
	group?: string;
	shortcut?: string[];
	inputPlaceholder?: string;
	execute(runtime: MapCommandRuntime): Promise<void> | void;
	component?: Component<Record<string, unknown>> | null;
	props?(runtime: MapCommandRuntime): Record<string, unknown>;
	createSession?(runtime: MapCommandRuntime): MapCommandSession | null | undefined;
}
