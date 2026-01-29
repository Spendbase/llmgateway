export interface GoogleUser {
	email: string;
	firstName?: string;
	lastName?: string;
	fullName?: string;
	department?: string;
}

export type RoledGoogleUser = "developer" | "admin";
