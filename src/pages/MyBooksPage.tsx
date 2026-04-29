import React, { useState, useEffect } from "react";
import type { Book } from "../types";
import { BookStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { BookCard } from "../components/BookCard";
import { PlusCircleIcon, BookOpenIcon, PencilIcon, TrashIcon } from "../components/icons";

export const MyBooksPage: React.FC<{
	onViewDetails: (book: Book) => void;
	onEditBook: (book: Book) => void;
	onAddBook?: () => void;
}> = ({ onViewDetails, onEditBook, onAddBook }) => {
	const [myBooks, setMyBooks] = useState<Book[]>([]);
	const { user } = useAuth();
	const isMarketplaceUser = user?.role === 'user';
	const { t } = useLanguage();

	const fetchMyBooks = () => {
		if (user) {
			api.get<Book[]>('/books').then((all) => {
				setMyBooks(all.filter((b) => b.ownerId === user.id));
			});
		}
	};

	useEffect(() => {
		fetchMyBooks();
	}, [user]);

	const handleDelete = async (e: React.MouseEvent, bookId: string) => {
		e.stopPropagation();
		if (!window.confirm('Delete permanently? This will remove the book from your account.')) return;
		try {
			await api.delete(`/books/${bookId}`);
			setMyBooks((prev) => prev.filter((b) => b.id !== bookId));
		} catch (err: any) {
			alert('Delete failed: ' + err.message);
		}
	};

	const handleUnlist = async (e: React.MouseEvent, book: Book) => {
		e.stopPropagation();
		if (!window.confirm('Unlist this book? It will be moved back to My Books.')) return;
		try {
			await api.put(`/books/${book.id}`, {
				...book,
				forSwap: false,
				forSale: false,
				status: BookStatus.AVAILABLE,
				price: null,
			});
			setMyBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, forSwap: false, forSale: false, status: BookStatus.AVAILABLE, price: null } : b)));
		} catch (err) {
			alert('Unlist failed');
		}
	};

	const handleListOnMarketplace = (e: React.MouseEvent, book: Book) => {
		e.stopPropagation();
		onEditBook(book);
	};

	const listings = myBooks.filter((b) => b.forSwap || b.forSale);
	const inventory = myBooks.filter((b) => !b.forSwap && !b.forSale);

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-800">{t('my_books.title')}</h2>
				{isMarketplaceUser && (
					<button
						type="button"
						onClick={() => onAddBook?.()}
						className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600 transition shadow-sm"
					>
						<PlusCircleIcon className="w-5 h-5" /> {t('my_books.add_new')}
					</button>
				)}
			</div>

			{/* Listed on Marketplace */}
			<section className="mb-8">
				<h3 className="text-xl font-semibold mb-4">{t('my_listings.title')}</h3>
				{listings.length === 0 ? (
					<div className="text-center py-6 md-surface border-dashed border-gray-300">
						<BookOpenIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
						<p className="text-gray-500 text-lg">{t('my_listings.empty')}</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{listings.map((book) => (
							<div key={book.id} className="relative group">
								<BookCard book={book} onViewDetails={onViewDetails} />
								<div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={(e) => {
											e.stopPropagation();
											onEditBook(book);
										}}
										className="bg-white text-blue-600 p-1.5 rounded-full shadow hover:bg-blue-50 hover:-translate-y-0.5"
										title={t('btn.edit')}
									>
										<PencilIcon className="w-4 h-4" />
									</button>
									<button
										onClick={(e) => handleUnlist(e, book)}
										className="bg-white text-yellow-600 p-1.5 rounded-full shadow hover:bg-yellow-50 hover:-translate-y-0.5"
										title="Unlist (move to My Books)"
									>
										<TrashIcon className="w-4 h-4" />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Owned by you (Inventory) */}
			<section>
				<h3 className="text-xl font-semibold mb-4">{t('my_books.owned')}</h3>
				{inventory.length === 0 ? (
					<div className="text-center py-6 md-surface border-dashed border-gray-300">
						<BookOpenIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
						<p className="text-gray-500 text-lg">{t('my_books.empty')}</p>
						{isMarketplaceUser && (
							<button
								type="button"
								onClick={() => onAddBook?.()}
								className="text-primary font-medium hover:underline mt-2 inline-block"
							>
								{t('my_books.list_first')}
							</button>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{inventory.map((book) => (
							<div key={book.id} className="relative group">
								<BookCard book={book} onViewDetails={onViewDetails} />
								<div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={(e) => {
											e.stopPropagation();
											onEditBook(book);
										}}
										className="bg-white text-blue-600 p-1.5 rounded-full shadow hover:bg-blue-50 hover:-translate-y-0.5"
										title={t('btn.edit')}
									>
										<PencilIcon className="w-4 h-4" />
									</button>
									<button
										onClick={(e) => handleListOnMarketplace(e, book)}
										className="bg-white text-green-600 p-1.5 rounded-full shadow hover:bg-green-50 hover:-translate-y-0.5"
										title={t('btn.list_on_marketplace')}
									>
										<PlusCircleIcon className="w-4 h-4" />
									</button>
									<button
										onClick={(e) => handleDelete(e, book.id)}
										className="bg-white text-red-600 p-1.5 rounded-full shadow hover:bg-red-50 hover:-translate-y-0.5"
										title="Delete Permanently"
									>
										<TrashIcon className="w-4 h-4" />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
};
