import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import DownloadCheckbox from './DownloadCheckbox.svelte';

describe('DownloadCheckbox', () => {
	it('renders parent-driven state changes without remounting', async () => {
		const { getByRole, rerender } = render(DownloadCheckbox, {
			checked: false,
			indeterminate: false,
			'aria-label': 'Download selection'
		});
		const checkbox = getByRole('checkbox') as HTMLButtonElement;

		expectCheckboxState(checkbox, 'unchecked');

		await rerender({ checked: true, indeterminate: false });
		expect(getByRole('checkbox')).toBe(checkbox);
		expectCheckboxState(checkbox, 'checked');

		await rerender({ checked: false, indeterminate: false });
		expectCheckboxState(checkbox, 'unchecked');

		await rerender({ checked: false, indeterminate: true });
		expectCheckboxState(checkbox, 'indeterminate');

		await rerender({ checked: false, indeterminate: false });
		expectCheckboxState(checkbox, 'unchecked');
	});

	it('emits intent and remains synchronized after repeated clicks', async () => {
		const onCheckedChange = vi.fn();
		const { getByRole, rerender } = render(DownloadCheckbox, {
			checked: false,
			indeterminate: false,
			onCheckedChange,
			'aria-label': 'Download selection'
		});
		const checkbox = getByRole('checkbox') as HTMLButtonElement;

		await fireEvent.click(checkbox);
		expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.any(MouseEvent));
		await rerender({ checked: true, indeterminate: false, onCheckedChange });
		expectCheckboxState(checkbox, 'checked');

		await fireEvent.click(checkbox);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false, expect.any(MouseEvent));
		await rerender({ checked: false, indeterminate: false, onCheckedChange });
		expectCheckboxState(checkbox, 'unchecked');

		await rerender({ checked: false, indeterminate: true, onCheckedChange });
		expectCheckboxState(checkbox, 'indeterminate');

		await fireEvent.click(checkbox);
		expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.any(MouseEvent));
		await rerender({ checked: true, indeterminate: false, onCheckedChange });
		expectCheckboxState(checkbox, 'checked');
	});
});

function expectCheckboxState(
	checkbox: HTMLButtonElement,
	state: 'checked' | 'indeterminate' | 'unchecked'
): void {
	expect(checkbox.dataset.state).toBe(state);
	expect(checkbox.getAttribute('aria-checked')).toBe(
		state === 'indeterminate' ? 'mixed' : state === 'checked' ? 'true' : 'false'
	);
	expect(checkbox.querySelector('[data-slot="checkbox-icon-checked"]') !== null).toBe(
		state === 'checked'
	);
	expect(checkbox.querySelector('[data-slot="checkbox-icon-indeterminate"]') !== null).toBe(
		state === 'indeterminate'
	);
}
