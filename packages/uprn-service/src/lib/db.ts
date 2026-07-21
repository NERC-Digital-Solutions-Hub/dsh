/** @deprecated Import repositories from `$lib/Persistence` in new code. */
export { clearUprnDatabase as clearDatabase, uprnDatabase as db } from './Persistence/UprnDatabase';
export type {
	DbCachedTransformedConfig,
	DbUprnAreaSelectionInfo,
	DbUprnDataSelectionInfo,
	DbUprnSelection,
	DbUserDownload
} from './Persistence/UprnDatabase';
export { selectionRepository } from './Persistence/SelectionRepository';
export { downloadRepository } from './Persistence/DownloadRepository';
