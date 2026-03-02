/**
 * Sidebar Components
 *
 * A collection of components for creating resizable sidebars with various positioning options.
 * Provides layout management, positioning constants, and individual sidebar components.
 */

import SidebarPosition from '$lib/Components/Sidebar/sidebar-position';

export { SidebarPosition } from './sidebar-position';
export { default as Sidebar } from './Sidebar.svelte';
export { default as Root } from './SidebarRoot.svelte';
export type PositionType = (typeof SidebarPosition)[keyof typeof SidebarPosition];
