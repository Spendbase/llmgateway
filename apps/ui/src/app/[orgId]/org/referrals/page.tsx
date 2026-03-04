import { fetchServerData } from "@/lib/server-api";

import { ReferralsClient } from "./referrals-client";

export const dynamic = "force-dynamic";

interface ReferralStatsData {
	referredCount: number;
}

async function fetchReferralStats(orgId: string): Promise<ReferralStatsData> {
	const data = await fetchServerData<ReferralStatsData>(
		"GET",
		"/orgs/{id}/referral-stats",
		{
			params: {
				path: { id: orgId },
			},
		},
	);

	return data || { referredCount: 0 };
}

export default async function ReferralsPage({
	params,
}: {
	params: Promise<{ orgId: string }>;
}) {
	const { orgId } = await params;

	if (!orgId) {
		return (
			<div className="flex flex-col">
				<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl md:text-3xl font-bold tracking-tight">
							Referrals
						</h2>
					</div>
					<div className="text-center py-8 text-muted-foreground">
						No organization selected
					</div>
				</div>
			</div>
		);
	}

	const stats = await fetchReferralStats(orgId);

	return <ReferralsClient referredCount={stats.referredCount} />;
}
