<script lang="ts">
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/Components/shadcn/card';
	import { ScrollArea } from '$lib/Components/shadcn/scroll-area';
	import rehypeStringify from 'rehype-stringify';
	import remarkGfm from 'remark-gfm';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';
	import { rehypeReferences } from '@dsh/common';

	const paths = {
		fileIdentifier: '//*[local-name()="fileIdentifier"]/*[local-name()="CharacterString"]',
		metadataLanguage: '//*[local-name()="language"]/*[local-name()="LanguageCode"]/@codeListValue',
		hierarchyLevel:
			'//*[local-name()="hierarchyLevel"]/*[local-name()="MD_ScopeCode"]/@codeListValue',
		dateStamp: '//*[local-name()="dateStamp"]/*',
		creationDate:
			'//*[local-name()="CI_Citation"]/*[local-name()="date"]/*[local-name()="CI_Date"][*[local-name()="dateType"]/*[local-name()="CI_DateTypeCode"]/@codeListValue="creation"]/*[local-name()="date"]/*[1]',
		publicationDate:
			'//*[local-name()="CI_Citation"]/*[local-name()="date"]/*[local-name()="CI_Date"][*[local-name()="dateType"]/*[local-name()="CI_DateTypeCode"]/@codeListValue="publication"]/*[local-name()="date"]/*[1]',
		title:
			'//*[local-name()="identificationInfo"]//*[local-name()="citation"]/*[local-name()="CI_Citation"]/*[local-name()="title"]/*[local-name()="CharacterString"]',
		alternateTitle:
			'//*[local-name()="identificationInfo"]//*[local-name()="citation"]/*[local-name()="CI_Citation"]/*[local-name()="alternateTitle"]/*[local-name()="CharacterString"]',
		abstract:
			'//*[local-name()="identificationInfo"]//*[local-name()="abstract"]/*[local-name()="CharacterString"]',
		purpose:
			'//*[local-name()="identificationInfo"]//*[local-name()="purpose"]/*[local-name()="CharacterString"]',
		status:
			'//*[local-name()="identificationInfo"]//*[local-name()="status"]/*[local-name()="MD_ProgressCode"]/@codeListValue',
		credit:
			'//*[local-name()="identificationInfo"]//*[local-name()="credit"]/*[local-name()="CharacterString"]',
		lineage:
			'//*[local-name()="dataQualityInfo"]//*[local-name()="lineage"]//*[local-name()="statement"]/*[local-name()="CharacterString"]',
		keyword:
			'//*[local-name()="identificationInfo"]//*[local-name()="descriptiveKeywords"]//*[local-name()="keyword"]/*[local-name()="CharacterString"]',
		topicCategory:
			'//*[local-name()="identificationInfo"]//*[local-name()="topicCategory"]/*[local-name()="MD_TopicCategoryCode"]',

		westBoundLongitude:
			'//*[local-name()="identificationInfo"]//*[local-name()="extent"]//*[local-name()="westBoundLongitude"]/*[local-name()="Decimal"]',
		eastBoundLongitude:
			'//*[local-name()="identificationInfo"]//*[local-name()="extent"]//*[local-name()="eastBoundLongitude"]/*[local-name()="Decimal"]',
		southBoundLatitude:
			'//*[local-name()="identificationInfo"]//*[local-name()="extent"]//*[local-name()="southBoundLatitude"]/*[local-name()="Decimal"]',
		northBoundLatitude:
			'//*[local-name()="identificationInfo"]//*[local-name()="extent"]//*[local-name()="northBoundLatitude"]/*[local-name()="Decimal"]',

		spatialRepresentationType:
			'//*[local-name()="identificationInfo"]//*[local-name()="spatialRepresentationType"]/*[local-name()="MD_SpatialRepresentationTypeCode"]/@codeListValue',
		language:
			'//*[local-name()="identificationInfo"]//*[local-name()="language"]/*[local-name()="LanguageCode"]/@codeListValue',

		organisationName:
			'//*[local-name()="contact"]//*[local-name()="organisationName"]/*[local-name()="CharacterString"]',
		contactEmail:
			'//*[local-name()="contact"]//*[local-name()="electronicMailAddress"]/*[local-name()="CharacterString"]',

		pointOfContactOrganisation:
			'//*[local-name()="identificationInfo"]//*[local-name()="pointOfContact"]//*[local-name()="organisationName"]/*[local-name()="CharacterString"]',
		pointOfContactEmail:
			'//*[local-name()="identificationInfo"]//*[local-name()="pointOfContact"]//*[local-name()="electronicMailAddress"]/*[local-name()="CharacterString"]',

		referenceSystem:
			'//*[local-name()="referenceSystemInfo"]//*[local-name()="code"]/*[local-name()="CharacterString"]',

		distributionFormat:
			'//*[local-name()="distributionInfo"]//*[local-name()="distributionFormat"]//*[local-name()="name"]/*[local-name()="CharacterString"]',
		onlineResource:
			'//*[local-name()="distributionInfo"]//*[local-name()="onLine"]//*[local-name()="linkage"]/*[local-name()="URL"]'
	};

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'isoMetadata' }>;
	};

	let { content }: Props = $props();

	const metadata = $derived({
		title: getXmlValue(content.text, paths.title),
		abstract: getXmlValue(content.text, paths.abstract),
		organisationName: getXmlValue(content.text, paths.organisationName),
		creationDate: getXmlValue(content.text, paths.creationDate),
		publicationDate: getXmlValue(content.text, paths.publicationDate),
		purpose: getXmlValue(content.text, paths.purpose),
		credit: getXmlValue(content.text, paths.credit),
		lineage: getXmlValue(content.text, paths.lineage),
		keywords: getXmlValues(content.text, paths.keyword),
		contactEmail: getXmlValue(content.text, paths.contactEmail),
		pointOfContactOrganisation: getXmlValue(content.text, paths.pointOfContactOrganisation),
		pointOfContactEmail: getXmlValue(content.text, paths.pointOfContactEmail)
	});

	/** Derived state for processing the fetched abstract content into HTML. */
	let abstractHtml: Promise<string | null> = $derived.by(async () => {
		if (!metadata.abstract) {
			return null;
		}

		const cleanedAbstract = normalizeMarkdown(metadata.abstract);

		const htmlRaw = await unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkRehype)
			.use(rehypeReferences)
			.use(rehypeStringify)
			.process(cleanedAbstract);

		console.log('Processed HTML:', htmlRaw.toString());

		return htmlRaw.toString();
	});

	function parseXml(xmlString: string): XMLDocument {
		const doc = new DOMParser().parseFromString(xmlString, 'application/xml');

		if (doc.querySelector('parsererror')) {
			throw new Error('Invalid XML');
		}

		return doc;
	}

	function getNsResolver(): XPathNSResolver {
		const namespaces: Record<string, string> = {
			gmd: 'http://www.isotc211.org/2005/gmd',
			gco: 'http://www.isotc211.org/2005/gco',
			gml: 'http://www.opengis.net/gml'
		};

		return {
			lookupNamespaceURI(prefix: string | null): string | null {
				if (!prefix) return null;
				return namespaces[prefix] ?? null;
			}
		};
	}

	/**
	 * Extracts a value from an XML string using the provided XPath expression.
	 * @param xmlString The XML string to parse.
	 * @param xpath The XPath expression to evaluate.
	 * @returns The extracted value, or null if not found or if the XML is invalid.
	 */
	function getXmlValue(xmlString: string, xpath: string): string | null {
		const doc = parseXml(xmlString);
		const result = doc.evaluate(xpath, doc, getNsResolver(), XPathResult.STRING_TYPE, null);
		return result.stringValue.trim() || null;
	}

	function getXmlValues(xmlString: string, xpath: string): string[] {
		const doc = parseXml(xmlString);
		const result = doc.evaluate(
			xpath,
			doc,
			getNsResolver(),
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);

		const values: string[] = [];

		for (let i = 0; i < result.snapshotLength; i++) {
			const node = result.snapshotItem(i);
			const value = node?.textContent?.trim();

			if (value) values.push(value);
		}

		return [...new Set(values)];
	}

	function formatDate(value: string | null): string {
		if (!value) return 'Not provided';

		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
	}

	function normalizeMarkdown(value: string): string {
		const untabbed = value.replace(/\t/g, ' ');
		const lines = untabbed.split(/\r?\n/);

		while (lines.length > 0 && lines[0].trim() === '') lines.shift();
		while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

		const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
		const minIndent = nonEmptyLines.reduce((min, line) => {
			const match = line.match(/^ +/);
			const indent = match ? match[0].length : 0;
			return Math.min(min, indent);
		}, Number.POSITIVE_INFINITY);

		const sharedIndent = Number.isFinite(minIndent) ? minIndent : 0;

		return lines
			.map((line) => {
				const dedented =
					sharedIndent > 0 ? line.replace(new RegExp(`^ {0,${sharedIndent}}`), '') : line;

				// Markdown treats 4+ leading spaces as an indented code block.
				// ISO XML often carries pretty-print indentation that is not semantic markdown.
				const safeIndent = dedented.replace(/^ {4,}/, '');

				return safeIndent.replace(/[ \t]+$/, '');
			})
			.join('\n');
	}
</script>

<Card class="w-full h-full p-2">
	<ScrollArea class="h-full w-full">
		<CardHeader class="space-y-3">
			<!-- <CardTitle class="text-2xl leading-tight">
				{metadata.title ?? 'Untitled dataset'}
			</CardTitle> -->
		</CardHeader>

		<CardContent class="space-y-6">
			{#if metadata.purpose}
				<section class="rounded-lg border p-4 text-sm text-muted-foreground">
					<span class="font-semibold text-foreground">Purpose:</span>
					{' '}{metadata.purpose}
				</section>
			{/if}

			<!-- <div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-lg border p-4">
					<div class="text-sm font-medium text-muted-foreground">Date</div>
					<div class="mt-1 space-y-1 text-sm">
						{#if metadata.creationDate}
							<div class="flex items-baseline gap-1">
								{formatDate(metadata.creationDate)}
								<p class="text-xs text-muted-foreground">(Creation)</p>
							</div>
						{/if}
						{#if metadata.publicationDate}
							<div class="flex items-baseline gap-1">
								{formatDate(metadata.publicationDate)}
								<p class="text-xs text-muted-foreground">(Publication)</p>
							</div>
						{/if}
					</div>
				</div>

				<div class="rounded-lg border p-4">
					<div class="text-sm font-medium text-muted-foreground">Organisation</div>
					<div class="mt-1 text-sm">{metadata.organisationName ?? 'Not provided'}</div>
				</div>
			</div> -->

			<section class="space-y-2">
				<h2 class="text-base font-semibold">Description</h2>
				{#if abstractHtml}
					{#await abstractHtml}
						<p>Loading...</p>
					{:then html}
						<article class="prose-info-markdown">
							{@html html}
						</article>
					{:catch error}
						<p>Error loading content: {error.message}</p>
					{/await}
				{:else}
					<p class="text-sm leading-6 text-muted-foreground">
						{metadata.abstract ? normalizeMarkdown(metadata.abstract) : 'No description available.'}
					</p>
				{/if}
			</section>

			{#if metadata.contactEmail || metadata.pointOfContactEmail || metadata.organisationName || metadata.pointOfContactOrganisation}
				<section class="space-y-3">
					<h2 class="text-base font-semibold">Contact</h2>

					<div class="rounded-lg border p-4 space-y-2 text-sm">
						<div>
							<span class="font-medium font-semibold">Point of Contact: </span>
							{metadata.pointOfContactOrganisation ?? metadata.organisationName ?? 'Not provided'}
						</div>

						<div>
							<span class="font-medium font-semibold">Email: </span>
							{#if metadata.pointOfContactEmail ?? metadata.contactEmail}
								<a
									class="text-primary underline underline-offset-4"
									href={`mailto:${metadata.pointOfContactEmail ?? metadata.contactEmail}`}
								>
									{metadata.pointOfContactEmail ?? metadata.contactEmail}
								</a>
							{:else}
								<span>Not provided</span>
							{/if}
						</div>
					</div>
				</section>
			{/if}

			{#if metadata.lineage}
				<section class="space-y-2">
					<h2 class="text-base font-semibold">Lineage</h2>
					<div class="rounded-lg border p-4">
						<p class="text-sm leading-6 text-muted-foreground">
							{metadata.lineage}
						</p>
					</div>
				</section>
			{/if}

			<section class="space-y-4 border-t pt-6">
				{#if metadata.credit}
					<div class="rounded-lg bg-muted/40 p-4">
						<h2 class="text-base font-semibold">Credits</h2>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">
							{metadata.credit}
						</p>
					</div>
				{/if}

				{#if metadata.keywords.length > 0}
					<div class="space-y-3">
						<h2 class="text-base font-semibold">Tags</h2>

						<div class="flex flex-wrap gap-2">
							{#each metadata.keywords as keyword}
								<span
									class="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
								>
									{keyword}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		</CardContent>
	</ScrollArea>
</Card>
