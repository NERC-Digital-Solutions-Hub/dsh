export interface LodSize {
	size: number;
	value: number;
}

export interface CustomRenderer {
	Id: number; // PK
	ClassBreaksGroupId: number;
	SymbolsId: number;
	LodsGroupId: number;
	CustomRendererType: number;
}

export interface CustomRendererClassBreak {
	Id: number;
	GroupId: number;
	Order: number;
	ClassMinValue: number;
	ClassMaxValue: number;
	Label: string | null;
	Description: string | null;
	CustomRendererId: number;
}

export interface CustomRendererField {
	Id: number; // PK 
	FieldId: number;
	CustomRendererId: number;
}

export interface CustomRendererLod {
	Id: number; // PK
	GroupId: number; 
	Lod: number;
	OutlineWidth: number;
}

export interface CustomRendererSymbol {
	Id: number; // PK 
	SymbolType: number;
	OutlineType: number;
}

export interface CustomRenderersSymbolAppearance {
	Id: number; // PK
	SymbolsId: number; 
	Order: number;
	SymbolColor: string;
	OutlineColor: string;
	OutlineWidth: number;
}

export interface FeatureLayer {
	Id: number; // PK
	WebMapId: string;
	Name: string;
}

export interface Field {
	Id: number; // PK
	FeatureLayerId: number; 
	Name: string;
}
