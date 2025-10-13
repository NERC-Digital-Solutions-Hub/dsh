export function decodeHtmlEntities(s: string): string {
	return s
		.replace(/&deg;/gi, '°')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>');
}
