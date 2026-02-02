export interface GoogleUser {
	email: string;
	firstName?: string;
	lastName?: string;
	fullName?: string;
	department?: string;
}

export type GoogleUserRole = "developer" | "admin";

export interface ImportError {
	email: string;
	reason: string;
}

export interface ImportResult {
	successCount: number;
	warningCount: number;
	failedCount: number;
	errors?: ImportError[];
}
