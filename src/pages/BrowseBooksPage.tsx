import React, { useState, useEffect } from "react";
import type { Book } from "../types";
import { BookCondition, BookStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { DEPARTMENTS } from "../constants";
import { ds } from "../designSystem";
import { getDeptKey, getConditionKey } from "../lib/bookLabels";
import { BookCard } from "../components/BookCard";
import {
	MagnifyingGlassIcon,
	HeartIcon,
	BookOpenIcon,
	ArrowPathRoundedSquareIcon,
} from "../components/icons";

export const BrowseBooksPage: React.FC<{ onViewDetails: (book: Book) => void }> = ({
	onViewDetails,
}) => {
	const [books, setBooks] = useState<Book[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [conditionFilter, setConditionFilter] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState("");
	const [minPrice, setMinPrice] = useState("");
	const [maxPrice, setMaxPrice] = useState("");
	const [sortOption, setSortOption] = useState("date_desc");
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [forSwapOnly, setForSwapOnly] = useState(false);
	const [forSaleOnly, setForSaleOnly] = useState(false);
	const [listedWithin, setListedWithin] = useState<
		"all" | "today" | "week" | "month"
	>("all");

	const { t } = useLanguage();
	const { user } = useAuth();

	useEffect(() => {
		const raw = localStorage.getItem("browseFilters");
		if (!raw) return;
		try {
			const parsed = JSON.parse(raw);
			setSearchTerm(parsed.searchTerm || "");
			setConditionFilter(parsed.conditionFilter || "");
			setDepartmentFilter(parsed.departmentFilter || "");
			setMinPrice(parsed.minPrice || "");
			setMaxPrice(parsed.maxPrice || "");
			setSortOption(parsed.sortOption || "date_desc");
			setForSwapOnly(!!parsed.forSwapOnly);
			setForSaleOnly(!!parsed.forSaleOnly);
			setListedWithin(parsed.listedWithin || "all");
		} catch {}
	}, []);

	useEffect(() => {
		const sortMap: Record<string, string> = {
			date_desc: "newest",
			price_asc: "price_asc",
			price_desc: "price_desc",
		};
		const params = new URLSearchParams();
		if (searchTerm) params.set("q", searchTerm);
		if (conditionFilter) params.set("condition", conditionFilter);
		if (departmentFilter) params.set("department", departmentFilter);
		if (minPrice) params.set("minPrice", minPrice);
		if (maxPrice) params.set("maxPrice", maxPrice);
		if (forSwapOnly) params.set("forSwap", "true");
		if (forSaleOnly) params.set("forSale", "true");
		params.set("sort", sortMap[sortOption] || "newest");
		api.get<Book[]>(`/books/search?${params.toString()}`)
			.then(setBooks)
			.catch(console.error);
	}, [searchTerm, conditionFilter, departmentFilter, minPrice, maxPrice, sortOption, forSwapOnly, forSaleOnly]);

	const saveCurrentFilters = () => {
		localStorage.setItem(
			"browseFilters",
			JSON.stringify({
				searchTerm,
				conditionFilter,
				departmentFilter,
				minPrice,
				maxPrice,
				sortOption,
				forSwapOnly,
				forSaleOnly,
				listedWithin,
			}),
		);
		alert("Filters saved.");
	};

	const handleFavoriteToggle = async (bookId: string) => {
		if (!user) return;
		try {
			const res = await api.post<{ isFavorited: boolean }>(
				`/books/${bookId}/favorite`,
				{},
			);
			setBooks((prevBooks) =>
				prevBooks.map((b) =>
					b.id === bookId
						? {
								...b,
								isFavorited: res.isFavorited,
								favoriteCount:
									(b.favoriteCount || 0) + (res.isFavorited ? 1 : -1),
							}
						: b,
				),
			);
		} catch (e) {
			console.error("Favorite toggle failed", e);
		}
	};

	const filteredBooks = books.filter((b) => {
		const isNotMine = user ? String(b.ownerId) !== String(user.id) : true;
		const isActive =
			b.status !== BookStatus.SWAPPED &&
			b.status !== BookStatus.SOLD &&
			b.status !== BookStatus.ARCHIVED;
		const matchesFavorites = showFavoritesOnly ? b.isFavorited : true;
		const listedAt = new Date(b.listedDate).getTime();
		const now = Date.now();
		const dayMs = 24 * 60 * 60 * 1000;
		const matchesListedWindow =
			listedWithin === "all"
				? true
				: listedWithin === "today"
					? now - listedAt <= dayMs
					: listedWithin === "week"
						? now - listedAt <= 7 * dayMs
						: now - listedAt <= 30 * dayMs;

		return isNotMine && isActive && matchesFavorites && matchesListedWindow;
	});

	const sortedBooks = [...filteredBooks].sort((a, b) => {
		switch (sortOption) {
			case "date_desc":
				return (
					new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime()
				);
			case "date_asc":
				return (
					new Date(a.listedDate).getTime() - new Date(b.listedDate).getTime()
				);
			case "price_asc":
				return (a.price || 0) - (b.price || 0);
			case "price_desc":
				return (b.price || 0) - (a.price || 0);
			default:
				return 0;
		}
	});

	const clearFilters = () => {
		setSearchTerm("");
		setConditionFilter("");
		setDepartmentFilter("");
		setMinPrice("");
		setMaxPrice("");
		setSortOption("date_desc");
		setShowFavoritesOnly(false);
		setForSwapOnly(false);
		setForSaleOnly(false);
		setListedWithin("all");
	};

	return (
		<div className="container mx-auto p-4 max-w-6xl">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-bold text-gray-800">Current Listings</h2>
				<div className="text-sm text-gray-500">{sortedBooks.length} books</div>
			</div>
			<div className={`${ds.panel} mb-6 p-4`}>
				<div className="flex flex-col md:flex-row gap-4 mb-4">
					<div className="flex-1 relative">
						<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
						<input
							type="text"
							placeholder={t("browse.search_placeholder")}
							className={`${ds.input} w-full pl-10 p-2`}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<div className="flex flex-col sm:flex-row gap-2">
						<select
							className={`${ds.input} p-2`}
							value={departmentFilter}
							onChange={(e) => setDepartmentFilter(e.target.value)}
						>
							<option value="">All Genres</option>
							{DEPARTMENTS.map((d) => (
								<option key={d} value={d}>
									{t(getDeptKey(d))}
								</option>
							))}
						</select>
						<select
							className={`${ds.input} p-2`}
							value={conditionFilter}
							onChange={(e) => setConditionFilter(e.target.value)}
						>
							<option value="">{t("browse.all_conditions")}</option>
							{Object.values(BookCondition).map((c) => (
								<option key={c} value={c}>
									{t(getConditionKey(c))}
								</option>
							))}
						</select>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between">
					<div className="flex gap-2 items-center w-full sm:w-auto">
						<input
							type="number"
							placeholder={t("browse.filter_price_min")}
							className={`${ds.input} w-24 p-2`}
							value={minPrice}
							onChange={(e) => setMinPrice(e.target.value)}
						/>
						<span>-</span>
						<input
							type="number"
							placeholder={t("browse.filter_price_max")}
							className={`${ds.input} w-24 p-2`}
							value={maxPrice}
							onChange={(e) => setMaxPrice(e.target.value)}
						/>
						{user && (
							<label className={`${ds.chip} cursor-pointer select-none ml-2`}>
								<input
									type="checkbox"
									checked={showFavoritesOnly}
									onChange={(e) => setShowFavoritesOnly(e.target.checked)}
									className="rounded text-primary focus:ring-primary"
								/>
								<span className="text-sm font-medium text-gray-700 flex items-center gap-1">
									<HeartIcon
										className={`w-4 h-4 ${showFavoritesOnly ? "text-red-500 fill-current" : "text-gray-400"}`}
									/>
									{t("browse.favorites_only")}
								</span>
							</label>
						)}
						<label className={`${ds.chip} cursor-pointer select-none`}>
							<input
								type="checkbox"
								checked={forSwapOnly}
								onChange={(e) => setForSwapOnly(e.target.checked)}
								className="rounded text-primary focus:ring-primary"
							/>
							<span className="text-sm font-medium text-gray-700">For Swap</span>
						</label>
						<label className={`${ds.chip} cursor-pointer select-none`}>
							<input
								type="checkbox"
								checked={forSaleOnly}
								onChange={(e) => setForSaleOnly(e.target.checked)}
								className="rounded text-primary focus:ring-primary"
							/>
							<span className="text-sm font-medium text-gray-700">For Sale</span>
						</label>
					</div>
					<div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
						<span className="text-sm font-bold text-gray-600 whitespace-nowrap">
							{t("browse.sort_by")}:
						</span>
						<select
							className={`${ds.input} p-2 w-full sm:w-auto`}
							value={sortOption}
							onChange={(e) => setSortOption(e.target.value)}
						>
							<option value="date_desc">{t("browse.sort_newest")}</option>
							<option value="date_asc">{t("browse.sort_oldest")}</option>
							<option value="price_asc">{t("browse.sort_price_low")}</option>
							<option value="price_desc">{t("browse.sort_price_high")}</option>
						</select>
						<select
							className={`${ds.input} p-2 w-full sm:w-auto`}
							value={listedWithin}
							onChange={(e) =>
								setListedWithin(
									e.target.value as "all" | "today" | "week" | "month",
								)
							}
							title="Filter by listed date range"
						>
							<option value="all">Listed: Anytime</option>
							<option value="today">Listed: Today</option>
							<option value="week">Listed: This Week</option>
							<option value="month">Listed: This Month</option>
						</select>
						<button
							onClick={saveCurrentFilters}
							className={`${ds.btnSecondary} whitespace-nowrap px-4 py-2 text-sm`}
						>
							Save preset
						</button>
						<button
							onClick={clearFilters}
							className={`${ds.btnDanger} flex items-center gap-1 whitespace-nowrap px-4 py-2 text-sm`}
						>
							<ArrowPathRoundedSquareIcon className="w-4 h-4" />{" "}
							{t("browse.clear_filters")}
						</button>
					</div>
				</div>
			</div>

			{sortedBooks.length === 0 ? (
				<div className="text-center py-12">
					<BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
					<p className="text-xl text-gray-500 font-semibold">
						{t("browse.no_books")}
					</p>
					<p className="text-gray-400">{t("browse.try_adjusting")}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{sortedBooks.map((book, index) => (
						<div
							key={`${book.id}-${sortOption}-${listedWithin}-${forSwapOnly}-${forSaleOnly}-${conditionFilter}-${departmentFilter}`}
							className="book-card-wrap"
							style={{
								animationDelay: `${Math.min(index * 55, 420)}ms`,
							}}
						>
							<BookCard
								book={book}
								onViewDetails={onViewDetails}
								onFavoriteToggle={handleFavoriteToggle}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
