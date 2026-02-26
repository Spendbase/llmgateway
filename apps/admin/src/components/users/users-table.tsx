import { Badge } from "@/components/ui/badge";

import { BlockUserButton } from "./block-user-button";
import { UsersColumnHeader } from "./users-column-header";

import type { AdminUser } from "@/lib/types";

export function UsersTable({ users }: { users: AdminUser[] }) {
	return (
		<div className="rounded-md border overflow-x-auto max-w-full">
			<table className="min-w-[1100px] w-max text-sm text-left">
				<thead className="bg-gray-50 text-gray-700 h-14">
					<tr>
						<th className="px-4 py-2 font-medium">
							<UsersColumnHeader
								title="User ID"
								sortKey="id"
								filterKey="userId"
								filterType="text"
							/>
						</th>
						<th className="px-4 py-2 font-medium">
							<UsersColumnHeader
								title="Name"
								sortKey="name"
								filterKey="name"
								filterType="text"
							/>
						</th>
						<th className="px-4 py-2 font-medium">
							<UsersColumnHeader
								title="Email"
								sortKey="email"
								filterKey="email"
								filterType="text"
							/>
						</th>
						<th className="px-4 py-2 font-medium">
							<UsersColumnHeader
								title="Organizations & Roles"
								filterKey="role"
								filterType="select"
								filterOptions={[
									{ label: "Owner", value: "owner" },
									{ label: "Admin", value: "admin" },
									{ label: "Developer", value: "developer" },
								]}
							/>
						</th>
						<th className="px-4 py-2 font-medium">
							<UsersColumnHeader
								title="Registration Date"
								sortKey="createdAt"
								filterType="date"
							/>
						</th>
						<th className="px-4 py-2 font-medium">
							<UsersColumnHeader
								title="Email Status"
								sortKey="emailVerified"
								filterKey="emailStatus"
								filterType="select"
								filterOptions={[
									{ label: "Verified", value: "verified" },
									{ label: "Unverified", value: "unverified" },
								]}
							/>
						</th>
						<th className="px-4 py-2 font-medium">
							<UsersColumnHeader
								title="Account Status"
								sortKey="status"
								filterKey="accountStatus"
								filterType="select"
								filterOptions={[
									{ label: "Active", value: "active" },
									{ label: "Blocked", value: "blocked" },
								]}
							/>
						</th>
						<th className="px-4 py-2 font-medium">
							<UsersColumnHeader
								title="Referral"
								sortKey="referral"
								filterKey="referral"
								filterType="text"
							/>
						</th>
						<th className="px-4 py-2 font-medium">
							<span className="text-sm font-medium">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{users.length === 0 ? (
						<tr>
							<td colSpan={9} className="p-8 text-center text-muted-foreground">
								No users found matching current filters.
							</td>
						</tr>
					) : (
						users.map((user) => (
							<tr key={user.id} className="border-t">
								<td className="p-4 font-mono text-xs max-w-[180px] truncate">
									<span title={user.id}>{user.id}</span>
								</td>
								<td className="p-4">{user.name || "-"}</td>
								<td className="p-4 max-w-[220px] truncate">
									<span title={user.email}>{user.email}</span>
								</td>
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
								<td className="p-4">
									{user.status === "blocked" ? (
										<Badge variant="destructive">Blocked</Badge>
									) : (
										<Badge className="bg-blue-600">Active</Badge>
									)}
								</td>
								<td className="p-4">{user.referral || "-"}</td>
								<td className="p-4">
									<BlockUserButton user={user} />
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
