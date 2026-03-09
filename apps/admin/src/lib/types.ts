import type { tables } from "@llmgateway/db";

export type User = {
	id: string;
	email: string;
	name: string | null;
} | null;

type OrganizationBase = typeof tables.organization.$inferSelect;

export type Organization = Omit<
	OrganizationBase,
	"status" | "plan" | "retentionLevel"
> & {
	plan: "free" | "pro";
	retentionLevel: "retain" | "none";
	status: "active" | "inactive" | "deleted" | null;
};

export type SerializedOrganization = Omit<
	Organization,
	| "createdAt"
	| "updatedAt"
	| "planExpiresAt"
	| "stripeCustomerId"
	| "stripeSubscriptionId"
	| "subscriptionCancelled"
	| "trialStartDate"
	| "trialEndDate"
	| "isTrialActive"
> & {
	createdAt: string;
	updatedAt: string;
	planExpiresAt: string | null;
};

export interface AdminUser {
	id: string;
	name: string | null;
	email: string;
	emailVerified: boolean;
	createdAt: Date;
	status: "active" | "blocked";
	referral: string | null;
	organizations: Array<{
		organizationId: string;
		organizationName: string;
		role: "owner" | "admin" | "developer";
	}>;
}

export interface UsersPaginationResponse {
	users: AdminUser[];
	pagination: {
		page: number;
		pageSize: number;
		totalUsers: number;
		totalPages: number;
	};
}

export interface OrganizationsPaginationResponse {
	organizations: Organization[];
	suggestions: string[];
	pagination: {
		page: number;
		pageSize: number;
		totalOrganizations: number;
		totalPages: number;
	};
}

export interface OrgAnalyticsOverview {
	id: string;
	name: string;
	billingEmail: string | null;
	plan: "free" | "pro";
	status: "active" | "inactive" | "deleted" | null;
	credits: string;
	createdAt: string;
	projectsCount: number;
	membersCount: number;
	activeApiKeysCount: number;
	totalRequests: number;
	totalTokens: number;
	totalCost: number;
}

export interface OrgApiKeyItem {
	id: string;
	description: string | null;
	status: "active" | "inactive" | "deleted";
	createdAt: string;
	projectId: string;
	projectName: string | null;
	usage: number | null;
	usageLimit: number | null;
	lastUsedAt: string | null;
}

export interface OrgUsageMonth {
	month: string;
	requests: number;
	promptTokens: number;
	completionTokens: number;
	reasoningTokens: number;
	totalTokens: number;
	cost: number;
}

export interface OrgUsageResponse {
	months: OrgUsageMonth[];
	totals: {
		requests: number;
		promptTokens: number;
		completionTokens: number;
		reasoningTokens: number;
		totalTokens: number;
		cost: number;
	};
}

export interface OrgMember {
	userId: string;
	name: string | null;
	email: string;
	role: "owner" | "admin" | "developer";
	status: "active" | "blocked";
	lastLoginAt: string | null;
	joinedAt: string;
}

export interface OrgMembersResponse {
	members: OrgMember[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

export interface OrgProject {
	id: string;
	name: string;
	status: "active" | "inactive" | "deleted";
	mode: "api-keys" | "credits" | "hybrid";
	cachingEnabled: boolean;
	createdAt: string;
	activeApiKeysCount: number;
}

export interface OrgProjectsResponse {
	projects: OrgProject[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

export interface OrgDepositItem {
	id: string;
	createdAt: string;
	type: string;
	amount: string | null;
	creditAmount: string | null;
	currency: string;
	status: "pending" | "completed" | "failed";
	description: string | null;
}

export interface OrgApiKeysResponse {
	apiKeys: OrgApiKeyItem[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

export interface OrgDepositsResponse {
	deposits: OrgDepositItem[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

export interface OrgLogsResponse {
	logs: Record<string, unknown>[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

export interface ModelAnalyticsItem {
	id: string;
	name: string;
	family: string;
	status: string;
	logsCount: number;
	errorsCount: number;
	clientErrorsCount: number;
	gatewayErrorsCount: number;
	upstreamErrorsCount: number;
	cachedCount: number;
	avgTimeToFirstToken: number | null;
	errorRate: number;
	cacheHitRate: number;
}

export interface ProviderAnalyticsItem {
	id: string;
	name: string;
	status: string;
	logsCount: number;
	errorsCount: number;
	clientErrorsCount: number;
	gatewayErrorsCount: number;
	upstreamErrorsCount: number;
	cachedCount: number;
	avgTimeToFirstToken: number | null;
	errorRate: number;
	cacheHitRate: number;
}

export interface PlatformAnalyticsResponse {
	models: ModelAnalyticsItem[];
	providers: ProviderAnalyticsItem[];
}

export interface TimeSeriesPoint {
	timestamp: string;
	logsCount: number;
	errorsCount: number;
	cachedCount: number;
	totalTokens: number;
}

export interface RevenueTrendPoint {
	date: string;
	revenue: number;
	creditTopups: number;
	subscriptions: number;
}

export interface TimeSeriesAnalyticsResponse {
	window: "6h" | "24h" | "7d" | "30d" | "90d" | "all";
	bucketSize: string;
	series: TimeSeriesPoint[];
	revenueTrend: RevenueTrendPoint[];
}
