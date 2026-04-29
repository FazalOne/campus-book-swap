import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Book, User, Review } from "../types";
import { BookStatus, UserRole } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { BookCard } from "../components/BookCard";
import { PencilIcon, StarIcon, BookOpenIcon } from "../components/icons";

export const PublicProfilePage: React.FC<{
	onViewDetails: (book: Book) => void;
	onOpenAddBook?: () => void;
}> = ({
	onViewDetails,
	onOpenAddBook,
}) => {
	// ... (PublicProfilePage content unchanged)
	const { userId } = useParams<{ userId: string }>();
	const [profileUser, setProfileUser] = useState<User | null>(null);
	const [userBooks, setUserBooks] = useState<Book[]>([]);
	const [reviews, setReviews] = useState<Review[]>([]);
	const [newRating, setNewRating] = useState(5);
	const [newComment, setNewComment] = useState("");
	const [trustScore, setTrustScore] = useState<number | null>(null);
	const [ownBooksTab, setOwnBooksTab] = useState<"listings" | "books">("listings");
	const { t } = useLanguage();
	const { user } = useAuth();

	const fetchProfileData = () => {
		if (!userId) return;
		api
			.get<User>(`/users/${userId}/public`)
			.then(setProfileUser)
			.catch(() => setProfileUser(null));
		api
			.get<Book[]>("/books")
			.then((allBooks) => {
				setUserBooks(
					allBooks.filter(
						(b) =>
							String(b.ownerId) === userId &&
							b.status !== BookStatus.SWAPPED &&
							b.status !== BookStatus.SOLD &&
							b.status !== BookStatus.ARCHIVED,
					),
				);
			})
			.catch(console.error);
		api
			.get<Review[]>(`/users/${userId}/reviews`)
			.then(setReviews)
			.catch(console.error);
	};

	useEffect(() => {
		fetchProfileData();
	}, [userId]);

	useEffect(() => {
		if (!userId) return;
		api.get<{ score: number }>(`/users/${userId}/trust-score`)
			.then((data) => setTrustScore(data.score))
			.catch(() => setTrustScore(null));
	}, [userId]);

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newComment.trim()) return;
		try {
			await api.post("/reviews", {
				targetUserId: userId,
				rating: newRating,
				comment: newComment,
			});
			setNewComment("");
			setNewRating(5);
			fetchProfileData();
		} catch (e) {
			alert("Failed to submit review");
		}
	};

	if (!profileUser)
		return <div className="text-center p-8">Loading profile...</div>;
	const isOwnProfile = String(user?.id) === String(userId);
	const isMarketplaceOwnerProfile = isOwnProfile && profileUser.role === UserRole.USER;
	const ownListings = userBooks.filter((b) => b.forSale || b.forSwap);
	const ownInventory = userBooks.filter((b) => !b.forSale && !b.forSwap);
	const visibleBooks = isMarketplaceOwnerProfile
		? ownBooksTab === "listings"
			? ownListings
			: ownInventory
		: userBooks;

	return (
		<div className="container mx-auto p-4 max-w-6xl">
			{/* New Modern Profile Header Design */}
			<div className="md-surface rounded-2xl overflow-hidden mb-8">
				{/* Banner Section */}
				<div className="h-48 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 relative">
					<div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
					{isOwnProfile && (
						<div className="absolute top-4 right-4">
							<Link
								to="/profile"
								className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm font-semibold text-sm transition flex items-center gap-2 border border-white/40"
							>
								<PencilIcon className="w-4 h-4" />
								{t("btn.edit")}
							</Link>
						</div>
					)}
				</div>

				{/* Profile Content Container */}
				<div className="px-8 pb-8">
					<div className="flex flex-col md:flex-row gap-6 items-start relative -mt-16">
						{/* Profile Picture */}
						<div className="relative shrink-0 mx-auto md:mx-0">
							<img
								src={profileUser.avatarUrl}
								alt={profileUser.username}
								className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white object-cover"
							/>
							<div
								className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"
								title="Online"
							></div>
						</div>

						{/* User Information */}
						<div className="pt-2 md:pt-16 flex-1 text-center md:text-left w-full">
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
								<div>
									<h1 className="text-3xl font-bold text-gray-900">
										{profileUser.firstName} {profileUser.lastName}
									</h1>
									<div className="flex items-center justify-center md:justify-start gap-3 mt-1 text-gray-600 font-medium">
										<span className="flex items-center gap-1">
											@{profileUser.username}
										</span>
										<span className="text-gray-300">•</span>
										<span
											className={`px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wide ${profileUser.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
										>
											{profileUser.role}
										</span>
									</div>
								</div>

								{/* Action Buttons / Stats */}
								<div className="flex flex-col sm:flex-row gap-3 items-center justify-center md:justify-end">
									<div className="flex flex-col items-center px-4 py-1 bg-blue-50 rounded-lg border border-blue-100">
										<span className="text-[10px] text-blue-600 font-bold uppercase">Trust Score</span>
										<span className="text-xl font-bold text-blue-700">{trustScore ?? 0}/100</span>
									</div>
									<div className="flex flex-col items-center px-4 py-1 bg-yellow-50 rounded-lg border border-yellow-100">
										<div className="flex items-center gap-1 text-yellow-500">
											<span className="text-xl font-bold text-gray-800">
												{profileUser.averageRating || "0.0"}
											</span>
											<StarIcon className="w-5 h-5" filled />
										</div>
										<span className="text-xs text-yellow-600 font-medium">
											{reviews.length} Review{reviews.length !== 1 && "s"}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Column: Reviews & Forms */}
				<div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
					{!isOwnProfile && user && (
						<div className="md-surface p-5 rounded-xl">
							<h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<PencilIcon className="w-5 h-5 text-primary" />
								{t("profile.add_review")}
							</h3>
							<form onSubmit={handleSubmitReview}>
								<div className="mb-4">
									<label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
										{t("profile.rating_label")}
									</label>
									<div className="flex gap-2">
										{[1, 2, 3, 4, 5].map((star) => (
											<StarIcon
												key={star}
												className={`w-8 h-8 cursor-pointer transition-transform hover:scale-110 ${star <= newRating ? "text-yellow-400" : "text-gray-200"}`}
												filled={true}
												onClick={() => setNewRating(star)}
											/>
										))}
									</div>
								</div>
								<div className="mb-4">
									<label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
										{t("profile.comment_label")}
									</label>
									<textarea
										className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none bg-gray-50 focus:bg-white"
										rows={4}
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										placeholder="Share your experience with this user..."
										required
									/>
								</div>
								<button
									type="submit"
									className="w-full bg-primary text-white py-3 rounded-lg text-sm font-bold hover:bg-blue-600 transition shadow-sm hover:shadow"
								>
									{t("profile.submit_review")}
								</button>
							</form>
						</div>
					)}

					<div className="md-surface p-5 rounded-xl">
						<h3 className="font-bold text-gray-800 mb-4 border-b pb-3 flex justify-between items-center">
							<span>{t("profile.reviews")}</span>
							<span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
								{reviews.length}
							</span>
						</h3>
						{reviews.length === 0 ? (
							<div className="text-center py-8">
								<div className="inline-block p-3 bg-gray-50 rounded-full mb-3">
									<StarIcon className="w-6 h-6 text-gray-300" />
								</div>
								<p className="text-gray-500 text-sm">
									{t("profile.no_reviews")}
								</p>
							</div>
						) : (
							<div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
								{reviews.map((review) => (
									<div
										key={review.id}
										className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition"
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<img
													src={review.reviewerAvatarUrl}
													className="w-8 h-8 rounded-full bg-gray-200 object-cover border border-white shadow-sm"
													alt=""
												/>
												<span className="text-sm font-bold text-gray-800">
													{review.reviewerUsername}
												</span>
											</div>
											<div className="flex text-yellow-400">
												{[...Array(5)].map((_, i) => (
													<StarIcon
														key={i}
														className="w-3 h-3"
														filled={i < review.rating}
													/>
												))}
											</div>
										</div>
										<p className="text-sm text-gray-600 mb-2 leading-relaxed">
											"{review.comment}"
										</p>
										<div className="text-[10px] text-gray-400 text-right font-medium">
											{new Date(review.createdAt).toLocaleDateString()}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right Column: Listings */}
				<div className="lg:col-span-2 order-1 lg:order-2">
					{isOwnProfile && profileUser.role !== UserRole.USER ? (
						<div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
							<h3 className="text-lg font-bold text-blue-900 mb-1">Admin account</h3>
							<p className="text-sm text-blue-700">
								Admin profiles are read-only for marketplace actions. Listings, offers, and book inventory are only available for student user accounts.
							</p>
						</div>
					) : (
						<>
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
									<BookOpenIcon className="w-6 h-6 text-primary" />
									{isMarketplaceOwnerProfile
										? ownBooksTab === "listings"
											? "My Listings"
											: "My Books"
										: t("profile.public.listings").replace(
												"{name}",
												profileUser.firstName,
											)}
								</h2>
								<span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border">
									{visibleBooks.length} Books
								</span>
							</div>
							{isMarketplaceOwnerProfile && (
								<div className="mb-4 flex gap-2">
									<button
										onClick={() => setOwnBooksTab("listings")}
										className={`px-3 py-2 rounded-lg text-sm font-semibold ${ownBooksTab === "listings" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
									>
										My Listings ({ownListings.length})
									</button>
									<button
										onClick={() => setOwnBooksTab("books")}
										className={`px-3 py-2 rounded-lg text-sm font-semibold ${ownBooksTab === "books" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
									>
										My Books ({ownInventory.length})
									</button>
									<button
										type="button"
										onClick={() => onOpenAddBook?.()}
										className="ml-auto px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
									>
										Add Book
									</button>
								</div>
							)}

							{visibleBooks.length === 0 ? (
								<div className="text-center py-16 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200">
									<BookOpenIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
									<p className="text-gray-500 font-medium text-lg">
										{isMarketplaceOwnerProfile
											? ownBooksTab === "listings"
												? "You do not have active listings yet."
												: "You do not have books in inventory yet."
											: t("profile.public.empty")}
									</p>
									<p className="text-gray-400 text-sm mt-1">
										{isMarketplaceOwnerProfile
											? ownBooksTab === "listings"
												? "Use Add Book to create a listing."
												: "Complete swaps or add books to build inventory."
											: "Check back later for new listings."}
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
									{visibleBooks.map((book) => (
										<BookCard
											key={book.id}
											book={book}
											onViewDetails={onViewDetails}
										/>
									))}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};
