/** Use this on a vertically scrollable container to ensure that it automatically scrolls to the bottom of the content.
 *
 * ## Usage
 * ```svelte
 * <script lang="ts">
 *      import { UseAutoScroll } from '$lib/Hooks/useAutoScroll.svelte';
 *
 *      let { children } = $props();
 *
 *      const autoScroll = new UseAutoScroll();
 * </script>
 *
 * <div>
 *      <div bind:this={autoScroll.ref}>
 *          {@render children?.()}
 *      </div>
 *      {#if !autoScroll.isAtBottom}
 *          <button onclick={() => autoScroll.scrollToBottom()}>
 *              Scroll To Bottom
 *          </button>
 *      {/if}
 * </div>
 * ```
 */
export class UseAutoScroll {
	#ref = $state<HTMLElement>();
	#scrollY: number = $state(0);
	#userHasScrolled = $state(false);
	private lastScrollHeight = 0;
	private mutationObserver: MutationObserver | null = null;
	private resizeHandler: (() => void) | null = null;
	private scrollHandler: (() => void) | null = null;

	// This sets everything up once #ref is bound
	public set ref(ref: HTMLElement | undefined) {
		if (this.#ref === ref) return;

		this.destroy();
		this.#ref = ref;

		if (!this.#ref) return;

		this.lastScrollHeight = this.#ref.scrollHeight;

		// start from bottom or start position
		this.#ref.scrollTo(0, this.#scrollY ? this.#scrollY : this.#ref.scrollHeight);

		this.scrollHandler = () => {
			if (!this.#ref) return;

			this.#scrollY = this.#ref.scrollTop;

			this.disableAutoScroll();
		};
		this.#ref.addEventListener('scroll', this.scrollHandler);

		this.resizeHandler = () => {
			this.scrollToBottom(true);
		};
		window.addEventListener('resize', this.resizeHandler);

		// should detect when something changed that effected the scroll height
		this.mutationObserver = new MutationObserver(() => {
			if (!this.#ref) return;

			if (this.#ref.scrollHeight !== this.lastScrollHeight) {
				this.scrollToBottom(true);
			}

			this.lastScrollHeight = this.#ref.scrollHeight;
		});

		this.mutationObserver.observe(this.#ref, { childList: true, subtree: true });
	}

	public get ref() {
		return this.#ref;
	}

	public get scrollY() {
		return this.#scrollY;
	}

	/** Checks if the container is scrolled to the bottom */
	public get isAtBottom() {
		if (!this.#ref) return true;

		return this.#scrollY + this.#ref.offsetHeight >= this.#ref.scrollHeight;
	}

	/** Disables auto scrolling until the container is scrolled back to the bottom */
	public disableAutoScroll() {
		if (this.isAtBottom) {
			this.#userHasScrolled = false;
		} else {
			this.#userHasScrolled = true;
		}
	}

	/** Scrolls the container to the bottom */
	public scrollToBottom(auto = false) {
		if (!this.#ref) return;

		// don't auto scroll if user has scrolled
		if (auto && this.#userHasScrolled) return;

		this.#ref.scrollTo(0, this.#ref.scrollHeight);
	}

	public destroy(): void {
		if (this.#ref && this.scrollHandler) {
			this.#ref.removeEventListener('scroll', this.scrollHandler);
		}

		if (this.resizeHandler && typeof window !== 'undefined') {
			window.removeEventListener('resize', this.resizeHandler);
		}

		this.mutationObserver?.disconnect();
		this.mutationObserver = null;
		this.resizeHandler = null;
		this.scrollHandler = null;
		this.#ref = undefined;
	}
}
