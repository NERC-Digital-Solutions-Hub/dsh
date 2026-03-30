export { default as Combobox } from './combobox.svelte';
import type { Component } from 'svelte';

export interface ComboboxOption {
	value: string;
	label: string;
	disabled?: boolean;
	icon?: Component;
}
