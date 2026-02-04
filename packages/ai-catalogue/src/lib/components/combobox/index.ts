export { default as Combobox } from './combobox.svelte';

export interface ComboboxOption {
	value: string;
	label: string;
	disabled?: boolean;
}
