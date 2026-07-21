import type { AiChatbotClient } from '$lib/Services/AiChatbotClient';
import { TabType } from '$lib/Types/App.types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatController } from './ChatController.svelte';

afterEach(() => vi.useRealTimers());

describe('ChatController', () => {
	it('keeps one conversation ID and increments payload sequence numbers', async () => {
		vi.useFakeTimers();
		const submitChat = vi.fn().mockResolvedValue({ answer: 'Answer', references: [] });
		const client = { submitChat } as unknown as AiChatbotClient;
		const controller = new ChatController(client, 1_000_000);
		const state = { tab: TabType.Data, selections: { area: ['A1'], data: ['field'] } };

		const first = controller.submit('First', state);
		await vi.runAllTimersAsync();
		await first;
		const second = controller.submit('Second', state);
		await vi.runAllTimersAsync();
		await second;

		expect(submitChat).toHaveBeenCalledTimes(2);
		const firstCall = submitChat.mock.calls[0];
		const secondCall = submitChat.mock.calls[1];
		expect(firstCall[1]).toBe(secondCall[1]);
		expect(firstCall[2]).toBe(1);
		expect(secondCall[2]).toBe(2);
		expect(secondCall[3]).toEqual(state);
	});

	it('tracks the network wait separately from progressive rendering', async () => {
		vi.useFakeTimers();
		const response = deferred<{ answer: string; references: string[] }>();
		const submitChat = vi.fn().mockReturnValue(response.promise);
		const client = { submitChat } as unknown as AiChatbotClient;
		const controller = new ChatController(client);
		const state = { tab: TabType.Data, selections: { area: [], data: [] } };

		const submission = controller.submit('Question', state);

		expect(controller.isLoading).toBe(true);
		expect(controller.isAwaitingResponse).toBe(true);
		expect(controller.messages.at(-1)?.sender).toBe('user');

		response.resolve({ answer: 'Progressive answer', references: [] });
		await vi.advanceTimersByTimeAsync(0);

		const botMessage = controller.messages.at(-1);
		expect(botMessage?.sender).toBe('bot');
		expect(controller.isAwaitingResponse).toBe(false);
		expect(controller.isLoading).toBe(true);
		if (botMessage?.sender === 'bot') expect(botMessage.isStreaming).toBe(true);

		await vi.runAllTimersAsync();
		await submission;

		expect(controller.isAwaitingResponse).toBe(false);
		expect(controller.isLoading).toBe(false);
		const completedMessage = controller.messages.at(-1);
		if (completedMessage?.sender === 'bot') {
			expect(completedMessage.html).toContain('Progressive answer');
			expect(completedMessage.isStreaming).toBe(false);
		}
	});

	it('clears the waiting state and streams the fallback message after a request failure', async () => {
		vi.useFakeTimers();
		const submitChat = vi.fn().mockRejectedValue(new Error('Unavailable'));
		const client = { submitChat } as unknown as AiChatbotClient;
		const controller = new ChatController(client);
		const state = { tab: TabType.Data, selections: { area: [], data: [] } };

		const submission = controller.submit('Question', state);
		expect(controller.isAwaitingResponse).toBe(true);

		await vi.advanceTimersByTimeAsync(0);
		expect(controller.isAwaitingResponse).toBe(false);
		expect(controller.isLoading).toBe(true);
		const streamingFallback = controller.messages.at(-1);
		if (streamingFallback?.sender === 'bot') expect(streamingFallback.isStreaming).toBe(true);

		await vi.runAllTimersAsync();
		await submission;

		expect(controller.error).toBeInstanceOf(Error);
		expect(controller.isAwaitingResponse).toBe(false);
		expect(controller.isLoading).toBe(false);
		const completedFallback = controller.messages.at(-1);
		if (completedFallback?.sender === 'bot') {
			expect(completedFallback.html).toContain('Sorry');
			expect(completedFallback.isStreaming).toBe(false);
		}
	});
});

function deferred<T>(): {
	promise: Promise<T>;
	resolve: (value: T) => void;
} {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((promiseResolve) => {
		resolve = promiseResolve;
	});
	return { promise, resolve };
}
