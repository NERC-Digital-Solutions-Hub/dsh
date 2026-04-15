export type HomeLocalConfig = {
	baseUrl: string;
	sitePath: string;
};

export type RemoteSiteConfig = {
	environment: string;
};

export type RootManifestFiles = {
	introduction: string;
	settings: string;
};

export type ManifestPage = {
	route: string;
};

/**
 * Single page entry for /apps/uprn-service within manifest.testing.json.
 */
export type RootManifestPage = {
	route: '/';
	files: RootManifestFiles;
} & ManifestPage;

/**
 * Represets the site manifest for content served from the dsh-content repository.
 */
export type SiteManifest = {
	version: string;
	environment: string;
	pages: ManifestPage[];
};

/**
 * Represents the site settings defined in the settings JSON. These settings are used to control various 
 * aspects of the site's behavior and appearance.
 */
export type SiteSettings = {
	enableIntroductionPopup: boolean;
};