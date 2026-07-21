/** @deprecated Import repositories from `$lib/persistence` in new code. */
export {
	clearUprnDatabase as clearDatabase,
	uprnDatabase as db
} from './persistence/uprn-database';
export type {
	DbCachedTransformedConfig,
	DbUprnAreaSelectionInfo,
	DbUprnDataSelectionInfo,
	DbUprnSelection,
	DbUserDownload
} from './persistence/uprn-database';
export { selectionRepository } from './persistence/selection-repository';
export { downloadRepository } from './persistence/download-repository';
