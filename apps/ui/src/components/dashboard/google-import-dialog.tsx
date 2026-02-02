import { Loader2, CheckCircle2, UserCheck, Info, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useGoogleWorkspace } from "@/hooks/useGoogleWorkspace";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/alert";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { Checkbox } from "@/lib/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/lib/components/dialog";
import { ScrollArea } from "@/lib/components/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/components/table";

import type {
	GoogleUser,
	GoogleUserRole,
	ImportError,
} from "@/types/google-workspace";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	accessToken: string;
	organizationId: string;
	existingEmails: string[];
	onSuccess: () => void;
}

const GoogleImportDialog = ({
	isOpen,
	onClose,
	accessToken = "",
	organizationId,
	existingEmails = [],
	onSuccess,
}: Props) => {
	const [step, setStep] = useState<
		"LOADING" | "SELECT" | "IMPORTING" | "RESULT"
	>("LOADING");

	const [discoveredUsers, setDiscoveredUsers] = useState<GoogleUser[]>([]);
	const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
	const [role, setRole] = useState<GoogleUserRole>("developer");
	const [importStats, setImportStats] = useState<{
		success: number;
		warning: number;
		failed: number;
		errors: ImportError[];
	}>({
		success: 0,
		warning: 0,
		failed: 0,
		errors: [],
	});

	const { fetchGoogleWorkspaceUsers, importGoogleWorkspaceUsers } =
		useGoogleWorkspace({ organizationId });

	useEffect(() => {
		if (isOpen && accessToken) {
			loadUsers();
		}
	}, [isOpen, accessToken]);

	const loadUsers = async () => {
		setStep("LOADING");
		try {
			const googleUsers: GoogleUser[] =
				await fetchGoogleWorkspaceUsers(accessToken);

			if (!googleUsers.length) {
				onClose();
				return;
			}

			setDiscoveredUsers(googleUsers);

			const newUsers = googleUsers
				.filter((u: GoogleUser) => !existingEmails.includes(u.email))
				.map((u: GoogleUser) => u.email);

			setSelectedEmails(new Set(newUsers));
			setStep("SELECT");
			toast.success("Users fetched successfully!");
		} catch {
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
			const response = await importGoogleWorkspaceUsers(usersToImport, role);

			setImportStats({
				success: response.successCount,
				warning: response.warningCount,
				failed: response.failedCount,
				errors: response.errors,
			});
			setStep("RESULT");
			setRole("developer");
			onSuccess();
		} catch (error: any) {
			toast.error("Import failed", {
				description: error.response || "Please try again later",
			});
			setStep("SELECT");
		}
	};

	const handleRoleSelect = (role: GoogleUserRole) => {
		setRole(role);
	};

	const availableUsersCount = discoveredUsers.filter(
		(u) => !existingEmails.includes(u.email),
	).length;
	const isAllSelected =
		selectedEmails.size === availableUsersCount && availableUsersCount > 0;

	return (
		<Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
			<DialogContent className="sm:max-w-[800px] h-[670px] flex flex-col">
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
										<Select value={role} onValueChange={handleRoleSelect}>
											<SelectTrigger className="w-[130px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="developer">Developer</SelectItem>
												<SelectItem value="admin">Admin</SelectItem>
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
														className="cursor-pointer"
														checked={isAllSelected}
														onCheckedChange={toggleAll}
														disabled={availableUsersCount === 0}
													/>
												</TableHead>
												<TableHead>User</TableHead>
												<TableHead>Email</TableHead>
												<TableHead>Department</TableHead>
												<TableHead>Status</TableHead>
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
																className="cursor-pointer"
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
														<TableCell>
															{isExisting ? (
																<span className="flex items-center text-xs text-yellow-600 font-medium">
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
						<div className="flex flex-col gap-6 py-2">
							<div className="flex flex-col items-center justify-center space-y-2 text-center">
								<div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-in zoom-in duration-300 mb-2">
									<CheckCircle2 className="h-6 w-6" />
								</div>
								<h2 className="text-2xl font-bold">Import Complete</h2>
								<p className="text-muted-foreground">
									Your team has been updated successfully.
								</p>
							</div>

							<div className="grid grid-cols-3 gap-4 w-full">
								<div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
									<div className="flex items-center gap-2 mb-1">
										<CheckCircle2 className="h-4 w-4 text-green-500" />
										<span className="text-sm font-medium text-muted-foreground">
											Successful
										</span>
									</div>
									<div className="text-3xl font-bold text-primary">
										{importStats.success}
									</div>
								</div>

								<div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
									<div className="flex items-center gap-2 mb-1">
										<Info className="h-4 w-4" />
										<span className="text-sm font-medium text-muted-foreground">
											Skipped
										</span>
									</div>
									<div className="text-3xl font-bold text-primary">
										{importStats.warning}
									</div>
								</div>

								<div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
									<div className="flex items-center gap-2 mb-1">
										<XCircle className="h-4 w-4 text-red-500" />
										<span className="text-sm font-medium text-muted-foreground">
											Failed
										</span>
									</div>
									<div
										className={`text-3xl font-bold ${importStats.failed > 0 ? "text-red-500" : "text-muted-foreground"}`}
									>
										{importStats.failed}
									</div>
								</div>
							</div>

							{importStats.success > 0 && (
								<Alert variant="default" className="bg-muted/50 border-muted">
									<Info className="h-4 w-4" />
									<AlertTitle>Info</AlertTitle>
									<AlertDescription className="text-xs text-muted-foreground">
										{importStats.success} user
										{importStats.success > 1 ? "s were" : " was"} processed. If
										an account already existed, it was added to the
										organization. Otherwise, a new account was created.
									</AlertDescription>
								</Alert>
							)}

							{(importStats.failed > 0 || importStats.warning > 0) &&
								importStats.errors &&
								importStats.errors.length > 0 && (
									<div className="space-y-3">
										<h4 className="text-sm font-medium leading-none flex items-center gap-2 text-destructive">
											<XCircle className="h-4 w-4" />
											Failed Details ({importStats.errors.length})
										</h4>
										<div className="rounded-md border bg-background">
											<div className="h-[150px] w-full rounded-md border bg-background overflow-y-auto p-4">
												<div className="space-y-4">
													{importStats.errors.map(
														(error: any, index: number) => (
															<div
																key={index}
																className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
															>
																<div className="flex items-center justify-between">
																	<span
																		className="text-sm font-medium truncate max-w-[350px]"
																		title={error.email}
																	>
																		{error.email}
																	</span>
																</div>
																<p className="text-xs text-muted-foreground">
																	Reason:{" "}
																	<span className="text-foreground font-medium">
																		{error.reason}
																	</span>
																</p>
															</div>
														),
													)}
												</div>
											</div>
										</div>
									</div>
								)}
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
