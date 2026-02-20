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
