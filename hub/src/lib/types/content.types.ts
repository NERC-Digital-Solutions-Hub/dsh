export type HubSettings = {
	enableIntroductionPopup: boolean;
};

export type HomeContent = {
	introduction: string;
	body: HomeContentBody;
	settings: HubSettings;
};

export type HomeContentBody = {
	title: string;
	version: string;
	description: string;
};
