import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Book, ChatMessage, ChatThread, SwapOffer } from "../types";
import { SwapStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ds } from "../designSystem";
import { Modal } from "../components/Modal";
import {
	UserCircleIcon,
	StarIcon,
	FlagIcon,
	CheckCircleIcon,
	NoSymbolIcon,
	TrashIcon,
	EnvelopeIcon,
	PhotoIcon,
	MapPinIcon,
	ChatBubbleLeftRightIcon,
} from "../components/icons";

export const ChatPage: React.FC<{
	onViewBook?: (book: Book) => void;
	onMessagesRead?: () => void;
}> = ({ onViewBook, onMessagesRead }) => {
	// ... (ChatPage content unchanged until handleLocationShare)
	const { chatId } = useParams<{ chatId: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { t, language } = useLanguage();
	const [threads, setThreads] = useState<
		(ChatThread & { lastSenderId?: string; status?: string })[]
	>([]);
	const [messages, setMessages] = useState<(ChatMessage & { type?: string })[]>(
		[],
	);
	const [newMessage, setNewMessage] = useState("");
	const [isLocating, setIsLocating] = useState(false);
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [reportReason, setReportReason] = useState("");
	const [isBlocked, setIsBlocked] = useState(false);
	const [chatSearch, setChatSearch] = useState("");
	const [isPinned, setIsPinned] = useState(false);
	const [chatOffer, setChatOffer] = useState<SwapOffer | null>(null);
	const [chatOfferBooks, setChatOfferBooks] = useState<{ [key: string]: Book }>({});

	// Scroll management refs
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

	const handleScroll = () => {
		if (!scrollContainerRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } =
			scrollContainerRef.current;
		const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
		setShouldAutoScroll(isAtBottom);
	};

	const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
		messagesEndRef.current?.scrollIntoView({ behavior });
	};

	useEffect(() => {
		if (shouldAutoScroll) {
			scrollToBottom();
		}
	}, [messages]);

	const activeThread = threads.find((t) => t.id === chatId);
	const otherUsername = activeThread
		? Object.values(activeThread.participantUsernames).find(
				(name) => name !== user?.username,
			)
		: "User";
	const otherUserId = activeThread?.participantIds.find(
		(id) => id !== String(user?.id),
	);

	// Determine if this is a pending request for ME (I didn't start it, and it's pending)
	const isPendingRequest =
		activeThread?.status === "pending" &&
		String(activeThread.lastSenderId) !== String(user?.id);

	useEffect(() => {
		const fetchThreads = () => {
			api
				.get<
					(ChatThread & { lastSenderId?: string; status?: string })[]
				>("/chats")
				.then(setThreads);
		};
		fetchThreads();
		const interval = setInterval(fetchThreads, 2000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (otherUserId) {
			api.get<string[]>("/users/blocks").then((blockedIds) => {
				setIsBlocked(blockedIds.includes(otherUserId));
			});
		}
	}, [otherUserId]);

	useEffect(() => {
		if (chatId) {
			const fetchMessages = () => {
				api
					.get<(ChatMessage & { type?: string })[]>(`/chats/${chatId}/messages`)
					.then((newMessages) => {
						setMessages((prev) => {
							if (
								prev.length === newMessages.length &&
								prev[prev.length - 1]?.id ===
									newMessages[newMessages.length - 1]?.id
							) {
								return prev;
							}
							return newMessages;
						});
					});
			};

			// Only mark as read if it's accepted or I sent the last message (avoid read receipt on pending requests)
			if (
				activeThread?.status === "accepted" ||
				String(activeThread?.lastSenderId) === String(user?.id)
			) {
				api
					.post(`/chats/${chatId}/read`, {})
					.then(() => {
						api
							.get<(ChatThread & { lastSenderId?: string })[]>("/chats")
							.then(setThreads);
						if (onMessagesRead) onMessagesRead();
					})
					.catch((e) => console.error("Failed to mark read", e));
			}

			fetchMessages();
			setShouldAutoScroll(true);
			const interval = setInterval(fetchMessages, 2000);
			return () => clearInterval(interval);
		} else {
			setMessages([]);
		}
	}, [chatId, activeThread?.status]);

	useEffect(() => {
		if (!chatId || !activeThread || !user) {
			setChatOffer(null);
			return;
		}
		const loadThreadOffer = async () => {
			try {
				const [swapsData, booksData] = await Promise.all([
					api.get<SwapOffer[]>("/swaps"),
					api.get<Book[]>("/books"),
				]);
				const bMap: { [key: string]: Book } = {};
				booksData.forEach((b) => (bMap[b.id] = b));
				setChatOfferBooks(bMap);
				const me = String(user.id);
				const other = String(
					activeThread.participantIds.find((id) => String(id) !== me) || "",
				);
				const bookId = activeThread.bookId;
				const pairOffers = swapsData
					.filter((s) => {
						const participantsMatch =
							(String(s.offeredById) === me && String(s.offeredToId) === other) ||
							(String(s.offeredById) === other && String(s.offeredToId) === me);
						if (!participantsMatch) return false;
						if (!bookId) return true;
						return (
							String(s.requestedBookId) === String(bookId) ||
							(s.offeredBookIds || []).some((id) => String(id) === String(bookId))
						);
					})
					.sort(
						(a, b) =>
							new Date(b.lastUpdateDate).getTime() -
							new Date(a.lastUpdateDate).getTime(),
					);
				const best =
					pairOffers.find((s) => s.status === SwapStatus.PENDING) ||
					pairOffers.find((s) => s.status === SwapStatus.ACCEPTED) ||
					pairOffers[0] ||
					null;
				setChatOffer(best);
			} catch {
				setChatOffer(null);
			}
		};
		loadThreadOffer();
		const interval = setInterval(loadThreadOffer, 3000);
		return () => clearInterval(interval);
	}, [chatId, activeThread?.id, activeThread?.bookId, user?.id]);

	const handleSendMessage = async (
		text: string,
		type: "text" | "image" | "location" = "text",
	) => {
		if (!text && type === "text") return;
		if (!chatId) return;
		if (isPendingRequest) {
			alert(t("chat.pending_info"));
			return;
		}

		try {
			const tempId = `temp_${Date.now()}`;
			setNewMessage("");
			setShouldAutoScroll(true);

			await api.post<ChatMessage>(`/chats/${chatId}/messages`, { text, type });
			api
				.get<(ChatMessage & { type?: string })[]>(`/chats/${chatId}/messages`)
				.then(setMessages);
		} catch (e: any) {
			console.error("Failed to send", e);
			if (e.message.includes("403") || e.message.includes("Message blocked")) {
				alert(t("chat.blocked_error"));
			} else {
				alert("Failed to send message. Check connection.");
			}
		}
	};

	const handleAcceptRequest = async () => {
		if (!chatId) return;
		try {
			await api.post(`/chats/${chatId}/accept`, {});
			// Refresh threads to update UI
			const updatedThreads =
				await api.get<
					(ChatThread & { lastSenderId?: string; status?: string })[]
				>("/chats");
			setThreads(updatedThreads);
		} catch (e) {
			alert("Failed to accept request");
		}
	};

	const handleDeclineRequest = async () => {
		if (
			!chatId ||
			!window.confirm(
				"Are you sure you want to decline this request? The chat will be removed.",
			)
		)
			return;
		try {
			await api.post(`/chats/${chatId}/hide`, {});
			navigate("/messages");
			const updatedThreads =
				await api.get<
					(ChatThread & { lastSenderId?: string; status?: string })[]
				>("/chats");
			setThreads(updatedThreads);
		} catch (e) {
			alert("Failed to decline request");
		}
	};

	const handleChatOfferStatusUpdate = async (status: SwapStatus) => {
		if (!chatOffer) return;
		try {
			await api.put(`/swaps/${chatOffer.id}/status`, { status, language });
			const updatedSwaps = await api.get<SwapOffer[]>("/swaps");
			const refreshed = updatedSwaps.find((s) => s.id === chatOffer.id) || null;
			setChatOffer(refreshed);
		} catch (e: any) {
			alert("Offer action failed: " + (e.message || e));
		}
	};

	const handleOfferBookOpen = async (bookId: string) => {
		if (!onViewBook || !bookId) return;
		try {
			const book = await api.get<Book>(`/books/${bookId}`);
			onViewBook(book);
		} catch {
			alert("Could not load book details.");
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 5000000) {
			alert("File is too large (Max 5MB)");
			return;
		}
		const reader = new FileReader();
		reader.onloadend = () => {
			handleSendMessage(reader.result as string, "image");
		};
		reader.readAsDataURL(file);
		e.target.value = "";
	};

	const handleLocationShare = () => {
		if (!navigator.geolocation) {
			alert(t("location.error_unsupported"));
			return;
		}
		setIsLocating(true);

		// High accuracy options
		const options = {
			enableHighAccuracy: true,
			timeout: 15000,
			maximumAge: 0,
		};

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setIsLocating(false);
				const { latitude, longitude } = position.coords;
				// Specific pin drop link
				const link = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
				handleSendMessage(link, "location");
			},
			(error) => {
				setIsLocating(false);
				console.error("Location Error:", error);

				let errorMsg = t("location.error_unavailable");
				switch (error.code) {
					case 1: // PERMISSION_DENIED
						errorMsg = t("location.error_denied");
						break;
					case 2: // POSITION_UNAVAILABLE
						errorMsg = t("location.error_unavailable");
						break;
					case 3: // TIMEOUT
						errorMsg = t("location.error_timeout");
						break;
				}
				alert(errorMsg);
			},
			options,
		);
	};

	const handleDeleteChat = async () => {
		if (!window.confirm("Delete this chat?")) return;
		try {
			await api.post(`/chats/${chatId}/hide`, {});
			navigate("/messages");
			const updatedThreads = await api.get<ChatThread[]>("/chats");
			setThreads(updatedThreads);
		} catch (e) {
			alert("Failed to delete chat");
		}
	};

	const handlePinToggle = async () => {
		if (!chatId) return;
		try {
			if (isPinned) {
				await api.delete(`/chats/${chatId}/pin`);
				setIsPinned(false);
			} else {
				await api.post(`/chats/${chatId}/pin`, {});
				setIsPinned(true);
			}
		} catch {
			alert("Failed to update pin state");
		}
	};

	const handleSearchInChat = async () => {
		if (!chatId || !chatSearch.trim()) return;
		try {
			const found = await api.get<(ChatMessage & { type?: string })[]>(`/chats/${chatId}/search?q=${encodeURIComponent(chatSearch.trim())}`);
			setMessages(found.reverse());
		} catch {
			alert("Search failed");
		}
	};

	const handleCardClick = async (bookId: string) => {
		if (!onViewBook) return;
		try {
			const book = await api.get<Book>(`/books/${bookId}`);
			onViewBook(book);
		} catch (e) {
			alert("Could not load book details. It may have been deleted.");
		}
	};

	const handleBlockToggle = async () => {
		if (!otherUserId) return;

		if (isBlocked) {
			try {
				await api.delete(`/users/${otherUserId}/block`);
				setIsBlocked(false);
				alert("User unblocked successfully.");
			} catch (e) {
				alert("Failed to unblock user");
			}
		} else {
			if (!window.confirm(t("chat.block_confirm"))) return;
			try {
				await api.post(`/users/${otherUserId}/block`, {});
				setIsBlocked(true);
				alert(t("chat.block_success"));
			} catch (e) {
				alert("Failed to block user");
			}
		}
	};

	const handleSubmitReport = async () => {
		if (!otherUserId || !reportReason.trim()) return;
		try {
			await api.post("/reports", {
				reportedUserId: otherUserId,
				reason: reportReason,
				chatId,
			});
			alert(t("chat.report_success"));
			setIsReportModalOpen(false);
			setReportReason("");
		} catch (e: any) {
			alert("Failed to submit report: " + (e.message || "Unknown error"));
		}
	};

	// Split threads into active chats and requests
	// A request is: status 'pending' AND current user is NOT the last sender
	const requestThreads = threads.filter(
		(t) =>
			t.status === "pending" && String(t.lastSenderId) !== String(user?.id),
	);
	const activeThreads = threads.filter((t) => !requestThreads.includes(t));

	return (
		<div className="container mx-auto p-4 max-w-6xl">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-bold text-gray-800">{t("nav.messages")}</h2>
				<div className="text-sm text-gray-500">
					{activeThreads.length} active chats
				</div>
			</div>
			<div className="h-[calc(100vh-128px)] flex gap-4">
			<div
				className={`w-full md:w-1/3 bg-base_100 p-4 rounded-lg shadow overflow-y-auto ${chatId ? "hidden md:block" : "block"}`}
			>
				{/* Requests Section */}
				{requestThreads.length > 0 && (
					<div className="mb-4 border-b pb-2">
						<h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
							{t("chat.requests")}{" "}
							<span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
								{requestThreads.length}
							</span>
						</h2>
						{requestThreads.map((t) => (
							<div
								key={t.id}
								onClick={() => navigate(`/messages/${t.id}`)}
								className={`p-3 mb-2 rounded cursor-pointer border md:border-none ${t.id === chatId ? "bg-primary text-white shadow" : "bg-red-50 border-red-100 hover:bg-red-100 text-gray-800"}`}
							>
								<div className="font-bold flex justify-between">
									<span>
										{Object.values(t.participantUsernames).find(
											(n) => n !== user?.username,
										)}
									</span>
									<span className="text-[10px] bg-white/50 px-1 rounded">
										New
									</span>
								</div>
								<div className="text-sm truncate opacity-80">
									{t.lastMessageText}
								</div>
							</div>
						))}
					</div>
				)}

				<h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
					Active Chats
				</h3>
				{activeThreads.length === 0 && (
					<p className="text-gray-500 text-sm">No active chats.</p>
				)}
				{activeThreads.map((t) => (
					<div
						key={t.id}
						onClick={() => navigate(`/messages/${t.id}`)}
						className={`p-3 mb-2 rounded cursor-pointer border-b md:border-none ${t.id === chatId ? "bg-primary text-white" : "hover:bg-gray-100"}`}
					>
						<div className="font-bold flex justify-between">
							<span>
								{Object.values(t.participantUsernames).find(
									(n) => n !== user?.username,
								)}
							</span>
							{t.unreadMessages > 0 &&
								t.id !== chatId &&
								String(t.lastSenderId) !== String(user?.id) && (
									<span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
										{t.unreadMessages}
									</span>
								)}
						</div>
						<div className="text-sm truncate opacity-80">
							{t.lastMessageText}
						</div>
					</div>
				))}
			</div>
			{chatId ? (
				<div className={`${ds.surface} flex-1 p-4 flex flex-col h-full`}>
					<div className="font-bold border-b pb-2 mb-2 flex justify-between items-center">
						<div
							className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition-all duration-200"
							onClick={() => otherUserId && navigate(`/user/${otherUserId}`)}
						>
							<UserCircleIcon className="w-8 h-8 text-gray-400" />
							<span className="text-lg">{otherUsername}</span>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={handlePinToggle}
								className={`p-2 rounded ${isPinned ? "text-yellow-600 bg-yellow-50" : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"}`}
								title={isPinned ? "Unpin chat" : "Pin chat"}
							>
								<StarIcon className="w-5 h-5" filled={isPinned} />
							</button>
							{/* Report Button */}
							<button
								onClick={() => setIsReportModalOpen(true)}
								className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-red-50"
								title={t("chat.report")}
							>
								<FlagIcon className="w-5 h-5" />
							</button>

							{/* Block/Unblock Button */}
							<button
								onClick={handleBlockToggle}
								className={`p-2 rounded hover:bg-opacity-20 ${isBlocked ? "text-green-600 hover:bg-green-100" : "text-gray-400 hover:text-red-700 hover:bg-red-50"}`}
								title={isBlocked ? "Unblock User" : t("chat.block")}
							>
								{isBlocked ? (
									<CheckCircleIcon className="w-5 h-5" />
								) : (
									<NoSymbolIcon className="w-5 h-5" />
								)}
							</button>

							<button
								onClick={handleDeleteChat}
								className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-red-50"
								title="Delete Chat (Hide)"
							>
								<TrashIcon className="w-5 h-5" />
							</button>
							<button
								onClick={() => navigate("/messages")}
								className="md:hidden text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded"
							>
								Back
							</button>
						</div>
					</div>

					{/* Pending Request Banner */}
					{isPendingRequest && (
						<div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-4 flex flex-col items-center justify-center gap-3">
							<div className="flex items-center gap-2 font-semibold">
								<EnvelopeIcon className="w-6 h-6" />
								{t("chat.request_message").replace("{user}", otherUsername)}
							</div>
							<div className="flex gap-4 w-full justify-center">
								<button onClick={handleDeclineRequest} className={`${ds.btnSecondary} px-6 py-2 w-32`}>
									{t("chat.decline")}
								</button>
								<button
									onClick={handleAcceptRequest}
									className={`${ds.btnPrimary} px-6 py-2 w-32`}
								>
									{t("chat.accept")}
								</button>
							</div>
						</div>
					)}

					{chatOffer && (
						<div className="bg-slate-50 border border-slate-200 rounded-md mb-2 p-2.5 shadow-sm">
							<div className="flex items-center gap-1.5 mb-1.5">
								<span className="text-xs font-bold uppercase px-2 py-1 rounded bg-indigo-100 text-indigo-700">
									{chatOffer.offerType === "buy" ? "Buy Offer" : "Swap Offer"}
								</span>
								<span
									className={`text-xs font-bold uppercase px-2 py-1 rounded ${
										chatOffer.status === SwapStatus.PENDING
											? "bg-yellow-100 text-yellow-700"
											: chatOffer.status === SwapStatus.ACCEPTED
												? "bg-green-100 text-green-700"
												: chatOffer.status === SwapStatus.COMPLETED
													? "bg-emerald-100 text-emerald-700"
													: "bg-gray-100 text-gray-700"
									}`}
								>
									{chatOffer.status}
								</span>
								<span className="text-[11px] text-gray-500 ml-auto">
									Updated {new Date(chatOffer.lastUpdateDate).toLocaleString()}
								</span>
							</div>
							<div className="text-xs text-gray-700 mb-1.5">
								{chatOffer.offerType === "buy" ? (
									<span>
										Offer amount:{" "}
										<strong>{chatOffer.offeredAmount ? `${chatOffer.offeredAmount} TL` : "-"}</strong>
									</span>
								) : (
									<span>
										Requested:{" "}
										<button
											type="button"
											onClick={() => handleOfferBookOpen(chatOffer.requestedBookId)}
											className="font-semibold text-primary hover:underline"
											title="Open requested book details"
										>
											{chatOfferBooks[chatOffer.requestedBookId]?.title || "Unknown Book"}
										</button>
									</span>
								)}
							</div>
							{chatOffer.requestedBookId && (
								<div className="mb-1.5">
									<button
										type="button"
										onClick={() => handleOfferBookOpen(chatOffer.requestedBookId)}
										className="text-[11px] px-2 py-0.5 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
									>
										Open Requested Book
									</button>
									{chatOffer.offerType !== "buy" && chatOffer.offeredBookIds?.[0] && (
										<button
											type="button"
											onClick={() => handleOfferBookOpen(chatOffer.offeredBookIds[0])}
											className="ml-2 text-[11px] px-2 py-0.5 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
										>
											Open Offered Book
										</button>
									)}
								</div>
							)}
							{chatOffer.message && (
								<div className="text-[11px] text-gray-600 italic bg-gray-50 border border-gray-100 rounded px-2 py-1 mb-1.5">
									"{chatOffer.message}"
								</div>
							)}
							<div className="flex flex-wrap gap-1.5">
								{chatOffer.status === SwapStatus.PENDING &&
									String(chatOffer.offeredToId) === String(user?.id) && (
										<>
											<button
												onClick={() =>
													handleChatOfferStatusUpdate(SwapStatus.REJECTED)
												}
												className="px-2.5 py-1 text-[11px] font-medium border border-red-200 text-red-600 rounded hover:bg-red-50"
											>
												Reject
											</button>
											<button
												onClick={() =>
													handleChatOfferStatusUpdate(SwapStatus.ACCEPTED)
												}
												className="px-2.5 py-1 text-[11px] font-medium bg-secondary text-white rounded hover:bg-emerald-600"
											>
												Accept
											</button>
										</>
									)}
								{chatOffer.status === SwapStatus.PENDING &&
									String(chatOffer.offeredById) === String(user?.id) && (
										<button
											onClick={() =>
												handleChatOfferStatusUpdate(SwapStatus.CANCELLED)
											}
											className="px-2.5 py-1 text-[11px] font-medium border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
										>
											Cancel Offer
										</button>
									)}
								{chatOffer.status === SwapStatus.ACCEPTED && (
									<button
										onClick={() =>
											handleChatOfferStatusUpdate(SwapStatus.COMPLETED)
										}
										className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700"
									>
										Complete
									</button>
								)}
								<button
									onClick={() => navigate("/swaps")}
									className="px-2.5 py-1 text-[11px] font-medium border border-blue-200 text-blue-600 rounded hover:bg-blue-50"
								>
									Open Offers Tab
								</button>
							</div>
						</div>
					)}

					{/* Chat Messages Container with Scroll Ref */}
					<div className="mb-2 flex gap-2">
						<input
							className="flex-1 border rounded px-3 py-1 text-sm"
							placeholder="Search this chat..."
							value={chatSearch}
							onChange={(e) => setChatSearch(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearchInChat()}
						/>
						<button
							onClick={handleSearchInChat}
							className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
						>
							Search
						</button>
					</div>
					<div
						className="flex-1 overflow-y-auto space-y-4 p-2"
						ref={scrollContainerRef}
						onScroll={handleScroll}
					>
						{messages.map((m) => {
							const isMyMessage = String(m.senderId) === String(user?.id);
							let content = <span>{m.text}</span>;
							if (m.type === "image")
								content = (
									<img
										src={m.text}
										alt="Shared photo"
										className="max-w-full rounded-lg mb-1"
									/>
								);
							else if (m.type === "location")
								content = (
									<a
										href={m.text}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 underline text-blue-800 bg-white/20 p-2 rounded"
									>
										<MapPinIcon className="w-5 h-5" /> View Location
									</a>
								);
							else if (m.type === "book_card") {
								try {
									const cardData = JSON.parse(m.text);
									content = (
										<div
											onClick={() => handleCardClick(cardData.id)}
											className="bg-white text-gray-800 rounded-lg p-3 shadow cursor-pointer hover:bg-gray-50 border border-gray-200 transition flex items-center gap-3 w-64"
										>
											<div className="w-12 h-16 bg-gray-200 rounded shrink-0 overflow-hidden">
												<img
													src={cardData.imageUrl}
													alt={cardData.title}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="flex-1 overflow-hidden">
												<p className="text-xs text-gray-500 uppercase font-bold mb-0.5">
													{t("chat.card.interested")}
												</p>
												<p className="font-bold text-sm truncate">
													{cardData.title}
												</p>
												<p className="text-xs text-primary mt-1 font-medium underline">
													{t("chat.card.view_details")}
												</p>
											</div>
										</div>
									);
								} catch (e) {
									content = (
										<span className="text-xs text-red-400 italic">
											Invalid card data
										</span>
									);
								}
							}
							return (
								<div
									key={m.id}
									className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`px-4 py-2 rounded-lg max-w-[85%] break-words relative flex flex-col ${isMyMessage ? "bg-primary text-white" : "bg-gray-200 text-gray-800"} ${m.type === "book_card" ? "!p-2 !bg-transparent" : ""}`}
									>
										{content}
										<div
											className={`flex justify-between items-center gap-2 mt-1 min-w-[50px] ${m.type === "book_card" ? "px-1" : ""}`}
										>
											<span
												className={`text-[10px] ml-auto ${isMyMessage && m.type !== "book_card" ? "opacity-70 text-white" : "opacity-50 text-gray-500"}`}
											>
												{new Date(m.timestamp).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
											{isMyMessage && (
												<span className="text-xs">
													{m.isRead ? (
														<span className="text-green-300 font-bold">✓✓</span>
													) : (
														<span className="text-blue-200">✓</span>
													)}
												</span>
											)}
										</div>
									</div>
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</div>

					{/* Input Area (Disabled if pending request) */}
					<div
						className={`mt-2 flex gap-2 items-center bg-gray-50 p-2 rounded border ${isPendingRequest ? "opacity-50 pointer-events-none" : ""}`}
					>
						<input
							type="file"
							ref={fileInputRef}
							accept="image/*"
							className="hidden"
							onChange={handleFileUpload}
						/>
						<button
							onClick={() => fileInputRef.current?.click()}
							className="text-gray-500 hover:text-primary transition p-1 cursor-pointer"
						>
							<PhotoIcon className="w-6 h-6" />
						</button>
						<button
							onClick={handleLocationShare}
							disabled={isLocating}
							className={`text-gray-500 hover:text-red-500 transition p-1 cursor-pointer ${isLocating ? "opacity-50 cursor-wait" : ""}`}
						>
							{isLocating ? (
								<span className="animate-spin block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full"></span>
							) : (
								<MapPinIcon className="w-6 h-6" />
							)}
						</button>
						<input
							className="flex-1 border-none bg-transparent focus:ring-0 p-2 outline-none"
							value={newMessage}
							placeholder={
								isPendingRequest
									? t("chat.pending_info")
									: t("chat.placeholder")
							}
							onChange={(e) => setNewMessage(e.target.value)}
							onKeyPress={(e) =>
								e.key === "Enter" && handleSendMessage(newMessage)
							}
						/>
						<button
							onClick={() => handleSendMessage(newMessage)}
							className="bg-secondary text-white px-4 py-2 rounded hover:bg-emerald-600 transition shadow-sm cursor-pointer"
						>
							{t("chat.send")}
						</button>
					</div>
				</div>
			) : (
				<div className="hidden md:flex flex-1 items-center justify-center text-gray-500 bg-slate-100 rounded-lg shadow border border-slate-200">
					<div className="text-center">
						<ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
						<p>{t("chat.select_chat")}</p>
					</div>
				</div>
			)}

			{/* Report Modal */}
			{isReportModalOpen && (
				<Modal
					isOpen={isReportModalOpen}
					onClose={() => setIsReportModalOpen(false)}
					title={t("chat.report_title")}
				>
					<div className="p-4">
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								{t("chat.report_reason")}
							</label>
							<textarea
								className="w-full border p-2 rounded focus:ring-red-500 focus:border-red-500"
								rows={4}
								value={reportReason}
								onChange={(e) => setReportReason(e.target.value)}
								placeholder={t("chat.report_placeholder")}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setIsReportModalOpen(false)}
								className="px-4 py-2 text-gray-600 hover:text-gray-800"
							>
								{t("btn.cancel")}
							</button>
							<button
								onClick={handleSubmitReport}
								className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
							>
								{t("chat.report_submit")}
							</button>
						</div>
					</div>
				</Modal>
			)}
			</div>
		</div>
	);
};
