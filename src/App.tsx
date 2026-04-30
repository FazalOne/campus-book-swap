import React, { useState, useEffect } from "react";
import {
	Routes,
	Route,
	Link,
	useNavigate,
	Navigate,
	useLocation,
} from "react-router-dom";
import {
	Book,
	ChatThread,
	SwapOffer,
	BookStatus,
	SwapStatus,
	BookOwnershipEvent,
} from "./types";
import { api } from "./lib/api";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";
import { LoginPage, RegisterPage } from "./AuthPages";
import { ds } from "./designSystem";
import { getConditionKey, getStatusKey } from "./lib/bookLabels";
import { Modal } from "./components/Modal";
import { Footer } from "./components/Footer";
import { AddEditBookForm } from "./pages/AddEditBookForm";
import { BrowseBooksPage } from "./pages/BrowseBooksPage";
import { ChatPage } from "./pages/ChatPage";
import { AdminPanel } from "./pages/AdminPanel";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { SwapsPage } from "./pages/SwapsPage";
import { AboutPage } from "./pages/AboutPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ContactPage } from "./pages/ContactPage";
import { LandingPage } from "./pages/LandingPage";
import {
	BookOpenIcon,
	UserCircleIcon,
	MagnifyingGlassIcon,
	ArrowPathRoundedSquareIcon,
	ChatBubbleLeftRightIcon,
	ArrowRightOnRectangleIcon,
	ArrowLeftOnRectangleIcon,
	UserPlusIcon,
	ShieldCheckIcon,
	XMarkIcon,
	Bars3Icon,
} from "./components/icons"

function App() {
	const { user, loading, logout } = useAuth();
	const isMarketplaceUser = user?.role === 'user';
	const { language, setLanguage, t } = useLanguage();
	const [selectedBook, setSelectedBook] = useState<Book | null>(null);
	const [selectedBookOwnershipHistory, setSelectedBookOwnershipHistory] = useState<
		BookOwnershipEvent[]
	>([]);
	const [editingBook, setEditingBook] = useState<Book | null>(null);
	const [isBookFormModalOpen, setIsBookFormModalOpen] = useState(false);
	const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
	const [userBooks, setUserBooks] = useState<Book[]>([]);
	const [sellerBooks, setSellerBooks] = useState<Book[]>([]);
	const [selectedRequestedBookIds, setSelectedRequestedBookIds] = useState<string[]>([]);
	const [selectedOwnBook, setSelectedOwnBook] = useState("");
	const [swapMessage, setSwapMessage] = useState("");
	const [offerType, setOfferType] = useState<"swap" | "buy">("swap");
	const [offeredAmount, setOfferedAmount] = useState("");
	const [unreadMsgCount, setUnreadMsgCount] = useState(0);
	const [pendingSwapCount, setPendingSwapCount] = useState(0);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu state
	const navigate = useNavigate();
	const location = useLocation();
	const isActiveNav = (path: string) =>
		path === "/messages"
			? location.pathname.startsWith("/messages")
			: location.pathname === path;
	const isProfileNavActive =
		location.pathname.startsWith("/user/") || location.pathname === "/profile";

	const fetchNotifications = async () => {
		if (!user) return;
		try {
			const chats =
				await api.get<(ChatThread & { lastSenderId?: string })[]>("/chats");
			const unread = chats.reduce((sum, chat) => {
				if (String(chat.lastSenderId) !== String(user.id))
					return sum + chat.unreadMessages;
				return sum;
			}, 0);
			setUnreadMsgCount(unread);
			const swaps = await api.get<SwapOffer[]>("/swaps");
			const pending = swaps.filter(
				(s) => s.offeredToId === user.id && s.status === SwapStatus.PENDING,
			).length;
			setPendingSwapCount(pending);
		} catch (e) {
			console.error("Notification poll failed", e);
		}
	};

	useEffect(() => {
		if (!user) return;
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 5000);
		return () => clearInterval(interval);
	}, [user]);

	useEffect(() => {
		// Close mobile menu on route change
		setMobileMenuOpen(false);
	}, [location.pathname]);

	useEffect(() => {
		if (user && isSwapModalOpen) {
			api.get<Book[]>("/books").then((allBooks) => {
				const wantsSale = offerType === "buy";
				setUserBooks(
					allBooks.filter(
						(b) =>
							b.ownerId === user.id &&
							b.forSwap &&
							b.status === BookStatus.AVAILABLE,
					),
				);
				if (selectedBook?.ownerId) {
					const nextSellerBooks = allBooks.filter(
							(b) =>
								b.ownerId === selectedBook.ownerId &&
								b.status === BookStatus.AVAILABLE &&
								(wantsSale ? b.forSale : b.forSwap),
						);
					setSellerBooks(nextSellerBooks);
					setSelectedRequestedBookIds((prev) => {
						const allowed = new Set(nextSellerBooks.map((b) => b.id));
						const kept = prev.filter((id) => allowed.has(id));
						if (kept.length > 0) return kept;
						return allowed.has(selectedBook.id) ? [selectedBook.id] : [];
					});
				}
			});
		}
	}, [user, isSwapModalOpen, selectedBook?.id, selectedBook?.ownerId, offerType]);

	useEffect(() => {
		if (!selectedBook) {
			setSelectedBookOwnershipHistory([]);
			return;
		}
		api
			.get<BookOwnershipEvent[]>(
				`/books/${encodeURIComponent(selectedBook.id)}/ownership-history`,
			)
			.then(setSelectedBookOwnershipHistory)
			.catch(() => setSelectedBookOwnershipHistory([]));
	}, [selectedBook?.id]);

	const openAddBookModal = () => {
		setEditingBook(null);
		setIsBookFormModalOpen(true);
	};

	const openEditBookModal = (book: Book) => {
		setEditingBook(book);
		setIsBookFormModalOpen(true);
	};

	const closeBookFormModal = () => {
		setIsBookFormModalOpen(false);
		setEditingBook(null);
	};

	const handleGlobalRipple = (e: React.MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement;
		const clickable = target.closest("button, a, label") as HTMLElement | null;
		if (!clickable || clickable.classList.contains("no-ripple")) return;
		const computed = window.getComputedStyle(clickable);
		const bg = computed.backgroundColor || "rgba(255,255,255,1)";
		const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
		const r = match ? Number(match[1]) : 255;
		const g = match ? Number(match[2]) : 255;
		const b = match ? Number(match[3]) : 255;
		const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		const isDarkBg = luminance < 120;
		const rect = clickable.getBoundingClientRect();
		const size = Math.max(rect.width, rect.height);
		const ripple = document.createElement("span");
		ripple.className = "md-ripple";
		ripple.style.setProperty(
			"--ripple-strong",
			isDarkBg ? "rgba(255,255,255,0.8)" : "rgba(15,23,42,0.42)",
		);
		ripple.style.setProperty(
			"--ripple-soft",
			isDarkBg ? "rgba(255,255,255,0.48)" : "rgba(15,23,42,0.22)",
		);
		ripple.style.width = `${size}px`;
		ripple.style.height = `${size}px`;
		ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
		ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
		clickable.classList.add("md-ripple-host");
		clickable.appendChild(ripple);
		window.setTimeout(() => ripple.remove(), 550);
	};

	useEffect(() => {
		if (!selectedBook) return;
		if (selectedBook.forSale && !selectedBook.forSwap) setOfferType("buy");
		else setOfferType("swap");
	}, [selectedBook]);

	const handleStartChat = async (targetUserId: string, bookId: string) => {
		try {
			const chat = await api.post<{ id: string }>("/chats", {
				targetUserId,
				bookId,
				language,
			});
			setSelectedBook(null);
			navigate(`/messages/${chat.id}`);
		} catch (e) {
			alert("Could not start chat");
		}
	};

	const handleSendOffer = async () => {
		if (!selectedBook) return;
		const requestedBookIds =
			selectedRequestedBookIds.length > 0
				? selectedRequestedBookIds
				: [selectedBook.id];
		if (requestedBookIds.length === 0) return;
		if (offerType === "swap" && !selectedOwnBook) return;
		if (offerType === "buy" && (!offeredAmount || Number(offeredAmount) <= 0)) return;
		try {
			await api.post("/swaps", {
				id: `swap_${Date.now()}`,
				offeredToId: selectedBook.ownerId,
				offeredBookIds: offerType === "swap" ? [selectedOwnBook] : [],
				requestedBookId: requestedBookIds[0],
				requestedBookIds,
				offerType,
				offeredAmount: offerType === "buy" ? Number(offeredAmount) : null,
				status: SwapStatus.PENDING,
				message: swapMessage,
				creationDate: new Date().toISOString(),
				lastUpdateDate: new Date().toISOString(),
			});
			setIsSwapModalOpen(false);
			setSelectedBook(null);
			setSelectedOwnBook("");
			setSellerBooks([]);
			setSelectedRequestedBookIds([]);
			setOfferedAmount("");
			setOfferType("swap");
			alert("Offer sent successfully!");
			window.location.reload();
		} catch (e: any) {
			alert("Failed to send offer: " + e.message);
		}
	};

	const handleDeleteBook = async (bookId: string) => {
		if (!window.confirm("Delete permanently? This will remove the book from your account.")) return;
		try {
			await api.delete(`/books/${bookId}`);
			setSelectedBook(null);
			alert("Book deleted.");
			window.location.reload();
		} catch (e: any) {
			alert("Failed to delete: " + e.message);
		}
	};

	const handleUpdateBookStatus = async (
		bookId: string,
		newStatus: BookStatus,
	) => {
		if (!selectedBook) return;
		try {
			await api.put(`/books/${bookId}`, { ...selectedBook, status: newStatus });
			alert(`Book marked as ${newStatus}`);
			setSelectedBook(null);
			window.location.reload();
		} catch (e: any) {
			alert("Failed to update status");
		}
	};

	if (loading)
		return (
			<div className="h-screen flex items-center justify-center">
				Loading...
			</div>
		);

	return (
		<div className={`${ds.pageBg} md-app flex flex-col`} onMouseDownCapture={handleGlobalRipple}>
			<nav className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 shadow-lg sticky top-0 z-50 backdrop-blur">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<Link
						to="/"
						className="text-2xl font-bold text-white flex items-center gap-2"
					>
						<BookOpenIcon className="w-8 h-8" />{" "}
						<span className="hidden sm:inline">{t("app.title")}</span>
						<span className="sm:hidden">CBS</span>
					</Link>
					<div className="flex items-center gap-4">
						<div className="flex bg-white/10 rounded overflow-hidden border border-white/20">
							<button
								onClick={() => setLanguage("en")}
								className={`px-2 py-1 text-sm font-bold ${language === "en" ? "bg-white text-primary" : "text-white hover:bg-white/10"}`}
							>
								EN
							</button>
							<button
								onClick={() => setLanguage("tr")}
								className={`px-2 py-1 text-sm font-bold ${language === "tr" ? "bg-white text-primary" : "text-white hover:bg-white/10"}`}
							>
								TR
							</button>
						</div>

						{/* Desktop Menu */}
						<div className="hidden lg:flex items-center space-x-2">
							{user ? (
								<>
									{["super_admin", "admin", "moderator"].includes(
										user.role,
									) && (
										<Link
											to="/admin"
											className={`${ds.navItemLight} ${isActiveNav("/admin") ? "bg-white/20 ring-1 ring-white/40" : ""}`}
										>
											<ShieldCheckIcon className="w-5 h-5" />
											<span className="font-medium">{t("nav.admin")}</span>
										</Link>
									)}
									<Link
										to="/browse"
										className={`${ds.navItem} ${isActiveNav("/browse") ? "bg-white/20 text-white ring-1 ring-white/40" : ""}`}
									>
										<MagnifyingGlassIcon className="w-5 h-5" />
										<span>{t("nav.browse")}</span>
									</Link>
									{isMarketplaceUser && (
										<>
											<Link
												to="/swaps"
												className={`${ds.navItem} relative ${isActiveNav("/swaps") ? "bg-white/20 text-white ring-1 ring-white/40" : ""}`}
											>
												<ArrowPathRoundedSquareIcon className="w-5 h-5" />
												<span>Offers</span>
												{pendingSwapCount > 0 && (
													<span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
														{pendingSwapCount}
													</span>
												)}
											</Link>
										</>
									)}
									<Link
										to="/messages"
										className={`${ds.navItem} relative ${isActiveNav("/messages") ? "bg-white/20 text-white ring-1 ring-white/40" : ""}`}
									>
										<ChatBubbleLeftRightIcon className="w-5 h-5" />
										<span>{t("nav.messages")}</span>
										{unreadMsgCount > 0 && (
											<span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
												{unreadMsgCount}
											</span>
										)}
									</Link>
									<button
										onClick={logout}
										className={ds.navItemDanger}
									>
										<ArrowRightOnRectangleIcon className="w-5 h-5" />
										<span>{t("nav.logout")}</span>
									</button>
									<Link
										to={`/user/${user.id}`}
										className={`flex items-center text-white font-medium pl-2 border-l border-blue-400 ml-2 hover:bg-blue-600 rounded pr-2 py-1 transition-all duration-200 ease-out gap-2 hover:-translate-y-0.5 active:scale-[0.98] ${isProfileNavActive ? "bg-white/20 ring-1 ring-white/40" : ""}`}
									>
										{user.avatarUrl ? (
											<img
												src={user.avatarUrl}
												alt="Profile"
												className="w-8 h-8 rounded-full border border-white/30 object-cover"
											/>
										) : (
											<UserCircleIcon className="w-6 h-6" />
										)}
										<span className="hidden lg:inline">{user.username}</span>
									</Link>
								</>
							) : (
								<div className="space-x-4 flex items-center">
									<Link
										to="/login"
										className={`${ds.navItemLight} ${isActiveNav("/login") ? "bg-white/20 ring-1 ring-white/40" : ""}`}
									>
										<ArrowLeftOnRectangleIcon className="w-5 h-5" />
										<span>{t("nav.login")}</span>
									</Link>
									<Link
										to="/register"
										className={`bg-white text-primary px-3 py-2 rounded font-medium hover:bg-gray-100 transition-all duration-200 ease-out flex items-center gap-2 hover:-translate-y-0.5 hover:shadow active:scale-[0.98] ${isActiveNav("/register") ? "ring-2 ring-white/60" : ""}`}
									>
										<UserPlusIcon className="w-5 h-5" />
										<span>{t("nav.register")}</span>
									</Link>
								</div>
							)}
						</div>

						{/* Mobile Menu Button */}
						<div className="lg:hidden flex items-center">
							<button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="text-white p-2"
							>
								{mobileMenuOpen ? (
									<XMarkIcon className="w-8 h-8" />
								) : (
									<Bars3Icon className="w-8 h-8" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Menu Dropdown */}
				{mobileMenuOpen && (
					<div className="lg:hidden bg-primary border-t border-blue-400 shadow-xl">
						<div className="px-4 pt-2 pb-4 space-y-2">
							{user ? (
								<>
									<Link
										to={`/user/${user.id}`}
										className={`flex items-center text-white font-bold p-3 rounded-md hover:bg-blue-600 border border-blue-400 mb-2 gap-3 bg-blue-500/20 ${isProfileNavActive ? "ring-1 ring-white/40" : ""}`}
									>
										{user.avatarUrl ? (
											<img
												src={user.avatarUrl}
												alt="Profile"
												className="w-8 h-8 rounded-full border border-white/30 object-cover"
											/>
										) : (
											<UserCircleIcon className="w-6 h-6" />
										)}
										<span>{user.username}</span>
									</Link>
									{["super_admin", "admin", "moderator"].includes(
										user.role,
									) && (
										<Link
											to="/admin"
									className={`text-white flex items-center gap-3 px-3 py-3 rounded-md hover:bg-blue-600 transition-all duration-200 ease-out hover:-translate-y-0.5 ${isActiveNav("/admin") ? "bg-white/20 ring-1 ring-white/40" : ""}`}
										>
											<ShieldCheckIcon className="w-5 h-5" />
											{t("nav.admin")}
										</Link>
									)}
									<Link
										to="/browse"
										className={`text-white flex items-center gap-3 px-3 py-3 rounded-md hover:bg-blue-600 transition-all duration-200 ease-out hover:-translate-y-0.5 ${isActiveNav("/browse") ? "bg-white/20 ring-1 ring-white/40" : ""}`}
									>
										<MagnifyingGlassIcon className="w-5 h-5" />
										{t("nav.browse")}
									</Link>
									{isMarketplaceUser && (
										<>
											<Link
												to="/swaps"
												className={`text-white flex items-center gap-3 px-3 py-3 rounded-md hover:bg-blue-600 justify-between transition-all duration-200 ease-out hover:-translate-y-0.5 ${isActiveNav("/swaps") ? "bg-white/20 ring-1 ring-white/40" : ""}`}
											>
												<div className="flex items-center gap-3">
													<ArrowPathRoundedSquareIcon className="w-5 h-5" />
													Offers
												</div>
												{pendingSwapCount > 0 && (
													<span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
														{pendingSwapCount}
													</span>
												)}
											</Link>
										</>
									)}
									<Link
										to="/messages"
										className={`text-white flex items-center gap-3 px-3 py-3 rounded-md hover:bg-blue-600 justify-between transition-all duration-200 ease-out hover:-translate-y-0.5 ${isActiveNav("/messages") ? "bg-white/20 ring-1 ring-white/40" : ""}`}
									>
										<div className="flex items-center gap-3">
											<ChatBubbleLeftRightIcon className="w-5 h-5" />
											{t("nav.messages")}
										</div>
										{unreadMsgCount > 0 && (
											<span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
												{unreadMsgCount}
											</span>
										)}
									</Link>
									<button
										onClick={logout}
										className="text-red-100 flex items-center gap-3 px-3 py-3 rounded-md hover:bg-blue-600 w-full text-left transition-all duration-200 ease-out hover:-translate-y-0.5"
									>
										<ArrowRightOnRectangleIcon className="w-5 h-5" />
										{t("nav.logout")}
									</button>
								</>
							) : (
								<div className="flex flex-col gap-2 mt-2">
									<Link
										to="/login"
										className={`text-white bg-blue-600 px-3 py-3 rounded-md flex items-center gap-3 justify-center border border-blue-400 ${isActiveNav("/login") ? "ring-1 ring-white/40" : ""}`}
									>
										<ArrowLeftOnRectangleIcon className="w-5 h-5" />
										{t("nav.login")}
									</Link>
									<Link
										to="/register"
										className={`bg-white text-primary px-3 py-3 rounded-md font-bold flex items-center gap-3 justify-center ${isActiveNav("/register") ? "ring-2 ring-white/60" : ""}`}
									>
										<UserPlusIcon className="w-5 h-5" />
										{t("nav.register")}
									</Link>
								</div>
							)}
						</div>
					</div>
				)}
			</nav>

			<main className="flex-grow">
				<div
					key={`${location.pathname}${location.search}`}
					className="page-enter h-full"
				>
					<Routes>
					<Route
						path="/"
						element={user ? <Navigate to="/browse" /> : <LandingPage />}
					/>
					<Route
						path="/browse"
						element={<BrowseBooksPage onViewDetails={setSelectedBook} />}
					/>
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route
						path="/my-books"
						element={
							user ? (
								<Navigate to={`/user/${user.id}`} />
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route
						path="/add-book"
						element={
							<Navigate to={user ? `/user/${user.id}` : "/login"} />
						}
					/>
					<Route
						path="/edit-book"
						element={
							<Navigate to={user ? `/user/${user.id}` : "/login"} />
						}
					/>
					<Route
						path="/admin"
						element={
							user &&
							["super_admin", "admin", "moderator"].includes(user.role) ? (
								<AdminPanel onViewDetails={setSelectedBook} />
							) : (
								<Navigate to="/" />
							)
						}
					/>
					<Route
						path="/profile"
						element={user ? <ProfilePage /> : <Navigate to="/login" />}
					/>
					<Route
						path="/user/:userId"
						element={
							user ? (
								<PublicProfilePage
									onViewDetails={setSelectedBook}
									onOpenAddBook={openAddBookModal}
								/>
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route path="/about" element={<AboutPage />} />
					<Route path="/privacy" element={<PrivacyPage />} />
					<Route path="/contact" element={<ContactPage />} />
					<Route
						path="/messages"
						element={
							user ? (
								<ChatPage
									onViewBook={setSelectedBook}
									onMessagesRead={fetchNotifications}
								/>
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route
						path="/messages/:chatId"
						element={
							user ? (
								<ChatPage
									onViewBook={setSelectedBook}
									onMessagesRead={fetchNotifications}
								/>
							) : (
								<Navigate to="/login" />
							)
						}
					/>
					<Route
						path="/swaps"
						element={
							user && isMarketplaceUser ? (
								<SwapsPage onViewDetails={setSelectedBook} />
							) : (
								<Navigate to={user ? "/admin" : "/login"} />
							)
						}
					/>
					</Routes>
				</div>
			</main>

			{!location.pathname.startsWith("/messages") && <Footer />}

			{user && isMarketplaceUser && isBookFormModalOpen && (
				<Modal
					isOpen={isBookFormModalOpen}
					onClose={closeBookFormModal}
					title={editingBook ? t("btn.edit") : t("my_books.add_new")}
				>
					<AddEditBookForm
						initialBook={editingBook}
						onCancel={closeBookFormModal}
						onDone={() => {
							closeBookFormModal();
							window.location.reload();
						}}
					/>
				</Modal>
			)}

			{selectedBook && (
				<Modal
					isOpen={!!selectedBook}
					onClose={() => setSelectedBook(null)}
					title={selectedBook.title}
				>
					<div className="p-4">
						<div className="flex justify-center mb-6 bg-gray-50 rounded-lg p-2 relative">
							<img
								src={selectedBook.imageUrl}
								alt={selectedBook.title}
								className="max-h-80 w-full object-contain shadow-sm"
								onError={(e) => {
									(e.target as HTMLImageElement).src =
										"https://via.placeholder.com/300x400?text=No+Image";
								}}
							/>
							<span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-bold shadow">
								{t(getStatusKey(selectedBook.status))}
							</span>
						</div>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
								<div>
									<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
										{t("book.title")}
									</label>
									<div className="text-gray-900 font-medium break-words">
										{selectedBook.title}
									</div>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
										{t("book.author")}
									</label>
									<div className="text-gray-900 font-medium">
										{selectedBook.author}
									</div>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
										{t("book.condition")}
									</label>
									<div className="text-gray-900">
										{t(getConditionKey(selectedBook.condition))}
									</div>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
										Listed On
									</label>
									<div className="text-gray-900">
										{new Date(selectedBook.listedDate).toLocaleDateString()}
									</div>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
										Owner
									</label>
									<div
										className="text-gray-900 font-medium flex items-center gap-1 cursor-pointer hover:text-blue-600"
										onClick={() => {
											setSelectedBook(null);
											navigate(`/user/${selectedBook.ownerId}`);
										}}
									>
										<UserCircleIcon className="w-4 h-4 text-primary" />
										<span className="hover:underline">
											{selectedBook.ownerUsername || "Unknown User"}
										</span>
									</div>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
										{t("book.isbn")}
									</label>
									<div className="text-gray-900">
										{selectedBook.isbn || "-"}
									</div>
								</div>
								{selectedBook.edition && (
									<div>
										<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
											{t("book.edition")}
										</label>
										<div className="text-gray-900">{selectedBook.edition}</div>
									</div>
								)}
								{selectedBook.course && (
									<div>
										<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
											{t("book.course")}
										</label>
										<div className="text-gray-900">{selectedBook.course}</div>
									</div>
								)}
								{selectedBook.department && (
									<div>
										<label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
											Genre
										</label>
										<div className="text-gray-900">
											{selectedBook.department}
										</div>
									</div>
								)}
							</div>
							<div>
								<label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
									{t("book.description")}
								</label>
								<div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 leading-relaxed border border-gray-100">
									{selectedBook.description || "No description provided."}
								</div>
							</div>
							<div className="flex flex-wrap gap-2 pt-2">
								{selectedBook.forSale && (
									<span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold border border-emerald-200">
										{t("book.for_sale")} - {selectedBook.price} TL
									</span>
								)}
								{selectedBook.forSwap && (
									<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold border border-blue-200">
										{t("book.for_swap")}
									</span>
								)}
							</div>
							{selectedBookOwnershipHistory.length > 0 && (
								<div>
									<label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
										Ownership History
									</label>
									<div className="bg-slate-50 border border-slate-200 rounded-md p-2 space-y-2 max-h-40 overflow-y-auto">
										{selectedBookOwnershipHistory.map((h) => (
											<div key={h.id} className="text-xs text-slate-700 border-b border-slate-100 pb-1 last:border-b-0 last:pb-0">
												<div className="font-semibold">
													{h.transferKind === "sale" ? "Sale" : "Swap"} -{" "}
													{new Date(h.createdAt).toLocaleString()}
												</div>
												<div>
													From <span className="font-medium">{h.fromUsername || h.fromUserId || "-"}</span> to{" "}
													<span className="font-medium">{h.toUsername || h.toUserId || "-"}</span>
												</div>
												{h.note && <div className="italic text-slate-500">{h.note}</div>}
											</div>
										))}
									</div>
								</div>
							)}
						</div>
						{user && (
							<div className="mt-8 flex flex-col gap-3 pt-4 border-t">
								{selectedBook.ownerId !== user.id ? (
									<div className="flex gap-3">
										<button
											onClick={() =>
												handleStartChat(selectedBook.ownerId, selectedBook.id)
											}
											className="flex-1 bg-primary text-white py-2.5 rounded hover:bg-blue-600 flex justify-center items-center gap-2 font-medium transition shadow-sm"
										>
											<ChatBubbleLeftRightIcon className="w-5 h-5" />{" "}
											{t("modal.message_owner")}
										</button>
										{user.role === 'user' && (selectedBook.forSwap || selectedBook.forSale) &&
											selectedBook.status === BookStatus.AVAILABLE && (
												<button
													onClick={() => {
														setSelectedOwnBook("");
														setSelectedRequestedBookIds([selectedBook.id]);
														setSwapMessage("");
														setOfferedAmount("");
														setOfferType(selectedBook.forSale && !selectedBook.forSwap ? "buy" : "swap");
														setIsSwapModalOpen(true);
													}}
													className="flex-1 bg-secondary text-white py-2.5 rounded hover:bg-emerald-600 flex justify-center items-center gap-2 font-medium transition shadow-sm"
												>
													<ArrowPathRoundedSquareIcon className="w-5 h-5" />{" "}
													Send Offer
												</button>
											)}
									</div>
								) : (
									<div className="flex flex-col gap-2">
										<div className="text-center text-gray-500 text-sm italic py-2 bg-gray-50 rounded">
											{selectedBook.forSwap || selectedBook.forSale
												? t("modal.your_listing")
												: t("modal.your_inventory")}
										</div>

										{selectedBook.forSwap || selectedBook.forSale ? (
											<>
												{/* Status Change Buttons for Owner (only for listed items) */}
												{selectedBook.status !== BookStatus.SOLD &&
													selectedBook.status !== BookStatus.ARCHIVED && (
														<div className="grid grid-cols-2 gap-2 mb-2">
															<button
																onClick={() =>
																	handleUpdateBookStatus(
																		selectedBook.id,
																		BookStatus.SOLD,
																	)
																}
																className="bg-emerald-100 text-emerald-700 py-2 rounded text-sm font-bold hover:bg-emerald-200"
															>
																{t("btn.mark_sold")}
															</button>
															<button
																onClick={() =>
																	handleUpdateBookStatus(
																		selectedBook.id,
																		BookStatus.SWAPPED,
																	)
																}
																className="bg-purple-100 text-purple-700 py-2 rounded text-sm font-bold hover:bg-purple-200"
															>
																{t("btn.mark_swapped")}
															</button>
														</div>
													)}
												{selectedBook.status !== BookStatus.ARCHIVED && (
													<button
														onClick={() =>
															handleUpdateBookStatus(
																selectedBook.id,
																BookStatus.ARCHIVED,
															)
														}
														className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 text-sm font-semibold transition"
													>
														{t("btn.archive")}
													</button>
												)}
												{selectedBook.status === BookStatus.ARCHIVED && (
													<button
														onClick={() =>
															handleUpdateBookStatus(
																selectedBook.id,
																BookStatus.AVAILABLE,
															)
														}
														className="w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 text-sm font-semibold transition"
													>
														{t("btn.unarchive")}
													</button>
												)}
												<button
													onClick={() => handleDeleteBook(selectedBook.id)}
													className="w-full bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 text-sm font-semibold border border-red-200 transition"
												>
													{t("btn.delete")}
												</button>
											</>
										) : (
											<>
												<div className="grid grid-cols-1 gap-2 mb-2">
													<button
														onClick={() => {
															setSelectedBook(null);
															openEditBookModal(selectedBook);
														}}
														className="w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 text-sm font-semibold transition"
													>
														{t("btn.list_on_marketplace")}
													</button>
												</div>
												{selectedBook.status !== BookStatus.ARCHIVED && (
													<button
														onClick={() =>
															handleUpdateBookStatus(
																selectedBook.id,
																BookStatus.ARCHIVED,
															)
														}
														className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 text-sm font-semibold transition"
													>
														{t("btn.archive")}
													</button>
												)}
												<button
													onClick={() => handleDeleteBook(selectedBook.id)}
													className="w-full bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 text-sm font-semibold border border-red-200 transition"
												>
													{t("btn.delete")}
												</button>
											</>
										)}
									</div>
								)}
								{user.role === "super_admin" &&
									selectedBook.ownerId !== user.id && (
										<button
											onClick={() => handleDeleteBook(selectedBook.id)}
											className="w-full bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 text-sm font-semibold border border-red-200 transition"
										>
											Delete Book (Super Admin)
										</button>
									)}
							</div>
						)}
						{!user && (
							<Link
								to="/login"
								className="block text-center mt-6 text-primary font-medium hover:underline"
							>
								{t("modal.login_contact")}
							</Link>
						)}
					</div>
				</Modal>
			)}

			{isSwapModalOpen && (
				<Modal
					isOpen={isSwapModalOpen}
					onClose={() => setIsSwapModalOpen(false)}
					title="Send Offer"
				>
					<div className="p-4 space-y-4">
						<p className="text-gray-600">
							{t("swap_modal.requesting")}{" "}
							<strong className="text-black">{selectedBook?.title}</strong>
						</p>
						{sellerBooks.length > 1 && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Select books you are requesting
								</label>
								<div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
									{sellerBooks.map((b) => (
										<label key={b.id} className="flex items-center gap-2 text-sm">
											<input
												type="checkbox"
												checked={selectedRequestedBookIds.includes(b.id)}
												onChange={(e) => {
													setSelectedRequestedBookIds((prev) => {
														if (e.target.checked) return Array.from(new Set([...prev, b.id]));
														return prev.filter((id) => id !== b.id);
													});
												}}
											/>
											<span>{b.title}</span>
										</label>
									))}
								</div>
							</div>
						)}
						{selectedBook?.forSale && selectedBook?.forSwap && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Offer Type</label>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setOfferType("swap")}
										className={`px-3 py-2 rounded border text-sm font-semibold ${offerType === "swap" ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-gray-300 text-gray-600"}`}
									>
										Swap Request
									</button>
									<button
										type="button"
										onClick={() => setOfferType("buy")}
										className={`px-3 py-2 rounded border text-sm font-semibold ${offerType === "buy" ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-600"}`}
									>
										Buy Request
									</button>
								</div>
							</div>
						)}
						<div>
							{offerType === "buy" ? (
								<>
									<label className="block text-sm font-medium text-gray-700 mb-1">Your Buy Offer Amount</label>
									<input
										type="number"
										min={1}
										step="0.01"
										className="w-full p-2 border border-gray-300 rounded focus:ring-secondary focus:border-secondary"
										placeholder="Enter amount"
										value={offeredAmount}
										onChange={(e) => setOfferedAmount(e.target.value)}
									/>
								</>
							) : (
								<>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										{t("swap_modal.give_label")}
									</label>
									{userBooks.length > 0 ? (
										<select
											aria-label={t("swap_modal.give_label")}
											className="w-full p-2 border border-gray-300 rounded focus:ring-secondary focus:border-secondary"
											value={selectedOwnBook}
											onChange={(e) => setSelectedOwnBook(e.target.value)}
										>
											<option value="">{t("swap_modal.select_placeholder")}</option>
											{userBooks.map((b) => (
												<option key={b.id} value={b.id}>
													{b.title}
												</option>
											))}
										</select>
									) : (
										<div className="text-red-500 text-sm">
											{t("swap_modal.no_books")}
										</div>
									)}
								</>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								{t("swap_modal.message_label")}
							</label>
							<textarea
								className="w-full p-2 border border-gray-300 rounded focus:ring-secondary focus:border-secondary"
								placeholder={t("swap_modal.message_placeholder")}
								value={swapMessage}
								onChange={(e) => setSwapMessage(e.target.value)}
								rows={3}
							/>
						</div>
						<div className="flex gap-2 justify-end pt-2">
							<button
								onClick={() => setIsSwapModalOpen(false)}
								className="px-4 py-2 text-gray-600 hover:text-gray-800"
							>
								{t("btn.cancel")}
							</button>
							<button
								onClick={handleSendOffer}
								disabled={
									selectedRequestedBookIds.length === 0 ||
									(offerType === "swap" ? !selectedOwnBook : !offeredAmount || Number(offeredAmount) <= 0)
								}
								className="bg-secondary text-white px-6 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-emerald-600 font-medium"
							>
								{t("btn.send_offer")}
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
}

export default App;
