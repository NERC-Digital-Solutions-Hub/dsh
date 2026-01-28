import { createContext } from 'svelte';

/* Item info dialog event related types and context */
export type ItemInfoDialogEvents = {
	onOpenInfoDialog?: (layerId: string) => void;
};

export const [getItemInfoDialogEvents, setItemInfoDialogEvents] =
	createContext<ItemInfoDialogEvents>();
