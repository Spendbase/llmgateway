import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createS3Client, getStorageConfig } from "./client.js";

import type { StorageConfig, UploadResult } from "./types.js";
import type { S3Client } from "@aws-sdk/client-s3";

export class StorageService {
	private readonly client: S3Client;
	private readonly bucket: string;

	public constructor(config?: StorageConfig) {
		const resolved = config ?? getStorageConfig();
		this.client = createS3Client(resolved);
		this.bucket = resolved.bucket;
	}

	public async upload(
		buffer: Buffer,
		key: string,
		contentType: string,
	): Promise<UploadResult> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: buffer,
				ContentType: contentType,
			}),
		);

		return { key, size: buffer.byteLength };
	}

	public async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
		return await getSignedUrl(
			this.client,
			new GetObjectCommand({ Bucket: this.bucket, Key: key }),
			{ expiresIn },
		);
	}

	public async delete(key: string): Promise<void> {
		await this.client.send(
			new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
		);
	}

	public generateKey(prefix: string, ext: string): string {
		const uuid = crypto.randomUUID();
		return `${prefix}/${uuid}.${ext}`;
	}
}

let _instance: StorageService | null = null;

export function getStorageService(): StorageService {
	if (!_instance) {
		_instance = new StorageService();
	}
	return _instance;
}
