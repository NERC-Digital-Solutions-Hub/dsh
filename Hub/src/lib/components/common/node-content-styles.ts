/**
 * Shared styling utilities for node content components
 */

// Base node styling that all node components share
export const baseNodeStyles =
	'mb-1 cursor-pointer rounded-md border border-border/30 p-2 text-left';

// Enhanced hover effects with smooth transitions
export const enhancedHoverStyles =
	'transform-gpu transition-all duration-150 ease-out hover:border-border/50 hover:bg-card/70 hover:shadow-sm';

// Simple hover effect (just background change)
export const simpleHoverStyles = 'transition-colors hover:bg-card/70';

// Font styling for text content
export const fontStyles = 'text-sm font-normal';

// Background states
export const defaultBgStyles = 'bg-card/50';
export const accentBgStyles = 'bg-accent text-accent-foreground';

/**
 * Get complete node styles based on configuration
 */
export function getNodeStyles(options: {
	enhancedHover?: boolean;
	includeFont?: boolean;
	pressed?: boolean;
}): string {
	const { enhancedHover = false, includeFont = false, pressed = false } = options;

	let styles = baseNodeStyles;

	// Add hover effects
	if (enhancedHover) {
		styles += ' ' + enhancedHoverStyles;
	} else {
		styles += ' ' + simpleHoverStyles;
	}

	// Add font styling if needed
	if (includeFont) {
		styles += ' ' + fontStyles;
	}

	// Add background state
	if (pressed) {
		styles += ' ' + accentBgStyles;
	} else {
		styles += ' ' + defaultBgStyles;
	}

	return styles;
}

/**
 * Toggle-specific styles for area-selection components
 */
export const toggleSpecificStyles =
	'!h-auto !min-h-9 !whitespace-normal data-[state=on]:!bg-accent data-[state=on]:!text-accent-foreground data-[state=on]:hover:!bg-accent data-[state=on]:hover:!text-accent-foreground';
