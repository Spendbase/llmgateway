import { userSignups } from "@services/metrics.service";

export async function registerUser(dto: RegisterDto) {
	userSignups.inc();

	return user;
}
