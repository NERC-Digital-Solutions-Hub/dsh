export type HomeLocalConfig = {
	baseUrl: string;
	sitePath?: string;
};

/**
 * Represents the site settings defined in the settings JSON. These settings are used to control various 
 * aspects of the site's behavior and appearance.
 */
export type SiteSettings = {
	enableIntroductionPopup: boolean;
};
