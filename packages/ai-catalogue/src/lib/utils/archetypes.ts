import {
	BookSearch,
	ChartArea,
	MapPinned,
	Monitor,
	PersonStanding,
	ShieldCheck,
	Trees
} from '@lucide/svelte';
import type { ArchetypeDefinition } from '$lib/types/api.types';
import type { Component } from 'svelte';

export const archetypeIcons: Record<number, Component> = {
	1: ChartArea,
	2: Trees,
	3: Monitor,
	4: PersonStanding,
	5: ShieldCheck,
	6: BookSearch,
	7: MapPinned
};

export function getArchetypeIcon(archetypeId: number | null | undefined): Component {
	if (archetypeId === null || archetypeId === undefined) {
		return ChartArea;
	}

	return archetypeIcons[archetypeId] ?? ChartArea;
}

export function buildArchetypeComboboxOption(archetype: ArchetypeDefinition) {
	return {
		value: String(archetype.id),
		label: archetype.name,
		icon: getArchetypeIcon(archetype.id)
	};
}
