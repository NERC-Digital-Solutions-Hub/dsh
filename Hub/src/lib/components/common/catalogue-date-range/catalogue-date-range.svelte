<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { type DateValue, getLocalTimeZone, parseDate, fromDate } from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	type Props = {
		label: string;
		value?: string | null;
		placeholder?: string;
		onDateChange: (date: string | null) => void;
		id?: string;
	};

	let {
		label,
		value = null,
		placeholder = 'dd/mm/yyyy',
		onDateChange,
		id = `date-${Math.random().toString(36).substr(2, 9)}`
	}: Props = $props();

	// Simple date formatter for dd/mm/yyyy format
	function formatDate(date: DateValue): string {
		const jsDate = date.toDate(getLocalTimeZone());
		const day = jsDate.getDate().toString().padStart(2, '0');
		const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
		const year = jsDate.getFullYear();
		return `${day}/${month}/${year}`;
	}

	// Parse dd/mm/yyyy format
	function parseInputDate(input: string): DateValue | null {
		const parts = input.split('/');
		if (parts.length !== 3) return null;

		const day = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10);
		const year = parseInt(parts[2], 10);

		if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
		if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;

		try {
			const jsDate = new Date(year, month - 1, day);
			if (jsDate.getDate() !== day || jsDate.getMonth() !== month - 1) return null;
			return fromDate(jsDate, getLocalTimeZone());
		} catch {
			return null;
		}
	}

	// State for the date value and input string
	let selectedDate = $state<DateValue | undefined>();
	let dateString = $state('');
	let popoverOpen = $state(false);

	// Debounced callback function
	let callbackTimeout: ReturnType<typeof setTimeout> | null = null;
	function debouncedCallback(dateISO: string | null) {
		if (callbackTimeout) clearTimeout(callbackTimeout);
		callbackTimeout = setTimeout(() => {
			onDateChange(dateISO);
		}, 300);
	}

	// Initialize with existing value from props
	$effect(() => {
		if (value && !selectedDate) {
			try {
				const parsedDate = parseDate(value.split('T')[0]);
				selectedDate = parsedDate;
				dateString = formatDate(parsedDate);
			} catch {
				// Invalid date value, ignore
			}
		} else if (!value && selectedDate) {
			selectedDate = undefined;
			dateString = '';
		}
	});

	// Handle manual date input
	function handleDateInput(event: Event) {
		const target = event.target as HTMLInputElement;
		dateString = target.value;

		const parsedDate = parseInputDate(target.value);
		if (parsedDate) {
			selectedDate = parsedDate;
			const dateISO = parsedDate.toDate(getLocalTimeZone()).toISOString();
			debouncedCallback(dateISO);
		} else if (target.value === '') {
			selectedDate = undefined;
			debouncedCallback(null);
		}
	}

	// Handle calendar selection
	function handleCalendarChange(date: DateValue | undefined) {
		if (date) {
			selectedDate = date;
			dateString = formatDate(date);
			popoverOpen = false;
			const dateISO = date.toDate(getLocalTimeZone()).toISOString();
			debouncedCallback(dateISO);
		}
	}

	function clearDate() {
		selectedDate = undefined;
		dateString = '';
		if (callbackTimeout) clearTimeout(callbackTimeout);
		onDateChange(null);
	}
</script>

<div class="date-selector">
	<label for={id} class="text-sm font-medium text-gray-700">{label}</label>
	<div class="date-input-wrapper">
		<Input
			{id}
			type="text"
			{placeholder}
			value={dateString}
			oninput={handleDateInput}
			class="pr-16"
		/>

		{#if selectedDate}
			<Button
				variant="ghost"
				size="sm"
				onclick={clearDate}
				class="absolute top-1/2 right-8 h-7 w-7 -translate-y-1/2 p-0 text-gray-400 hover:text-gray-600"
			>
				×
			</Button>
		{/if}

		<Popover.Root bind:open={popoverOpen}>
			<Popover.Trigger>
				<Button
					variant="ghost"
					size="sm"
					class="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
				>
					<CalendarIcon class="h-4 w-4" />
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-auto p-0" align="start">
				<Calendar type="single" bind:value={selectedDate} onValueChange={handleCalendarChange} />
			</Popover.Content>
		</Popover.Root>
	</div>
</div>

<style>
	.date-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 140px;
	}

	.date-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
</style>
