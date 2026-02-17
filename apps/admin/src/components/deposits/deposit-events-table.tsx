import { Badge } from "@/components/ui/badge";

import type { paths } from "@/lib/api/v1";

type DepositDetailResponse =
	paths["/admin/deposits/:id"]["get"]["responses"]["200"]["content"]["application/json"];
type DepositEvent = DepositDetailResponse["events"][number];

export function DepositEventsTable({ events }: { events: DepositEvent[] }) {
	return (
		<div className="rounded-md border">
			<table className="w-full text-sm text-left">
				<thead className="bg-gray-50 text-gray-700">
					<tr>
						<th className="p-4 font-medium">Event Type</th>
						<th className="p-4 font-medium">New Status</th>
						<th className="p-4 font-medium">Admin User</th>
						<th className="p-4 font-medium">Description</th>
						<th className="p-4 font-medium">Date</th>
					</tr>
				</thead>
				<tbody className="divide-y">
					{events.map((event) => {
						const metadata = event.metadata as
							| Record<string, unknown>
							| undefined;
						const adminUserId =
							metadata && typeof metadata.adminUserId === "string"
								? metadata.adminUserId
								: undefined;
						const description =
							metadata && typeof metadata.description === "string"
								? metadata.description
								: undefined;
						// Use explicit type from metadata if available (e.g. "admin_credit_granted"), otherwise duplicate event.type
						const displayType =
							metadata && typeof metadata.type === "string"
								? metadata.type
								: event.type;

						return (
							<tr key={event.id} className="bg-white">
								<td className="p-4">
									<Badge variant="outline" className="font-mono text-xs">
										{displayType}
									</Badge>
								</td>
								<td className="p-4">
									{event.newStatus ? (
										<Badge
											variant={
												event.newStatus === "completed"
													? "default" // Using default (black) or success if available? ui/badge usually has default/secondary/destructive/outline.
													: event.newStatus === "failed"
														? "destructive"
														: "secondary"
											}
											className={
												event.newStatus === "completed"
													? "bg-green-600 hover:bg-green-700"
													: ""
											}
										>
											{event.newStatus}
										</Badge>
									) : (
										<span className="text-gray-400">-</span>
									)}
								</td>
								<td className="p-4 text-gray-600 font-mono text-xs">
									{adminUserId || "-"}
								</td>
								<td
									className="p-4 text-gray-600 max-w-[200px] truncate"
									title={description}
								>
									{description || "-"}
								</td>
								<td className="p-4 text-gray-600">
									{new Date(event.createdAt).toLocaleString()}
								</td>
							</tr>
						);
					})}
					{events.length === 0 && (
						<tr>
							<td colSpan={5} className="p-8 text-center text-gray-500">
								No audit event records found.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
