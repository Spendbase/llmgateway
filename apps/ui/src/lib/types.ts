import type {
	SerializedOrganization,
	SerializedProject,
	SerializedUser,
	SerializedApiKey,
	SerializedApiKeyIamRule,
} from "@llmgateway/db";

export type Organization = SerializedOrganization;
export type Project = SerializedProject;
export type User = SerializedUser | null;

export type ApiKey = Omit<SerializedApiKey, "token"> & {
	token?: string;
	maskedToken: string;
	iamRules?: Omit<SerializedApiKeyIamRule, "apiKeyId">[];
};
