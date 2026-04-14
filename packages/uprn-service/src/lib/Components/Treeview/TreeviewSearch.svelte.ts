import type { TreeviewNode } from '$lib/Models/Treeview/Index.js';

/* eslint-disable svelte/prefer-svelte-reactivity --
   Plain Map/Set used intentionally: these are internal lookup structures
   where reactivity is gated by $state.raw assignments, and Svelte proxy overhead
   on every .has()/.get() is the main perf bottleneck with 1500+ nodes. */

/** Shared empty set to avoid allocations when search is inactive. */
const EMPTY_SET: ReadonlySet<string> = Object.freeze(new Set<string>());

export class TreeviewSearch {
	#worker: Worker;
	#searchToken = 0;

	/** Imperative-only state — not tracked by reactive subscriptions. */
	#savedExpansionState = new Map<string, boolean>();
	#userToggledDuringSearch = new Set<string>();

	/** Tracks whether a new index is being built in the worker. */
	public isRebuilding = $state(false);

	/** Raw query from the input — updates immediately for display. */
	public query = $state('');

	/** Debounced query that drives search activation. */
	#debouncedQuery = $state('');

	#queryDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	/** Whether a query is entered (for expansion save/restore lifecycle). */
	public isActive: boolean = $derived(this.#debouncedQuery.trim().length > 0);

	/** Whether search results are available and should filter the tree. */
	public isFiltering = $state(false);

	/** IDs of nodes whose names directly match the query. */
	public matchedIds: ReadonlySet<string> = $state.raw(EMPTY_SET);

	/** IDs of ancestors that should be expanded to reveal matches. */
	public ancestorIds: ReadonlySet<string> = $state.raw(EMPTY_SET);

	constructor() {
		this.#worker = new Worker(new URL('./search.worker.ts', import.meta.url), {
			type: 'module'
		});
		this.#worker.onmessage = this.#handleWorkerMessage.bind(this);
	}

	/**
	 * Set query with debounce.
	 * Clearing is instant for responsive UX.
	 */
	public setQuery(value: string): void {
		this.query = value;

		clearTimeout(this.#queryDebounceTimer);

		if (!value.trim()) {
			// Instant clear
			this.#debouncedQuery = '';
			this.isFiltering = false;
			this.matchedIds = EMPTY_SET;
			this.ancestorIds = EMPTY_SET;
			this.#searchToken++;
			return;
		}

		const delay = value.trim().length === 1 ? 1000 : 500;
		this.#queryDebounceTimer = setTimeout(() => {
			// New search session — clear old expansion data before activation
			if (!this.#debouncedQuery.trim()) {
				this.#savedExpansionState.clear();
				this.#userToggledDuringSearch.clear();
			}
			this.#debouncedQuery = value;
			this.#postSearch(value.trim());
		}, delay);
	}

	/**
	 * Re-index tree nodes. Posts flat data to the worker for off-thread indexing.
	 */
	public updateNodes(nodes: TreeviewNode[]): void {
		const flat = this.#flatten(nodes);

		const parentMap = new Map<string, string | null>();
		for (const n of flat) {
			parentMap.set(n.id, n.parentId);
		}

		const ancestorChains = this.#buildAncestorChainEntries(parentMap);

		this.isRebuilding = true;
		this.#worker.postMessage({
			type: 'index',
			flatNodes: flat,
			ancestorChains
		});
	}

	public isMatch(nodeId: string): boolean {
		return this.matchedIds.has(nodeId);
	}

	public nodeOrDescendantMatches(nodeId: string): boolean {
		return this.matchedIds.has(nodeId) || this.ancestorIds.has(nodeId);
	}

	/**
	 * Snapshot a node's current expansion state before search overrides it.
	 * Only records the first call per node per search session.
	 */
	public saveExpansionState(nodeId: string, isOpen: boolean): void {
		if (!this.#savedExpansionState.has(nodeId)) {
			this.#savedExpansionState.set(nodeId, isOpen);
		}
	}

	public recordUserToggle(nodeId: string): void {
		this.#userToggledDuringSearch.add(nodeId);
	}

	public getSavedExpansionState(nodeId: string): boolean | undefined {
		if (this.#userToggledDuringSearch.has(nodeId)) return undefined;
		return this.#savedExpansionState.get(nodeId);
	}

	public destroy(): void {
		clearTimeout(this.#queryDebounceTimer);
		this.#worker.terminate();
	}

	// ── private ──────────────────────────────────────────────────────

	#postSearch(query: string): void {
		const token = ++this.#searchToken;
		this.#worker.postMessage({ type: 'search', query, token });
	}

	#handleWorkerMessage(e: MessageEvent): void {
		const msg = e.data;

		if (msg.type === 'indexed') {
			this.isRebuilding = false;
			// Re-run current search against new index
			if (this.#debouncedQuery.trim()) {
				this.#postSearch(this.#debouncedQuery.trim());
			}
		}

		if (msg.type === 'results') {
			if (msg.token !== this.#searchToken) return; // Stale result
			this.matchedIds = new Set(msg.matchedIds as string[]);
			this.ancestorIds = new Set(msg.ancestorIds as string[]);
			this.isFiltering = true;
		}
	}

	#flatten(nodes: TreeviewNode[]): Array<{ id: string; name: string; parentId: string | null }> {
		const result: Array<{ id: string; name: string; parentId: string | null }> = [];
		const stack: Array<{ node: TreeviewNode; parentId: string | null }> = [];

		for (let i = nodes.length - 1; i >= 0; i--) {
			stack.push({ node: nodes[i], parentId: null });
		}

		while (stack.length > 0) {
			const { node, parentId } = stack.pop()!;
			result.push({ id: node.id, name: node.name, parentId });

			if (node.children?.length) {
				for (let i = node.children.length - 1; i >= 0; i--) {
					stack.push({ node: node.children[i], parentId: node.id });
				}
			}
		}

		return result;
	}

	#buildAncestorChainEntries(parentMap: Map<string, string | null>): [string, string[]][] {
		const entries: [string, string[]][] = [];

		for (const id of parentMap.keys()) {
			const chain: string[] = [];
			let currentId = parentMap.get(id) ?? null;

			while (currentId !== null) {
				chain.push(currentId);
				currentId = parentMap.get(currentId) ?? null;
			}

			entries.push([id, chain]);
		}

		return entries;
	}
}
