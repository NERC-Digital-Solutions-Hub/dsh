export type NavLink = {
	type: 'link';
	name: string;
	href: string;
	info?: string;
};

export type NavFolder = {
	type: 'folder';
	name: string;
	children: NavLink[];
};

export type NavItem = NavFolder | NavLink;
