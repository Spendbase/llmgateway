import { Badge } from "@/components/ui/badge";

import type { AdminUser } from "@/lib/types";

export function UsersTable({ users }: { users: AdminUser[] }) {
	return (
		<div className="rounded-md border">
			<table className="w-full text-sm text-left">
				<thead className="bg-gray-50 text-gray-700">
					<tr>
						<th className="p-4">User ID</th>
						<th className="p-4">Name</th>
						<th className="p-4">Email</th>
						<th className="p-4">Organizations & Roles</th>
						<th className="p-4">Registration Date</th>
						<th className="p-4">Status</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr key={user.id} className="border-t">
							<td className="p-4 font-mono text-xs">{user.id}</td>
							<td className="p-4">{user.name || "-"}</td>
							<td className="p-4">{user.email}</td>
							<td className="p-4">
								{user.organizations.length > 0 ? (
									<div className="flex flex-col gap-1">
										{user.organizations.map((org) => (
											<div
												key={org.organizationId}
												className="text-xs text-gray-600"
											>
												{org.organizationName}{" "}
												<Badge variant="outline" className="ml-1 text-xs">
													{org.role}
												</Badge>
											</div>
										))}
									</div>
								) : (
									<span className="text-gray-400">No organizations</span>
								)}
							</td>
							<td className="p-4">
								{new Date(user.createdAt).toLocaleDateString()}
							</td>
							<td className="p-4">
								{user.emailVerified ? (
									<Badge className="bg-green-600">Verified</Badge>
								) : (
									<Badge variant="secondary">Unverified</Badge>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
