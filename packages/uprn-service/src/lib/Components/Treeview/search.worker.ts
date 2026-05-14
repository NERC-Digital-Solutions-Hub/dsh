// import MiniSearch from 'minisearch';

// interface FlatNode {
// 	id: string;
// 	name: string;
// 	parentId: string | null;
// }

// interface IndexMessage {
// 	type: 'index';
// 	flatNodes: FlatNode[];
// 	ancestorChains: [string, string[]][];
// }

// interface SearchMessage {
// 	type: 'search';
// 	query: string;
// 	token: number;
// }

// interface ClearMessage {
// 	type: 'clear';
// }

// type IncomingMessage = IndexMessage | SearchMessage | ClearMessage;

// let miniSearch: MiniSearch<FlatNode> = createMiniSearch();
// let ancestorChainMap = new Map<string, string[]>();

// function createMiniSearch(): MiniSearch<FlatNode> {
// 	return new MiniSearch<FlatNode>({
// 		fields: ['name'],
// 		storeFields: []
// 	});
// }

// function search(q: string) {
// 	if (q.length < 5) {
// 		return miniSearch.search(q, { prefix: true, fuzzy: false });
// 	}

// 	return miniSearch.search(q, { prefix: true, fuzzy: 0.1 });
// }

// function collectAncestors(matchedIds: Set<string>): string[] {
// 	const ancestors = new Set<string>();

// 	for (const id of matchedIds) {
// 		const chain = ancestorChainMap.get(id);
// 		if (!chain) continue;

// 		for (const ancestorId of chain) {
// 			ancestors.add(ancestorId);
// 		}
// 	}

// 	return [...ancestors];
// }

// self.onmessage = (e: MessageEvent<IncomingMessage>) => {
// 	const msg = e.data;

// 	if (msg.type === 'index') {
// 		miniSearch = createMiniSearch();
// 		miniSearch.addAll(msg.flatNodes);
// 		ancestorChainMap = new Map(msg.ancestorChains);
// 		self.postMessage({ type: 'indexed' });
// 	}

// 	if (msg.type === 'search') {
// 		const results = search(msg.query);
// 		const matchedIds = results.map((r) => r.id);
// 		const ancestorIds = collectAncestors(new Set(matchedIds));

// 		self.postMessage({
// 			type: 'results',
// 			matchedIds,
// 			ancestorIds,
// 			token: msg.token
// 		});
// 	}

// 	if (msg.type === 'clear') {
// 		self.postMessage({ type: 'cleared' });
// 	}
// };
