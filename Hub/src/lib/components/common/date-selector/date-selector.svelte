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

	// Handle manual date input with automatic "/" insertion
	function handleDateInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let inputValue = target.value;

		// Remove any non-digit characters except "/"
		let cleanValue = inputValue.replace(/[^\d/]/g, '');

		// Remove extra slashes (keep only first two)
		const slashCount = (cleanValue.match(/\//g) || []).length;
		if (slashCount > 2) {
			cleanValue = cleanValue.replace(/\/+$/, ''); // Remove trailing slashes
		}

		// Auto-add slashes after day and month
		if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
			cleanValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
		}
		if (
			cleanValue.length >= 5 &&
			cleanValue.indexOf('/') === 2 &&
			cleanValue.lastIndexOf('/') === 2
		) {
			cleanValue = cleanValue.slice(0, 5) + '/' + cleanValue.slice(5);
		}

		// Limit to dd/mm/yyyy format (10 characters max)
		if (cleanValue.length > 10) {
			cleanValue = cleanValue.slice(0, 10);
		}

		// Update the input value and cursor position
		const cursorPosition = target.selectionStart || 0;
		const oldLength = inputValue.length;
		const newLength = cleanValue.length;

		target.value = cleanValue;
		dateString = cleanValue;

		// Adjust cursor position if we added a slash
		if (newLength > oldLength && cleanValue[cursorPosition] === '/') {
			target.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
		} else {
			target.setSelectionRange(cursorPosition, cursorPosition);
		}

		const parsedDate = parseInputDate(cleanValue);
		if (parsedDate) {
			selectedDate = parsedDate;
			const dateISO = parsedDate.toDate(getLocalTimeZone()).toISOString();
			onDateChange(dateISO);
		} else if (cleanValue === '') {
			selectedDate = undefined;
			onDateChange(null);
		}
	}

	// Handle backspace/delete to automatically remove slashes
	function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLInputElement;
		const cursorPosition = target.selectionStart || 0;
		const cursorEnd = target.selectionEnd || 0;
		const value = target.value;

		// Only handle backspace and delete keys
		if (event.key === 'Backspace' && cursorPosition === cursorEnd) {
			// Backspace - check if the character before cursor is a slash
			if (cursorPosition > 0 && value[cursorPosition - 1] === '/') {
				event.preventDefault();
				// Remove both the slash and the digit before it
				const newValue = value.slice(0, cursorPosition - 2) + value.slice(cursorPosition);
				dateString = newValue;
				// Trigger input event to process the new value
				setTimeout(() => {
					target.value = newValue;
					target.setSelectionRange(cursorPosition - 2, cursorPosition - 2);
					target.dispatchEvent(new Event('input', { bubbles: true }));
				}, 0);
			}
		} else if (event.key === 'Delete' && cursorPosition === cursorEnd) {
			// Delete - check if the character at cursor is a slash
			if (cursorPosition < value.length && value[cursorPosition] === '/') {
				event.preventDefault();
				// Remove both the slash and the digit after it
				const newValue = value.slice(0, cursorPosition) + value.slice(cursorPosition + 2);
				dateString = newValue;
				// Trigger input event to process the new value
				setTimeout(() => {
					target.value = newValue;
					target.setSelectionRange(cursorPosition, cursorPosition);
					target.dispatchEvent(new Event('input', { bubbles: true }));
				}, 0);
			}
		}
	}

	// Handle calendar selection
	function handleCalendarChange(date: DateValue | undefined) {
		if (date) {
			selectedDate = date;
			dateString = formatDate(date);
			popoverOpen = false;
			const dateISO = date.toDate(getLocalTimeZone()).toISOString();
			onDateChange(dateISO);
		}
	}

	function clearDate() {
		selectedDate = undefined;
		dateString = '';
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
			onkeydown={handleKeyDown}
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
