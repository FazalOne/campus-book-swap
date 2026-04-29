import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, Report, ContactMessage, Book } from "../types";
import { UserRole, SwapStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Modal } from "../components/Modal";
import { PencilIcon, TrashIcon, ChatBubbleLeftRightIcon } from "../components/icons";

export const AdminPanel: React.FC<{ onViewDetails: (book: Book) => void }> = ({ onViewDetails }) => {
	// ... (AdminPanel content unchanged)
	const [users, setUsers] = useState<User[]>([]);
	const [reports, setReports] = useState<Report[]>([]);
	const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
	const [activeTab, setActiveTab] = useState<
		"users" | "reports" | "messages" | "swaps" | "completed" | "audit"
	>("users");
	const [adminSwaps, setAdminSwaps] = useState<any[]>([]);
	const [offerAuditLogs, setOfferAuditLogs] = useState<any[]>([]);
	const [offersView, setOffersView] = useState<"all" | "swap" | "buy">("all");
	const [completedOffersFilter, setCompletedOffersFilter] = useState<"all" | "swap" | "buy">("all");
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [newPassword, setNewPassword] = useState("");
	const { user } = useAuth();
	const { t, language } = useLanguage();
	const navigate = useNavigate();

	const fetchUsers = () => {
		api
			.get<User[]>("/admin/users")
			.then(setUsers)
			.catch((err) => alert("Failed to fetch users: " + err.message));
	};

	const fetchReports = () => {
		api
			.get<Report[]>("/admin/reports")
			.then(setReports)
			.catch((err) => alert("Failed to fetch reports: " + err.message));
	};

	const fetchContactMessages = () => {
		api
			.get<ContactMessage[]>("/admin/contact-messages")
			.then(setContactMessages)
			.catch((err) => alert("Failed to fetch messages: " + err.message));
	};

	const fetchAdminSwaps = () => {
		api
			.get<any[]>("/admin/swaps-details")
			.then(setAdminSwaps)
			.catch((err) => alert("Failed to fetch swap details: " + err.message));
	};

	const fetchOfferAuditLogs = () => {
		api
			.get<any[]>("/admin/offers-audit")
			.then(setOfferAuditLogs)
			.catch((err) => alert("Failed to fetch offers audit: " + err.message));
	};

	const handleDemoReset = async () => {
		if (!window.confirm("Reset demo data?")) return;
		try {
			await api.post("/demo/reset", {});
			alert("Demo reset complete");
		} catch (e: any) {
			alert("Demo reset failed: " + e.message);
		}
	};

	const handleDemoSeed = async () => {
		try {
			await api.post("/demo/seed", {});
			alert("Demo seed complete");
		} catch (e: any) {
			alert("Demo seed failed: " + e.message);
		}
	};

	const handlePruneTestUsers = async () => {
		if (!window.confirm("Delete all auto-generated test users (live_/deep_/feat_/demo_)?")) return;
		try {
			const result = await api.post<{ success: boolean; deletedUsers: number }>("/demo/prune-test-users", {});
			alert(`Removed ${result.deletedUsers || 0} test users.`);
			fetchUsers();
		} catch (e: any) {
			alert("Prune failed: " + e.message);
		}
	};

	useEffect(() => {
		if (["super_admin", "admin", "moderator"].includes(user?.role || "")) {
			fetchUsers();
			fetchReports();
			fetchAdminSwaps();
			fetchOfferAuditLogs();
			if (["super_admin", "admin"].includes(user?.role || "")) {
				fetchContactMessages();
			}
		}
	}, [user]);

	const handleAdminChat = async (targetUserId: string) => {
		try {
			const chat = await api.post<{ id: string }>("/chats", {
				targetUserId,
				language,
			});
			navigate(`/messages/${chat.id}`);
		} catch (e) {
			alert("Failed to start chat from admin panel");
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (userId === user?.id) {
			alert(t("admin.self_delete_error"));
			return;
		}
		if (!window.confirm(t("admin.confirm_delete"))) return;
		try {
			await api.delete(`/admin/users/${userId}`);
			fetchUsers();
			alert("User deleted successfully.");
		} catch (e: any) {
			alert("Delete failed: " + e.message);
		}
	};

	const handleDismissReport = async (reportId: number) => {
		if (!window.confirm("Dismiss this report?")) return;
		try {
			await api.delete(`/admin/reports/${reportId}`);
			fetchReports();
		} catch (e: any) {
			alert("Dismiss failed: " + e.message);
		}
	};

	const handleDeleteMessage = async (messageId: number) => {
		if (!window.confirm("Delete this message?")) return;
		try {
			await api.delete(`/admin/contact-messages/${messageId}`);
			fetchContactMessages();
		} catch (e: any) {
			alert("Delete failed: " + e.message);
		}
	};

	const handleSaveUser = async () => {
		if (!editingUser) return;
		try {
			await api.put(`/users/${editingUser.id}`, {
				username: editingUser.username,
				firstName: editingUser.firstName,
				lastName: editingUser.lastName,
				email: editingUser.email,
				phone: editingUser.phone,
				role: editingUser.role,
				newPassword: newPassword,
			});
			setEditingUser(null);
			setNewPassword("");
			fetchUsers();
			alert("User updated successfully.");
		} catch (e: any) {
			alert("Update failed: " + e.message);
		}
	};

	const canDelete = (targetUser: User) => {
		if (user?.role === UserRole.SUPER_ADMIN) return true;
		if (user?.role === UserRole.ADMIN) {
			return (
				targetUser.role === UserRole.USER ||
				targetUser.role === UserRole.MODERATOR
			);
		}
		return false;
	};

	const canEdit = (targetUser: User) => {
		if (user?.role === UserRole.SUPER_ADMIN) return true;
		if (
			user?.role === UserRole.ADMIN &&
			targetUser.role !== UserRole.SUPER_ADMIN &&
			targetUser.role !== UserRole.ADMIN
		)
			return true;
		if (user?.role === UserRole.MODERATOR && targetUser.role === UserRole.USER)
			return true;
		return false;
	};

	const statusBadgeClass = (status: string) => {
		switch (status) {
			case "Completed":
				return "bg-emerald-100 text-emerald-700";
			case "Accepted":
				return "bg-blue-100 text-blue-700";
			case "Pending":
				return "bg-amber-100 text-amber-700";
			case "Rejected":
				return "bg-rose-100 text-rose-700";
			case "Cancelled":
				return "bg-gray-100 text-gray-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	/** Not yet completed: pending, accepted, rejected, cancelled, etc. */
	const pendingOffers = adminSwaps.filter((s) => s.status !== SwapStatus.COMPLETED);
	const visibleOffers = pendingOffers.filter((s) => {
		const kind = s.offerType === "buy" ? "buy" : "swap";
		if (offersView === "all") return true;
		return offersView === kind;
	});

	const completedSwaps = adminSwaps.filter((s) => s.status === SwapStatus.COMPLETED);
	const visibleCompletedSwaps = completedSwaps.filter((s) => {
		const kind = s.offerType === "buy" ? "buy" : "swap";
		if (completedOffersFilter === "all") return true;
		return completedOffersFilter === kind;
	});

	const handleAdminBookView = async (bookData: any) => {
		if (!bookData?.id) return;
		try {
			const fullBook = await api.get<Book>(`/books/${bookData.id}`);
			onViewDetails(fullBook);
		} catch {
			// Fallback to available admin payload if direct fetch fails (e.g. historical/archived book)
			onViewDetails(bookData as Book);
		}
	};

	return (
		<div className="container mx-auto p-4 max-w-6xl">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				{t("admin.title")}
			</h1>
			{["super_admin", "admin"].includes(user?.role || "") && (
				<div className="mb-4 flex gap-2">
					<button
						onClick={handlePruneTestUsers}
						className="px-3 py-2 rounded bg-orange-100 text-orange-700 font-semibold transition-all duration-200 ease-out hover:bg-orange-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
					>
						Clean Test Users
					</button>
					<button
						onClick={handleDemoReset}
						className="px-3 py-2 rounded bg-red-100 text-red-700 font-semibold transition-all duration-200 ease-out hover:bg-red-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
					>
						Demo Reset
					</button>
					<button
						onClick={handleDemoSeed}
						className="px-3 py-2 rounded bg-emerald-100 text-emerald-700 font-semibold transition-all duration-200 ease-out hover:bg-emerald-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
					>
						Demo Seed
					</button>
				</div>
			)}

				<div className="mb-4 flex space-x-2">
				<button
					onClick={() => setActiveTab("users")}
						className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ease-out active:scale-[0.98] ${activeTab === "users" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-sm"}`}
				>
					{t("admin.tab.users")}
				</button>
				<button
					onClick={() => setActiveTab("reports")}
						className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] ${activeTab === "reports" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-sm"}`}
				>
					{t("admin.tab.reports")}
					{reports.length > 0 && (
						<span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
							{reports.length}
						</span>
					)}
				</button>
				<button
					onClick={() => setActiveTab("swaps")}
						className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ease-out active:scale-[0.98] flex items-center gap-2 ${activeTab === "swaps" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-sm"}`}
				>
					Pending Offers
					{pendingOffers.length > 0 && (
						<span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
							{pendingOffers.length}
						</span>
					)}
				</button>
				<button
					onClick={() => setActiveTab("completed")}
					className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ease-out active:scale-[0.98] flex items-center gap-2 ${activeTab === "completed" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-sm"}`}
				>
					Completed Offers
					{completedSwaps.length > 0 && (
						<span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
							{completedSwaps.length}
						</span>
					)}
				</button>
				<button
					onClick={() => setActiveTab("audit")}
						className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ease-out active:scale-[0.98] ${activeTab === "audit" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-sm"}`}
				>
					Offers Audit
				</button>
				{["super_admin", "admin"].includes(user?.role || "") && (
					<button
						onClick={() => setActiveTab("messages")}
						className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] ${activeTab === "messages" ? "bg-primary text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-sm"}`}
					>
						{t("admin.tab.messages")}
						{contactMessages.length > 0 && (
							<span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
								{contactMessages.length}
							</span>
						)}
					</button>
				)}
			</div>

			{activeTab === "users" ? (
				<div className="overflow-x-auto md-surface">
					<table className="w-full text-left border-collapse min-w-[600px]">
						<thead>
							<tr className="bg-gray-100 border-b">
								<th className="p-4 font-semibold text-gray-600">ID</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.username")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("reg.firstName")} / {t("reg.lastName")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("reg.email")}
								</th>
								<th className="p-4 font-semibold text-gray-600">Role</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.actions")}
								</th>
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr key={u.id} className="border-b hover:bg-gray-50">
									<td className="p-4 text-sm text-gray-500 font-mono">
										{u.id}
									</td>
									<td className="p-4 font-medium flex items-center gap-2">
										<img
											src={u.avatarUrl}
											alt=""
											className="w-6 h-6 rounded-full"
										/>
										{u.username}
									</td>
									<td className="p-4 text-sm">
										{u.firstName} {u.lastName}
									</td>
									<td className="p-4 text-sm">{u.email}</td>
									<td className="p-4 text-xs font-bold uppercase">
										<span
											className={`px-2 py-1 rounded-full ${u.role === "super_admin" ? "bg-purple-100 text-purple-700" : u.role === "admin" ? "bg-blue-100 text-blue-700" : u.role === "moderator" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}
										>
											{u.role}
										</span>
									</td>
									<td className="p-4">
										<div className="flex gap-2">
											{canEdit(u) && (
												<button
													onClick={() => setEditingUser(u)}
													className="text-blue-600 hover:text-blue-800 p-1 border border-blue-200 rounded hover:bg-blue-50"
													title={t("btn.edit")}
												>
													<PencilIcon className="w-4 h-4" />
												</button>
											)}
											{u.id !== user?.id && canDelete(u) && (
												<button
													onClick={() => handleDeleteUser(u.id)}
													className="text-red-600 hover:text-red-800 p-1 border border-red-200 rounded hover:bg-red-50"
													title={t("btn.delete")}
												>
													<TrashIcon className="w-4 h-4" />
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : activeTab === "reports" ? (
				<div className="overflow-x-auto md-surface">
					<table className="w-full text-left border-collapse min-w-[600px]">
						<thead>
							<tr className="bg-gray-100 border-b">
								<th className="p-4 font-semibold text-gray-600">ID</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.reporter")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.reported")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.reason")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.date")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.actions")}
								</th>
							</tr>
						</thead>
						<tbody>
							{reports.length === 0 && (
								<tr>
									<td colSpan={6} className="p-8 text-center text-gray-500">
										No reports found.
									</td>
								</tr>
							)}
							{reports.map((r: any) => (
								<tr key={r.id} className="border-b hover:bg-gray-50">
									<td className="p-4 text-sm text-gray-500 font-mono">
										{r.id}
									</td>
									<td className="p-4 font-medium">
										{r.reporterUsername}{" "}
										<span className="text-xs text-gray-400">
											({r.reporterId})
										</span>
										<button
											onClick={() => handleAdminChat(r.reporterId)}
											title="Chat with Reporter"
											className="ml-2 hover:bg-blue-50 rounded p-1 transition"
										>
											<ChatBubbleLeftRightIcon className="w-4 h-4 inline text-primary" />
										</button>
									</td>
									<td className="p-4 font-bold text-red-600">
										{r.reportedUsername}{" "}
										<span className="text-xs text-gray-400 font-normal">
											({r.reportedUserId})
										</span>
										<button
											onClick={() => handleAdminChat(r.reportedUserId)}
											title="Chat with Reported User"
											className="ml-2 hover:bg-red-50 rounded p-1 transition"
										>
											<ChatBubbleLeftRightIcon className="w-4 h-4 inline text-red-500" />
										</button>
									</td>
									<td className="p-4 text-sm italic">"{r.reason}"</td>
									<td className="p-4 text-xs text-gray-500">
										{new Date(r.createdAt).toLocaleString()}
									</td>
									<td className="p-4">
										<button
											onClick={() => handleDismissReport(r.id)}
											className="text-gray-600 hover:text-green-600 p-1 border border-gray-300 rounded hover:bg-green-50 text-xs px-2 py-1"
											title={t("admin.btn.dismiss")}
										>
											{t("admin.btn.dismiss")}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : activeTab === "swaps" ? (
				<div className="md-surface p-4">
					<div className="mb-3">
						<h2 className="text-lg font-bold text-gray-800">Pending offers</h2>
						<p className="text-xs text-gray-500 mt-1 max-w-3xl">
							All offers that are not completed yet (pending, accepted, rejected, cancelled, etc.). Completed offers are on the other tab.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2 mb-4">
						<button
							onClick={() => setOffersView("all")}
							className={`px-3 py-1.5 rounded-full text-sm font-semibold ${offersView === "all" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
						>
							All types
						</button>
						<button
							onClick={() => setOffersView("swap")}
							className={`px-3 py-1.5 rounded-full text-sm font-semibold ${offersView === "swap" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}
						>
							Swaps
						</button>
						<button
							onClick={() => setOffersView("buy")}
							className={`px-3 py-1.5 rounded-full text-sm font-semibold ${offersView === "buy" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}
						>
							Sales
						</button>
						<span className="ml-auto text-xs text-gray-500">
							Showing {visibleOffers.length} of {pendingOffers.length} pending
						</span>
					</div>
					{visibleOffers.length === 0 ? (
						<div className="p-8 text-center text-gray-500 border rounded-lg bg-gray-50">
							No pending offers match this filter.
						</div>
					) : (
						<div className="space-y-4">
							{visibleOffers.map((s) => (
								<div key={s.id} className="border rounded-lg p-4 bg-gradient-to-b from-white to-gray-50">
									<div className="flex flex-wrap items-center gap-2 mb-3">
										<span className="text-xs font-mono text-gray-500">{s.id}</span>
										<span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadgeClass(s.status)}`}>{s.status}</span>
										<span className={`px-2 py-1 rounded-full text-xs font-bold ${s.offerType === "buy" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
											{s.offerType === "buy" ? "BUY OFFER" : "SWAP OFFER"}
										</span>
										<span className="text-xs text-gray-500 ml-auto">{new Date(s.lastUpdateDate).toLocaleString()}</span>
									</div>
									<div className="text-sm text-gray-700 mb-3">
										<span className="font-semibold">{s.offeredByUsername}</span> {"->"}{" "}
										<span className="font-semibold">{s.offeredToUsername}</span>
										{s.offerType === "buy" && (
											<span className="ml-2 text-emerald-700 font-bold">
												Offer Amount: {s.offeredAmount ? `${s.offeredAmount} TL` : "-"}
											</span>
										)}
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="md-surface p-3">
											<p className="text-xs font-bold uppercase text-gray-500 mb-2">Requested Book</p>
											{s.requestedBook ? (
												<div className="flex gap-3">
													<div className="w-16 h-20 bg-gray-100 rounded overflow-hidden border shrink-0">
														<img
															src={s.requestedBook.imageUrl || "https://via.placeholder.com/100?text=Book"}
															alt={s.requestedBook.title}
															className="w-full h-full object-cover"
														/>
													</div>
													<div className="min-w-0">
														<p className="font-semibold text-gray-800 truncate">{s.requestedBook.title}</p>
														<p className="text-xs text-gray-600 truncate">{s.requestedBook.author || "Unknown author"}</p>
														<p className="text-xs text-gray-500">Status: {s.requestedBook.status}</p>
														<p className="text-xs text-gray-500">Owner ID: {s.requestedBook.ownerId || "-"}</p>
														<div className="flex gap-1 mt-1 flex-wrap">
															{s.requestedBook.forSale && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">For Sale</span>}
															{s.requestedBook.forSwap && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">For Swap</span>}
															{s.requestedBook.forSale && s.requestedBook.price ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{s.requestedBook.price} TL</span> : null}
														</div>
														<button
															type="button"
															onClick={() => handleAdminBookView(s.requestedBook)}
															className="mt-2 text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
														>
															View Details
														</button>
													</div>
												</div>
											) : (
												<p className="text-xs text-gray-400">No requested book</p>
											)}
										</div>
										<div className="md-surface p-3">
											<p className="text-xs font-bold uppercase text-gray-500 mb-2">
												{s.offerType === "buy" ? "Payment Offer" : "Offered Books"}
											</p>
											{s.offerType === "buy" ? (
												<p className="text-sm font-bold text-emerald-700">
													{s.offeredAmount ? `${s.offeredAmount} TL` : "No amount provided"}
												</p>
											) : (
												<div className="space-y-2">
													{s.offeredBooks?.length ? s.offeredBooks.map((b: any) => (
														<div key={b.id} className="flex gap-3 border rounded p-2 bg-gray-50">
															<div className="w-12 h-16 bg-gray-100 rounded overflow-hidden border shrink-0">
																<img
																	src={b.imageUrl || "https://via.placeholder.com/100?text=Book"}
																	alt={b.title}
																	className="w-full h-full object-cover"
																/>
															</div>
															<div className="min-w-0">
																<p className="text-sm font-semibold truncate">{b.title}</p>
																<p className="text-xs text-gray-600 truncate">{b.author || "Unknown author"}</p>
																<p className="text-xs text-gray-500">Status: {b.status}</p>
																<p className="text-xs text-gray-500">Owner ID: {b.ownerId || "-"}</p>
																<button
																	type="button"
																	onClick={() => handleAdminBookView(b)}
																	className="mt-1.5 text-[11px] px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
																>
																	View Details
																</button>
															</div>
														</div>
													)) : <p className="text-xs text-gray-400">No offered books</p>}
												</div>
											)}
										</div>
									</div>
									{s.message && <p className="text-xs text-gray-600 mt-3 italic">Message: {s.message}</p>}
								</div>
							))}
						</div>
					)}
				</div>
			) : activeTab === "completed" ? (
				<div className="md-surface p-4">
					<div className="mb-3">
						<h2 className="text-lg font-bold text-gray-800">Completed offers</h2>
						<p className="text-xs text-gray-500 mt-1 max-w-3xl">
							Finished sales and swaps: requested/sold book and offered trade books. Open details from each card. Filter by swap vs sale.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2 mb-4">
						<button
							type="button"
							onClick={() => setCompletedOffersFilter("all")}
							className={`px-3 py-1.5 rounded-full text-sm font-semibold ${completedOffersFilter === "all" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
						>
							All
						</button>
						<button
							type="button"
							onClick={() => setCompletedOffersFilter("swap")}
							className={`px-3 py-1.5 rounded-full text-sm font-semibold ${completedOffersFilter === "swap" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}
						>
							Swaps only
						</button>
						<button
							type="button"
							onClick={() => setCompletedOffersFilter("buy")}
							className={`px-3 py-1.5 rounded-full text-sm font-semibold ${completedOffersFilter === "buy" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}
						>
							Sales only
						</button>
						<button
							type="button"
							onClick={() => {
								fetchAdminSwaps();
							}}
							className="ml-auto text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 font-semibold"
						>
							Refresh
						</button>
						<span className="text-xs text-gray-500">
							{visibleCompletedSwaps.length} of {completedSwaps.length} completed
						</span>
					</div>
					{visibleCompletedSwaps.length === 0 ? (
						<div className="p-8 text-center text-gray-500 border rounded-lg bg-gray-50">
							No completed offers match this filter.
						</div>
					) : (
						<div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
							{visibleCompletedSwaps.map((s) => (
								<div
									key={s.id}
									className="border border-emerald-200 rounded-lg p-4 bg-gradient-to-b from-emerald-50/40 to-white"
								>
									<div className="flex flex-wrap items-center gap-2 mb-3">
										<span className="text-xs font-mono text-gray-500">{s.id}</span>
										<span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadgeClass(s.status)}`}>
											{s.status}
										</span>
										<span
											className={`px-2 py-1 rounded-full text-xs font-bold ${s.offerType === "buy" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
										>
											{s.offerType === "buy" ? "SALE" : "SWAP"}
										</span>
										<span className="text-xs text-gray-500 ml-auto">
											{new Date(s.lastUpdateDate || s.creationDate).toLocaleString()}
										</span>
									</div>
									<p className="text-sm text-gray-700 mb-3">
										<span className="font-semibold">{s.offeredByUsername}</span>
										{" → "}
										<span className="font-semibold">{s.offeredToUsername}</span>
										{s.offerType === "buy" && (
											<span className="ml-2 text-emerald-700 font-bold text-sm">
												Amount: {s.offeredAmount != null ? `${s.offeredAmount} TL` : "—"}
											</span>
										)}
									</p>
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
										<div className="rounded-lg border border-slate-200 bg-white p-3">
											<p className="text-xs font-bold uppercase text-slate-500 mb-2">Requested / sold book</p>
											{s.requestedBook ? (
												<div className="flex gap-3">
													<div className="w-14 h-[4.5rem] bg-gray-100 rounded overflow-hidden border shrink-0">
														<img
															src={s.requestedBook.imageUrl || "https://via.placeholder.com/100?text=Book"}
															alt={s.requestedBook.title}
															className="w-full h-full object-cover"
														/>
													</div>
													<div className="min-w-0 flex-1">
														<p className="font-semibold text-gray-800 text-sm truncate">{s.requestedBook.title}</p>
														<p className="text-xs text-gray-600 truncate">{s.requestedBook.author || "—"}</p>
														<p className="text-[11px] text-gray-500 mt-0.5">Owner ID: {s.requestedBook.ownerId ?? "—"}</p>
														<button
															type="button"
															onClick={() => handleAdminBookView(s.requestedBook)}
															className="mt-2 text-[11px] px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
														>
															View details
														</button>
													</div>
												</div>
											) : (
												<p className="text-xs text-gray-400">No book on record</p>
											)}
										</div>
										<div className="rounded-lg border border-slate-200 bg-white p-3">
											<p className="text-xs font-bold uppercase text-slate-500 mb-2">
												{s.offerType === "buy" ? "Buyer paid (cash offer)" : "Offered in trade"}
											</p>
											{s.offerType === "buy" ? (
												<p className="text-sm text-gray-700">
													Sale completed. See amount above; no physical book offered from buyer.
												</p>
											) : s.offeredBooks?.length ? (
												<div className="space-y-2">
													{s.offeredBooks.map((b: any) => (
														<div key={b.id} className="flex gap-3 border border-slate-100 rounded p-2 bg-slate-50/80">
															<div className="w-12 h-16 bg-gray-100 rounded overflow-hidden border shrink-0">
																<img
																	src={b.imageUrl || "https://via.placeholder.com/100?text=Book"}
																	alt={b.title}
																	className="w-full h-full object-cover"
																/>
															</div>
															<div className="min-w-0 flex-1">
																<p className="text-sm font-semibold truncate">{b.title}</p>
																<p className="text-xs text-gray-600 truncate">{b.author || "—"}</p>
																<button
																	type="button"
																	onClick={() => handleAdminBookView(b)}
																	className="mt-1 text-[11px] px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
																>
																	View details
																</button>
															</div>
														</div>
													))}
												</div>
											) : (
												<p className="text-xs text-gray-400">No offered books recorded</p>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			) : activeTab === "audit" ? (
				<div className="md-surface p-4">
					<div className="flex justify-between items-center mb-3">
						<h3 className="font-bold text-gray-800">Action Audit Log</h3>
						<button
							onClick={fetchOfferAuditLogs}
							className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
						>
							Refresh
						</button>
					</div>
					<div className="space-y-2 max-h-[520px] overflow-y-auto">
						{offerAuditLogs.length === 0 && (
							<div className="text-sm text-gray-500 p-4 border rounded bg-gray-50">No audit events yet.</div>
						)}
						{offerAuditLogs.map((log) => (
							<div key={log.id} className="border rounded p-3 bg-gray-50">
								<div className="flex flex-wrap gap-2 items-center text-xs">
									<span className="font-mono text-gray-500">#{log.id}</span>
									<span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">{log.action}</span>
									<span className="text-gray-600">Swap: <span className="font-mono">{log.swapId}</span></span>
									<span className="text-gray-600">Actor: {log.actorUsername || log.actorId || "system"}</span>
									<span className="ml-auto text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
								</div>
								{log.details && <p className="text-xs text-gray-600 mt-1">{log.details}</p>}
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="overflow-x-auto md-surface">
					<table className="w-full text-left border-collapse min-w-[600px]">
						<thead>
							<tr className="bg-gray-100 border-b">
								<th className="p-4 font-semibold text-gray-600">ID</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.name")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.email")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.subject")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.message")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.date")}
								</th>
								<th className="p-4 font-semibold text-gray-600">
									{t("admin.col.actions")}
								</th>
							</tr>
						</thead>
						<tbody>
							{contactMessages.length === 0 && (
								<tr>
									<td colSpan={7} className="p-8 text-center text-gray-500">
										No messages found.
									</td>
								</tr>
							)}
							{contactMessages.map((m) => (
								<tr key={m.id} className="border-b hover:bg-gray-50">
									<td className="p-4 text-sm text-gray-500 font-mono">
										{m.id}
									</td>
									<td className="p-4 font-medium">{m.name}</td>
									<td className="p-4 text-sm text-blue-600 hover:underline">
										<a href={`mailto:${m.email}`}>{m.email}</a>
									</td>
									<td className="p-4 text-sm font-semibold">{m.subject}</td>
									<td
										className="p-4 text-sm max-w-xs truncate"
										title={m.message}
									>
										{m.message}
									</td>
									<td className="p-4 text-xs text-gray-500">
										{new Date(m.createdAt).toLocaleString()}
									</td>
									<td className="p-4">
										<button
											onClick={() => handleDeleteMessage(m.id)}
											className="text-red-600 hover:text-red-800 p-1 border border-red-200 rounded hover:bg-red-50 text-xs px-2 py-1"
											title={t("btn.delete")}
										>
											{t("btn.delete")}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{editingUser && (
				<Modal
					isOpen={!!editingUser}
					onClose={() => {
						setEditingUser(null);
						setNewPassword("");
					}}
					title={t("admin.modal.edit_title")}
				>
					<div className="p-4 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">
									{t("reg.firstName")}
								</label>
								<input
									className="w-full p-2 border rounded mt-1"
									value={editingUser.firstName}
									onChange={(e) =>
										setEditingUser({
											...editingUser,
											firstName: e.target.value,
										})
									}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									{t("reg.lastName")}
								</label>
								<input
									className="w-full p-2 border rounded mt-1"
									value={editingUser.lastName}
									onChange={(e) =>
										setEditingUser({ ...editingUser, lastName: e.target.value })
									}
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								{t("admin.label.username")}
							</label>
							<input
								className="w-full p-2 border rounded mt-1"
								value={editingUser.username}
								onChange={(e) =>
									setEditingUser({ ...editingUser, username: e.target.value })
								}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								{t("reg.email")}
							</label>
							<input
								className="w-full p-2 border rounded mt-1"
								value={editingUser.email || ""}
								onChange={(e) =>
									setEditingUser({ ...editingUser, email: e.target.value })
								}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								{t("reg.phone")}
							</label>
							<input
								className="w-full p-2 border rounded mt-1"
								value={editingUser.phone || ""}
								onChange={(e) =>
									setEditingUser({ ...editingUser, phone: e.target.value })
								}
							/>
						</div>
						{user?.role === UserRole.SUPER_ADMIN && (
							<div>
								<label className="block text-sm font-medium text-gray-700">
									Role
								</label>
								<select
									className="w-full p-2 border rounded mt-1"
									value={editingUser.role}
									onChange={(e) =>
										setEditingUser({
											...editingUser,
											role: e.target.value as UserRole,
										})
									}
								>
									<option value={UserRole.USER}>User</option>
									<option value={UserRole.MODERATOR}>Moderator</option>
									<option value={UserRole.ADMIN}>Admin</option>
									<option value={UserRole.SUPER_ADMIN}>Super Admin</option>
								</select>
							</div>
						)}
						<div className="border-t pt-4 mt-2">
							<label className="block text-sm font-bold text-gray-700 mb-1">
								{t("admin.label.new_pass")}
							</label>
							<input
								type="password"
								className="w-full p-2 border rounded border-orange-300 focus:ring-orange-500"
								placeholder="******"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
							/>
						</div>
						<div className="flex justify-end gap-2 pt-4">
							<button
								onClick={() => {
									setEditingUser(null);
									setNewPassword("");
								}}
								className="px-4 py-2 text-gray-600 hover:text-gray-800"
							>
								{t("btn.cancel")}
							</button>
							<button
								onClick={handleSaveUser}
								className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600"
							>
								{t("admin.save_changes")}
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
};
