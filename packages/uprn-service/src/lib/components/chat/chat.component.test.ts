import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AiChatbotClient } from '$lib/services/ai-chatbot-client';

import { ChatController, type ChatMessage } from './chat-controller.svelte';
import ChatMessageList from './chat-message-list.svelte';
import ChatMessageRow from './chat-message-row.svelte';

beforeEach(() => {
	Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
		configurable: true,
		value: vi.fn()
	});
	vi.stubGlobal(
		'ResizeObserver',
		class {
			public observe(): void {}
			public unobserve(): void {}
			public disconnect(): void {}
		}
	);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('chat streaming', () => {
	it('updates the same bot row beyond the first visible character', async () => {
		vi.useFakeTimers();
		const controller = new ChatController({} as AiChatbotClient);

		const initialization = controller.initialize('Hello');
		await vi.advanceTimersByTimeAsync(0);
		await tick();

		const message = controller.messages.at(-1);
		expect(message?.sender).toBe('bot');
		if (!message || message.sender !== 'bot') throw new Error('Expected a bot message.');

		const { container } = render(ChatMessageRow, { message, onReport: vi.fn() });
		const article = container.querySelector('article');
		expect(article?.textContent).toBe('H');

		await vi.advanceTimersByTimeAsync(15);
		await tick();
		expect(container.querySelector('article')).toBe(article);
		expect(article?.textContent).toBe('He');

		await vi.runAllTimersAsync();
		await initialization;
		await tick();
		expect(article?.textContent).toBe('Hello');
		expect(message.isStreaming).toBe(false);
	});

	it('shows the waiting bubble only before bot rendering begins', async () => {
		const messages: ChatMessage[] = [{ id: 1, sender: 'user', text: 'Question', sentAt: '15:20' }];
		const { container, getByRole, queryByRole, rerender } = render(ChatMessageList, {
			messages,
			isLoading: true,
			isAwaitingResponse: true,
			viewportRef: null,
			onReport: vi.fn()
		});
		const liveRegion = container.querySelector('[aria-live="polite"]');

		const waitingStatus = getByRole('status', { name: 'Waiting for assistant response' });
		expect(waitingStatus.querySelectorAll('span')).toHaveLength(3);
		expect(liveRegion?.getAttribute('aria-busy')).toBe('true');

		await rerender({ isAwaitingResponse: false, isLoading: true });
		expect(queryByRole('status', { name: 'Waiting for assistant response' })).toBeNull();
		expect(liveRegion?.getAttribute('aria-busy')).toBe('true');

		await rerender({ isLoading: false });
		expect(liveRegion?.getAttribute('aria-busy')).toBe('false');
	});
});
