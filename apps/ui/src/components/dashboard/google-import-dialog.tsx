import { Loader2, CheckCircle2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useApi } from "@/lib/fetch-client";

interface GoogleUser {
	email: string;
	fullName: string;
	department?: string;
}

interface Props {
	isOpen: boolean;
	onClose: () => void;
	accessToken: string | null;
	organizationId: string;
	existingEmails: string[];
	onSuccess: () => void;
}

const GoogleImportDialog = ({
	isOpen,
	onClose,
	accessToken,
	organizationId,
	existingEmails = [],
	onSuccess,
}: Props) => {
	const api = useApi();

	const [step, setStep] = useState<
		"LOADING" | "SELECT" | "IMPORTING" | "RESULT"
	>("LOADING");

	const [discoveredUsers, setDiscoveredUsers] = useState<GoogleUser[]>([]);
	const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
	const [role, setRole] = useState("member");
	const [importStats, setImportStats] = useState({ success: 0, failed: 0 });

	useEffect(() => {
		if (isOpen && accessToken) {
			loadUsers();
		}
	}, [isOpen, accessToken]);

	const loadUsers = async () => {
		setStep("LOADING");
		try {
			const res = await api.post(`/google-workspace/users`, { accessToken });
			const data = res.data || res;

			setDiscoveredUsers(data);

			const newUsers = data
				.filter((u: GoogleUser) => !existingEmails.includes(u.email))
				.map((u: GoogleUser) => u.email);

			setSelectedEmails(new Set(newUsers));
			setStep("SELECT");
		} catch (e) {
			toast.error("Failed to load users from Google");
			onClose();
		}
	};

	const toggleAll = (checked: boolean) => {
		if (checked) {
			const validEmails = discoveredUsers
				.filter((u) => !existingEmails.includes(u.email))
				.map((u) => u.email);
			setSelectedEmails(new Set(validEmails));
		} else {
			setSelectedEmails(new Set());
		}
	};

	const toggleUser = (email: string) => {
		const next = new Set(selectedEmails);
		if (next.has(email)) {
			next.delete(email);
		} else {
			next.add(email);
		}
		setSelectedEmails(next);
	};

	const handleImport = async () => {
		setStep("IMPORTING");
		const usersToImport = discoveredUsers.filter((u) =>
			selectedEmails.has(u.email),
		);

		try {
			const res = await api.post(`/google-workspace/import`, {
				users: usersToImport,
				role: role,
				organizationId: organizationId,
			});

			const result = res.data || res;
			setImportStats({
				success: result.successCount,
				failed: result.failedCount,
			});
			setStep("RESULT");
			onSuccess();
		} catch (e) {
			toast.error("Import failed");
			setStep("SELECT");
		}
	};

	const availableUsersCount = discoveredUsers.filter(
		(u) => !existingEmails.includes(u.email),
	).length;
	const isAllSelected =
		selectedEmails.size === availableUsersCount && availableUsersCount > 0;

	return (
		<Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
			<DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col">
				<DialogHeader>
					<DialogTitle>Import Team from Google Workspace</DialogTitle>
					<DialogDescription>
						{step === "SELECT" && "Select users to add to your organization."}
						{step === "RESULT" && "Import completed."}
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-hidden py-4">
					{step === "LOADING" && (
						<div className="h-full flex flex-col items-center justify-center space-y-4">
							<Loader2 className="h-10 w-10 animate-spin text-primary" />
							<p className="text-muted-foreground">
								Scanning Google Directory...
							</p>
						</div>
					)}

					{step === "SELECT" && (
						<div className="flex flex-col h-full space-y-4">
							<div className="flex items-center justify-between px-1">
								<div className="flex items-center space-x-4">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium">Role:</span>
										<Select value={role} onValueChange={setRole}>
											<SelectTrigger className="w-[130px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="member">Member</SelectItem>
												<SelectItem value="admin">Admin</SelectItem>
												<SelectItem value="owner">Owner</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<span className="text-sm text-muted-foreground">
										Selected: <strong>{selectedEmails.size}</strong>
									</span>
								</div>
							</div>

							<div className="border rounded-md flex-1 relative overflow-hidden">
								<ScrollArea className="h-full">
									<Table>
										<TableHeader className="sticky top-0 bg-background z-10">
											<TableRow>
												<TableHead className="w-[50px]">
													<Checkbox
														checked={isAllSelected}
														onCheckedChange={toggleAll}
														disabled={availableUsersCount === 0}
													/>
												</TableHead>
												<TableHead>User</TableHead>
												<TableHead>Email</TableHead>
												<TableHead>Department</TableHead>
												<TableHead className="text-right">Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{discoveredUsers.map((user) => {
												const isExisting = existingEmails.includes(user.email);
												return (
													<TableRow
														key={user.email}
														className={isExisting ? "bg-muted/50" : ""}
													>
														<TableCell>
															<Checkbox
																checked={selectedEmails.has(user.email)}
																onCheckedChange={() => toggleUser(user.email)}
																disabled={isExisting}
															/>
														</TableCell>
														<TableCell className="font-medium">
															{user.fullName || user.firstName}
														</TableCell>
														<TableCell className="text-muted-foreground text-sm">
															{user.email}
														</TableCell>
														<TableCell>
															{user.department ? (
																<Badge
																	variant="outline"
																	className="text-xs font-normal"
																>
																	{user.department}
																</Badge>
															) : (
																<span className="text-xs text-muted-foreground">
																	-
																</span>
															)}
														</TableCell>
														<TableCell className="text-right">
															{isExisting ? (
																<span className="flex items-center justify-end text-xs text-yellow-600 font-medium">
																	<UserCheck className="w-3 h-3 mr-1" />
																	Member
																</span>
															) : (
																<span className="text-xs text-green-600 font-medium">
																	New
																</span>
															)}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</ScrollArea>
							</div>
						</div>
					)}

					{step === "IMPORTING" && (
						<div className="h-full flex flex-col items-center justify-center space-y-4">
							<Loader2 className="h-12 w-12 animate-spin text-primary" />
							<div className="text-center">
								<h3 className="font-medium text-lg">Importing Users...</h3>
								<p className="text-muted-foreground">
									Creating accounts and assigning roles.
								</p>
							</div>
						</div>
					)}

					{step === "RESULT" && (
						<div className="h-full flex flex-col items-center justify-center space-y-6">
							<div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-in zoom-in duration-300">
								<CheckCircle2 className="h-8 w-8" />
							</div>
							<div className="text-center space-y-2">
								<h2 className="text-2xl font-bold">Import Complete</h2>
								<p className="text-muted-foreground">
									Your team has been updated successfully.
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
								<div className="bg-muted p-4 rounded-lg text-center">
									<div className="text-2xl font-bold text-primary">
										{importStats.success}
									</div>
									<div className="text-xs text-muted-foreground uppercase tracking-wider">
										Added
									</div>
								</div>
								<div className="bg-muted p-4 rounded-lg text-center">
									<div
										className={`text-2xl font-bold ${importStats.failed > 0 ? "text-red-500" : "text-muted-foreground"}`}
									>
										{importStats.failed}
									</div>
									<div className="text-xs text-muted-foreground uppercase tracking-wider">
										Failed
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="mt-4">
					{step === "SELECT" && (
						<>
							<Button variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button
								onClick={handleImport}
								disabled={selectedEmails.size === 0}
							>
								Import {selectedEmails.size} Users
							</Button>
						</>
					)}
					{step === "RESULT" && (
						<Button onClick={onClose} className="w-full sm:w-auto">
							Done
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default GoogleImportDialog;
