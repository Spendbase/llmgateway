import { S3Client } from "@aws-sdk/client-s3";

import type { StorageConfig } from "./types.js";

export function createS3Client(config: StorageConfig): S3Client {
	return new S3Client({
		region: config.region,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
	});
}

export function getStorageConfig(): StorageConfig {
	const region = process.env.S3_REGION;
	const bucket = process.env.S3_BUCKET_NAME;
	const accessKeyId = process.env.S3_ACCESS_KEY_ID;
	const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

	if (!region || !bucket || !accessKeyId || !secretAccessKey) {
		throw new Error(
			"Missing required S3 environment variables: S3_REGION, S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY",
		);
	}

	return {
		region,
		bucket,
		accessKeyId,
		secretAccessKey,
		endpoint: process.env.S3_ENDPOINT || undefined,
	};
}
