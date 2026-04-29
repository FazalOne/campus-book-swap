import React from "react";
import { useNavigate } from "react-router-dom";
import type { Book } from "../types";
import { BookStatus } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { HeartIcon, UserCircleIcon } from "./icons";
import { getDeptKey, getStatusKey, getConditionKey } from "../lib/bookLabels";

export const BookCard: React.FC<{
	book: Book;
	onViewDetails: (book: Book) => void;
	onFavoriteToggle?: (bookId: string) => void;
}> = ({ book, onViewDetails, onFavoriteToggle }) => {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const { user } = useAuth();

	// Determine type from course or genre (stored in department field)
	const bookType =
		book.course ||
		(book.department ? t(getDeptKey(book.department)) : t("dept.General"));

	const handleSellerClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (book.ownerId) navigate(`/user/${book.ownerId}`);
	};

	const handleFavoriteClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!user) {
			navigate("/login");
			return;
		}
		if (onFavoriteToggle) {
			onFavoriteToggle(book.id);
		}
	};

	let statusColor = "bg-gray-100 text-gray-700";
	if (book.status === BookStatus.AVAILABLE)
		statusColor = "bg-green-100 text-green-800";
	else if (book.status === BookStatus.REQUESTED)
		statusColor = "bg-yellow-100 text-yellow-800";
	else if (book.status === BookStatus.RESERVED)
		statusColor = "bg-orange-100 text-orange-800";
	else if (book.status === BookStatus.SOLD)
		statusColor = "bg-red-100 text-red-800";
	else if (book.status === BookStatus.SWAPPED)
		statusColor = "bg-purple-100 text-purple-800";

	return (
		<div
			className="book-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl hover:border-blue-200 cursor-pointer flex flex-col h-full bg-white relative"
			onClick={() => onViewDetails(book)}
		>
			<div className="relative h-64 bg-gray-100 flex items-center justify-center">
				<img
					src={book.imageUrl}
					alt={book.title}
					className="w-full h-full object-contain"
					onError={(e) => {
						(e.target as HTMLImageElement).src =
							"https://via.placeholder.com/300x400?text=No+Image";
					}}
				/>
				<span
					className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wide shadow-sm ${statusColor}`}
				>
					{t(getStatusKey(book.status || "Available"))}
				</span>
				{user && String(book.ownerId) !== String(user.id) && (
					<div
						className="absolute bottom-2 right-2 bg-white/80 p-1.5 rounded-full shadow hover:bg-white transition"
						onClick={handleFavoriteClick}
					>
						<div className="flex items-center gap-1">
							<HeartIcon
								className={`w-6 h-6 transition-colors ${book.isFavorited ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
								filled={book.isFavorited}
							/>
							{(book.favoriteCount || 0) > 0 && (
								<span className="text-xs font-bold text-gray-600">
									{book.favoriteCount}
								</span>
							)}
						</div>
					</div>
				)}
			</div>
			<div className="p-4 flex flex-col flex-grow">
				<h3
					className="text-lg font-bold text-gray-800 mb-1 line-clamp-2"
					title={book.title}
				>
					{book.title}
				</h3>
				<p className="text-sm text-gray-600 mb-2 truncate">{book.author}</p>

				<div className="flex flex-col gap-2 mt-2">
					<div className="flex justify-between items-center text-xs">
						<span className="bg-gray-100 text-gray-600 px-2 py-1 rounded truncate max-w-[50%]">
							{bookType}
						</span>
						<span className="font-semibold text-gray-500">
							{t(getConditionKey(book.condition))}
						</span>
					</div>
					<div className="text-[11px] text-gray-500">
						Listed: {new Date(book.listedDate).toLocaleDateString()}
					</div>

					<div
						className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded -ml-1 transition"
						onClick={handleSellerClick}
						title="View Seller Profile"
					>
						<UserCircleIcon className="w-5 h-5 text-gray-400" />
						<span className="text-sm font-medium text-blue-600 hover:underline truncate">
							{book.ownerUsername || "Unknown"}
						</span>
					</div>
				</div>

				<div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100">
					<div className="flex gap-2 flex-wrap">
						{book.inventoryTag && (
							<span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-semibold">
								{book.inventoryTag.replaceAll("_", " ")}
							</span>
						)}
						{book.forSale && (
							<span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-semibold">
								{t("book.for_sale")} {book.price ? `- ${book.price} TL` : ""}
							</span>
						)}
						{book.forSwap && (
							<span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-semibold">
								{t("book.for_swap")}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
