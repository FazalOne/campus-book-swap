import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Book, SwapOffer, BookOwnershipEvent } from "../types";
import { SwapStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ds } from "../designSystem";
import {
	ArrowPathRoundedSquareIcon,
	MagnifyingGlassIcon,
	TrashIcon,
	ChatBubbleLeftRightIcon,
} from "../components/icons";

export const SwapsPage: React.FC<{ onViewDetails: (book: Book) => void }> = ({
	onViewDetails,
}) => {
	const [swaps, setSwaps] = useState<SwapOffer[]>([]);
	const [booksMap, setBooksMap] = useState<{ [key: string]: Book }>({});
	const { user } = useAuth();
	const { t, language } = useLanguage();
	const navigate = useNavigate();

	const fetchData = async () => {
		try {
			const [swapsData, booksData] = await Promise.all([
				api.get<SwapOffer[]>("/swaps"),
				api.get<Book[]>("/books"),
			]);
			setSwaps(swapsData);
			const bMap: { [key: string]: Book } = {};
			booksData.forEach((b) => (bMap[b.id] = b));
			setBooksMap(bMap);
		} catch (e) {
			console.error(e);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleUpdateStatus = async (swapId: string, status: SwapStatus) => {
		try {
			await api.put(`/swaps/${swapId}/status`, { status, language });
			fetchData();
		} catch (e) {
			alert("Action failed");
		}
	};

	const handleDeleteSwap = async (swap: SwapOffer) => {
		if (!window.confirm("Delete this record?")) return;
		try {
			// If the swap is pending and the current user is the sender, treat as cancel (revert book statuses)
			if (swap.status === SwapStatus.PENDING && swap.offeredById === user?.id) {
				await api.put(`/swaps/${swap.id}/status`, {
					status: SwapStatus.CANCELLED,
					language,
				});
			} else {
				// otherwise remove the record (server will revert statuses if needed)
				await api.delete(`/swaps/${swap.id}`);
			}
			fetchData();
		} catch (e: any) {
			alert("Delete failed: " + (e.message || e));
		}
	};

	const handleCleanHistory = async () => {
		if (!window.confirm("Clear all non-pending swaps?")) return;
		try {
			await api.delete("/swaps/batch/clean");
			fetchData();
		} catch (e) {
			alert("Clean failed");
		}
	};

	const handleCounterOffer = async (swap: SwapOffer) => {
		const offeredBookId = window.prompt("Enter your counter offered book ID", swap.offeredBookIds?.[0] || "");
		const requestedBookId = window.prompt("Enter requested book ID", swap.requestedBookId || "");
		const message = window.prompt("Counter offer message", "Would you accept this instead?");
		if (!offeredBookId || !requestedBookId) return;
		try {
			await api.post(`/swaps/${swap.id}/counter`, {
				offeredBookIds: [offeredBookId],
				requestedBookId,
				message: message || ""
			});
			alert("Counter offer sent");
			fetchData();
		} catch (e: any) {
			alert("Counter offer failed: " + (e.message || e));
		}
	};

	const handleUserClick = (e: React.MouseEvent, userId: string) => {
		e.stopPropagation();
		navigate(`/user/${userId}`);
	};

	const handleBookClick = (book: Book | undefined) => {
		if (book && onViewDetails) {
			onViewDetails(book);
		}
	};

	const handleChatForSwap = async (swap: SwapOffer) => {
		try {
			const targetUserId =
				String(swap.offeredById) === String(user?.id)
					? swap.offeredToId
					: swap.offeredById;
			const chat = await api.post<{ id: string }>("/chats", {
				targetUserId,
				bookId: swap.requestedBookId,
				language,
			});
			navigate(`/messages/${chat.id}`);
		} catch (e: any) {
			alert("Failed to open chat: " + (e.message || e));
		}
	};

	const incoming = swaps
		.filter((s) => s.offeredToId === user?.id)
		.sort(
			(a, b) =>
				new Date(b.lastUpdateDate).getTime() -
				new Date(a.lastUpdateDate).getTime(),
		);
	const outgoing = swaps
		.filter((s) => s.offeredById === user?.id)
		.sort(
			(a, b) =>
				new Date(b.lastUpdateDate).getTime() -
				new Date(a.lastUpdateDate).getTime(),
		);
	const isActiveStatus = (status: SwapStatus) =>
		status === SwapStatus.PENDING || status === SwapStatus.ACCEPTED;
	const incomingActive = incoming.filter((s) => isActiveStatus(s.status));
	const outgoingActive = outgoing.filter((s) => isActiveStatus(s.status));
	const completedOffers = swaps
		.filter((s) => !isActiveStatus(s.status))
		.sort(
			(a, b) =>
				new Date(b.lastUpdateDate).getTime() -
				new Date(a.lastUpdateDate).getTime(),
		);

	const incomingPending = incomingActive.filter((s) => s.status === SwapStatus.PENDING);
	const groupedIncomingMap: Record<string, SwapOffer[]> = incomingPending.reduce(
		(acc, s) => {
			if (!acc[s.requestedBookId]) acc[s.requestedBookId] = [];
			acc[s.requestedBookId].push(s);
			return acc;
		},
		{} as Record<string, SwapOffer[]>,
	);
	const groupedIncoming = Object.keys(groupedIncomingMap)
		.map((requestedBookId) => ({
			requestedBookId,
			offers: groupedIncomingMap[requestedBookId],
		}))
		.filter((g) => g.offers.length > 1);
	const groupedIncomingIds = new Set(
		groupedIncoming.flatMap((g) => g.offers.map((o) => o.id)),
	);
	const incomingUngrouped = incomingActive.filter((s) => !groupedIncomingIds.has(s.id));

	const renderSwapCard = (swap: SwapOffer, isIncoming: boolean) => {
		const myBook = isIncoming
			? booksMap[swap.requestedBookId]
			: booksMap[swap.offeredBookIds[0]];
		const otherBook = isIncoming
			? booksMap[swap.offeredBookIds[0]]
			: booksMap[swap.requestedBookId];
		const historyEntries = (swap.bookHistory || []) as BookOwnershipEvent[];
		const receivedHistory = historyEntries.find(
			(h) => String(h.toUserId || "") === String(user?.id || ""),
		);
		const fallbackReceivedTitle =
			receivedHistory?.title ||
			(swap.offerType === "buy" ? "Purchased book" : "Received book");
		const fallbackReceivedImage =
			receivedHistory?.imageUrl ||
			"https://via.placeholder.com/100?text=Book";
		const isCompleted = swap.status === SwapStatus.COMPLETED;
		const currentUserOwnsReceivedBook =
			!!otherBook && String(otherBook.ownerId) === String(user?.id);
		const receivedBookUnavailable =
			isCompleted &&
			(swap.offerType === "swap" || swap.offerType === undefined) &&
			(!otherBook || !currentUserOwnsReceivedBook);

		// Calculate expiration (e.g., 14 days)
		const daysDiff =
			(new Date().getTime() - new Date(swap.lastUpdateDate).getTime()) /
			(1000 * 3600 * 24);
		const isExpired = swap.status === SwapStatus.PENDING && daysDiff > 14;

		const tr = (key: string, fallback: string) => {
			const value = t(key);
			return value === key ? fallback : value;
		};
		let statusColor = "bg-gray-100 text-gray-800";
		let statusText = tr(`swaps.status_${swap.status.toLowerCase()}`, swap.status);
		const offerTypeLabel = swap.offerType === "buy" ? "Buy Offer" : "Swap Offer";

		if (swap.status === SwapStatus.PENDING) {
			statusColor = "bg-yellow-100 text-yellow-800";
			if (isExpired) {
				statusColor = "bg-orange-100 text-orange-800";
				statusText = tr("swaps.status_expired", "Expired");
			}
		} else if (swap.status === SwapStatus.ACCEPTED) {
			statusColor = "bg-green-100 text-green-800";
		} else if (
			swap.status === SwapStatus.REJECTED ||
			swap.status === SwapStatus.CANCELLED
		) {
			statusColor = "bg-red-100 text-red-800";
		}

		return (
			<div
				key={swap.id}
				className={`${ds.surface} mb-4 overflow-hidden`}
			>
				<div className={`${ds.surfaceHeader} px-4 py-2 flex justify-between items-center text-xs text-slate-600`}>
					<div className="flex items-center gap-2">
						<span
							className="font-bold text-gray-700 cursor-pointer hover:text-primary hover:underline"
							onClick={(e) =>
								handleUserClick(
									e,
									isIncoming ? swap.offeredById : swap.offeredToId,
								)
							}
						>
							{isIncoming
								? `${t("swaps.from")} ${swap.offeredByUsername}`
								: `${t("swaps.to")} ${swap.offeredToUsername}`}
						</span>
						<span>•</span>
						<span>{new Date(swap.lastUpdateDate).toLocaleDateString()}</span>
						<span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase">
							{offerTypeLabel}
						</span>
					</div>
					<span
						className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
					>
						{statusText}
					</span>
				</div>

				<div className="p-4">
					<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
						{/* Left Side (You Give) */}
						<div className="flex-1 w-full flex items-center gap-3">
							{swap.offerType === "buy" ? (
								<div className="min-w-0">
									<p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-0.5">
										Your Offer
									</p>
									<p className="font-semibold text-gray-800 text-sm truncate">
										{swap.offeredAmount ? `${swap.offeredAmount} TL` : "Amount not set"}
									</p>
								</div>
							) : (
								<>
									<div className="w-12 h-16 bg-gray-200 rounded shrink-0 overflow-hidden border">
										<img
											src={myBook?.imageUrl}
											className="w-full h-full object-cover"
											alt=""
											onError={(e) => {
												(e.target as HTMLImageElement).src =
													"https://via.placeholder.com/100?text=Book";
											}}
										/>
									</div>
									<div className="min-w-0">
										<p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-0.5">
											{t("swaps.you_give")}
										</p>
										<p
											className="font-semibold text-gray-800 text-sm truncate"
											title={myBook?.title}
										>
											{myBook?.title || "Unknown Book"}
										</p>
									</div>
								</>
							)}
						</div>

						{/* Middle Arrow */}
						<ArrowPathRoundedSquareIcon className="w-5 h-5 text-gray-300 shrink-0 rotate-90 md:rotate-0" />

						{/* Right Side (You Get) */}
						<div
							className={`flex-1 w-full flex items-center gap-3 md:justify-end p-2 rounded transition -mr-2 ${
								receivedBookUnavailable
									? "cursor-not-allowed bg-gray-50/60"
									: "cursor-pointer hover:bg-gray-50"
							}`}
							onClick={() => {
								if (receivedBookUnavailable) {
									alert("You no longer own this book.");
									return;
								}
								handleBookClick(otherBook);
							}}
							title={
								receivedBookUnavailable
									? "You no longer own this book"
									: "View Book Details"
							}
						>
							<div className="min-w-0 md:text-right order-2 md:order-1">
								<p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide mb-0.5">
									{t("swaps.you_get")}
								</p>
								<p
									className="font-semibold text-gray-800 text-sm truncate"
									title={otherBook?.title || fallbackReceivedTitle}
								>
									{otherBook?.title || fallbackReceivedTitle}
								</p>
							</div>
							<div className="w-12 h-16 bg-gray-200 rounded shrink-0 overflow-hidden border order-1 md:order-2 relative group">
								<img
									src={otherBook?.imageUrl || fallbackReceivedImage}
									className="w-full h-full object-cover"
									alt=""
									onError={(e) => {
										(e.target as HTMLImageElement).src =
											"https://via.placeholder.com/100?text=Book";
									}}
								/>
								<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
									<MagnifyingGlassIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
								</div>
							</div>
						</div>
					</div>
					{receivedBookUnavailable && (
						<div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
							You no longer own this book.
						</div>
					)}

					{swap.message && (
						<div className={`${ds.surfaceSubtle} mt-3 text-xs text-slate-700 p-2 italic`}>
							"{swap.message}"
						</div>
					)}
				</div>

				<div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
					{swap.status === SwapStatus.PENDING && isIncoming && (
						<>
							<button onClick={() => handleCounterOffer(swap)} className={ds.btnSecondary}>
								Counter
							</button>
							<button
								onClick={() => handleUpdateStatus(swap.id, SwapStatus.REJECTED)}
								className={ds.btnDanger}
							>
								{t("btn.reject")}
							</button>
							<button
								onClick={() => handleUpdateStatus(swap.id, SwapStatus.ACCEPTED)}
								className={ds.btnPrimary}
							>
								{t("btn.accept")}
							</button>
						</>
					)}
					{swap.status === SwapStatus.PENDING && !isIncoming && (
						<button
							onClick={() => handleDeleteSwap(swap)}
							className={ds.btnSecondary}
						>
							{t("btn.cancel")}
						</button>
					)}
					{swap.status !== SwapStatus.PENDING && (
						<button
							onClick={() => handleDeleteSwap(swap)}
							className="text-gray-400 hover:text-red-500 p-1"
							title={t("btn.delete")}
						>
							<TrashIcon className="w-4 h-4" />
						</button>
					)}
					{swap.status === SwapStatus.ACCEPTED && (
						<>
							<button
								onClick={() => navigate("/messages")}
								className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-blue-600 flex items-center gap-1 transition shadow-sm"
							>
								<ChatBubbleLeftRightIcon className="w-3 h-3" /> {t("btn.chat")}
							</button>
							<button
								onClick={() => {
									if (
										!window.confirm(
											tr("swaps.confirm_complete", "Mark this swap as completed?"),
										)
									)
										return;
									handleUpdateStatus(swap.id, SwapStatus.COMPLETED);
								}}
								className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition shadow-sm"
							>
								{tr("btn.complete", "Complete")}
							</button>
						</>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto p-4 max-w-6xl">
			<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold text-gray-800">Offers & Requests</h2>
				<div className="flex gap-2">
					<button
						onClick={fetchData}
						className="text-primary hover:bg-blue-50 p-2 rounded"
					>
						<ArrowPathRoundedSquareIcon className="w-5 h-5" />
					</button>
					<button
						onClick={handleCleanHistory}
						className="text-gray-500 hover:text-red-500 text-sm"
					>
						{t("swaps.clean_history")}
					</button>
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div>
					<h3 className="font-bold text-lg mb-4 text-secondary flex items-center gap-2">
						<span>Active Incoming Offers</span>
						<span className="bg-secondary text-white text-xs px-2 py-0.5 rounded-full">
							{incomingActive.length}
						</span>
					</h3>
					{incomingActive.length === 0 && (
						<div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 mb-4">
							<p className="text-amber-700 text-sm font-semibold">
								No incoming offers at the moment.
							</p>
							<p className="text-amber-600 text-xs">
								New buy/swap offers from other users will appear here.
							</p>
						</div>
					)}
					{groupedIncoming.map((group) => {
						const requested = booksMap[group.requestedBookId];
						return (
							<div
								key={`group_${group.requestedBookId}`}
								className="bg-white rounded-lg shadow-sm border border-blue-200 mb-4 overflow-hidden"
							>
								<div className="px-4 py-2 bg-blue-50 border-b">
									<p className="text-sm font-bold text-blue-800">
										Competing Offers for:{" "}
										<span
											className="underline cursor-pointer"
											onClick={() => handleBookClick(requested)}
										>
											{requested?.title || group.requestedBookId}
										</span>
									</p>
									<p className="text-xs text-blue-600">
										{group.offers.length} pending offers - compare and act quickly
									</p>
								</div>
								<div className="p-3 space-y-2">
									{group.offers.map((offer) => {
										const offeredBook =
											offer.offerType === "swap"
												? booksMap[offer.offeredBookIds?.[0]]
												: undefined;
										return (
											<div
												key={offer.id}
												className="border rounded p-2 bg-gray-50"
											>
												<div className="flex flex-wrap items-center gap-2 text-xs">
													<span className="font-bold text-gray-700">
														{offer.offeredByUsername}
													</span>
													<span
														className={`px-2 py-0.5 rounded-full font-bold ${
															offer.offerType === "buy"
																? "bg-emerald-100 text-emerald-700"
																: "bg-indigo-100 text-indigo-700"
														}`}
													>
														{offer.offerType === "buy"
															? `BUY ${offer.offeredAmount ? `- ${offer.offeredAmount} TL` : ""}`
															: `SWAP ${offeredBook?.title ? `- ${offeredBook.title}` : ""}`}
													</span>
													<span className="text-gray-500">
														{new Date(offer.lastUpdateDate).toLocaleString()}
													</span>
													<div className="ml-auto flex gap-1">
														<button
															onClick={() => handleChatForSwap(offer)}
															className="px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
														>
															Chat
														</button>
														<button
															onClick={() =>
																handleUpdateStatus(
																	offer.id,
																	SwapStatus.REJECTED,
																)
															}
															className="px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
														>
															Reject
														</button>
														<button
															onClick={() =>
																handleUpdateStatus(
																	offer.id,
																	SwapStatus.ACCEPTED,
																)
															}
															className="px-2 py-1 rounded bg-secondary text-white hover:bg-emerald-600"
														>
															Accept
														</button>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
					{incomingUngrouped.map((s) => renderSwapCard(s, true))}
				</div>
				<div>
					<h3 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
						<span>Active Outgoing Offers</span>
						<span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
							{outgoingActive.length}
						</span>
					</h3>
					{outgoingActive.length === 0 && (
						<p className="text-gray-400 text-sm italic">
							No active outgoing offers.
						</p>
					)}
					{outgoingActive.map((s) => renderSwapCard(s, false))}
				</div>
			</div>
			<div className="mt-8">
				<h3 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
					<span>Completed Offers</span>
					<span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">
						{completedOffers.length}
					</span>
				</h3>
				{completedOffers.length === 0 ? (
					<p className="text-gray-400 text-sm italic">No completed offer history yet.</p>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{completedOffers.map((s) =>
							renderSwapCard(s, s.offeredToId === user?.id),
						)}
					</div>
				)}
			</div>
		</div>
	);
};
