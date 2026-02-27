export interface StorageConfig {
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	endpoint?: string;
}

export interface UploadResult {
	key: string;
	size: number;
}
