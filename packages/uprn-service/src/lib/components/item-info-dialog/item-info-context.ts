import { createContext } from 'svelte';

export type ItemInfoContext = {
	onOpenInfoDialog?: (layerId: string) => void;
};

export const [getItemInfoContext, setItemInfoContext] = createContext<ItemInfoContext>();
