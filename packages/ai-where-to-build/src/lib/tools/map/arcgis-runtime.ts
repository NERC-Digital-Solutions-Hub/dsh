import { arcgisImport } from '@dsh/common/arcgis';

export type ArcgisGeometryOperators = {
	bufferOperator: typeof import('@arcgis/core/geometry/operators/bufferOperator.js');
	differenceOperator: typeof import('@arcgis/core/geometry/operators/differenceOperator.js');
	intersectionOperator: typeof import('@arcgis/core/geometry/operators/intersectionOperator.js');
	unionOperator: typeof import('@arcgis/core/geometry/operators/unionOperator.js');
};

let geometryOperatorsPromise: Promise<ArcgisGeometryOperators> | null = null;
let graphicPromise: Promise<typeof import('@arcgis/core/Graphic.js').default> | null = null;

export function loadGraphic(): Promise<typeof import('@arcgis/core/Graphic.js').default> {
	if (!graphicPromise) {
		graphicPromise =
			arcgisImport<typeof import('@arcgis/core/Graphic.js').default>('@arcgis/core/Graphic.js');
	}
	return graphicPromise;
}

export function loadGeometryOperators(): Promise<ArcgisGeometryOperators> {
	if (!geometryOperatorsPromise) {
		geometryOperatorsPromise = arcgisImport<
			[
				typeof import('@arcgis/core/geometry/operators/bufferOperator.js'),
				typeof import('@arcgis/core/geometry/operators/differenceOperator.js'),
				typeof import('@arcgis/core/geometry/operators/intersectionOperator.js'),
				typeof import('@arcgis/core/geometry/operators/unionOperator.js')
			]
		>([
			'@arcgis/core/geometry/operators/bufferOperator.js',
			'@arcgis/core/geometry/operators/differenceOperator.js',
			'@arcgis/core/geometry/operators/intersectionOperator.js',
			'@arcgis/core/geometry/operators/unionOperator.js'
		]).then(([bufferOperator, differenceOperator, intersectionOperator, unionOperator]) => ({
			bufferOperator,
			differenceOperator,
			intersectionOperator,
			unionOperator
		}));
	}

	return geometryOperatorsPromise;
}
