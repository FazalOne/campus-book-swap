import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Book } from "../types";
import { BookCondition, BookStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { DEPARTMENTS } from "../constants";
import { ds } from "../designSystem";
import { getDeptKey } from "../lib/bookLabels";
import { PhotoIcon } from "../components/icons";

export const AddEditBookForm: React.FC<{
	initialBook?: Book | null;
	onDone?: () => void;
	onCancel?: () => void;
}> = ({ initialBook, onDone, onCancel }) => {
	// ... (AddEditBookForm content unchanged)
	const { user } = useAuth();
	const navigate = useNavigate();
	const { t, language } = useLanguage();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

	const [formData, setFormData] = useState<Partial<Book>>({
		title: "",
		author: "",
		isbn: "",
		edition: "",
		course: "",
		department: "",
		condition: BookCondition.GOOD,
		description: "",
		imageUrl: "",
		price: undefined,
		forSwap: false,
		forSale: false,
		status: BookStatus.AVAILABLE,
	});

	useEffect(() => {
		if (initialBook) setFormData(initialBook);
	}, [initialBook]);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > MAX_FILE_SIZE) {
				alert(t("alert.file_too_large"));
				e.target.value = ""; // Reset input
				return;
			}
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.author || !formData.imageUrl) {
			alert(t("alert.fill_required"));
			return;
		}

		// If listing for sale, require a price. Otherwise leave price null.
		let safePrice: number | null = null;
		if (formData.forSale) {
			if (
				formData.price === undefined ||
				formData.price === null ||
				Number.isNaN(Number(formData.price))
			) {
				alert(t("book.price") + " required when listing for sale.");
				return;
			}
			safePrice = Number(formData.price);
		}

		setIsSubmitting(true);

		// Timeout Promise to prevent infinite hanging
		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(() => reject(new Error(t("error.timeout"))), 20000),
		);

		try {
			const bookPayload = {
				...formData,
				price: safePrice,
				id: initialBook ? initialBook.id : `book_${Date.now()}`,
				listedDate: initialBook
					? initialBook.listedDate
					: new Date().toISOString(),
			};

			const apiCall = initialBook
				? api.put(`/books/${initialBook.id}`, bookPayload)
				: api.post("/books", bookPayload);

			// Race between the API call and the timeout
			await Promise.race([apiCall, timeoutPromise]);

			if (onDone) onDone();
			else navigate(`/user/${user?.id}`);
		} catch (err: any) {
			console.error("Save error:", err);
			alert("Error saving book: " + (err.message || "Unknown error"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const optionalText = language === "tr" ? "(Opsiyonel)" : "(Optional)";

	return (
		<div className="max-w-2xl">
			<form
				onSubmit={handleSubmit}
				className="md-surface p-4 space-y-3"
			>
				<div className="flex justify-center mb-2">
					<div
						className={`w-28 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden ${!formData.imageUrl ? "bg-red-50 border-red-200" : ""}`}
						onClick={() => fileInputRef.current?.click()}
					>
						{formData.imageUrl ? (
							<img
								src={formData.imageUrl}
								alt="Preview"
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="text-center p-2">
								<PhotoIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
								<span className="text-xs text-gray-500">
									{t("book.photo")} *
								</span>
							</div>
						)}
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept="image/*"
							onChange={handleImageUpload}
						/>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							{t("book.title")} *
						</label>
						<input
							required
							className="w-full border p-2 rounded mt-1"
							value={formData.title}
							onChange={(e) =>
								setFormData({ ...formData, title: e.target.value })
							}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							{t("book.author")} *
						</label>
						<input
							required
							className="w-full border p-2 rounded mt-1"
							value={formData.author}
							onChange={(e) =>
								setFormData({ ...formData, author: e.target.value })
							}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							{t("book.isbn")}
						</label>
						<input
							className="w-full border p-2 rounded mt-1"
							value={formData.isbn}
							onChange={(e) =>
								setFormData({ ...formData, isbn: e.target.value })
							}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							{t("book.condition")}
						</label>
						<select
							className="w-full border p-2 rounded mt-1"
							value={formData.condition}
							onChange={(e) =>
								setFormData({
									...formData,
									condition: e.target.value as BookCondition,
								})
							}
						>
							{Object.values(BookCondition).map((c) => (
								<option key={c} value={c}>
									{t(`condition.${c}`)}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							{t("book.edition")}{" "}
							<span className="text-gray-400 text-xs">{optionalText}</span>
						</label>
						<input
							className="w-full border p-2 rounded mt-1"
							value={formData.edition}
							onChange={(e) =>
								setFormData({ ...formData, edition: e.target.value })
							}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							{t("book.course")}{" "}
							<span className="text-gray-400 text-xs">{optionalText}</span>
						</label>
						<input
							className="w-full border p-2 rounded mt-1"
							value={formData.course}
							onChange={(e) =>
								setFormData({ ...formData, course: e.target.value })
							}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Genre{" "}
							<span className="text-gray-400 text-xs">{optionalText}</span>
						</label>
						<select
							className="w-full border p-2 rounded mt-1"
							value={formData.department}
							onChange={(e) =>
								setFormData({ ...formData, department: e.target.value })
							}
						>
							<option value="">All Genres</option>
							{DEPARTMENTS.map((d) => (
								<option key={d} value={d}>
									{t(getDeptKey(d))}
								</option>
							))}
						</select>
					</div>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						{t("book.description")}
					</label>
					<textarea
						className="w-full border p-2 rounded mt-1"
						rows={4}
						value={formData.description}
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
					/>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 rounded border border-slate-200">
					<label htmlFor="forSwap" className={`${ds.chip} cursor-pointer`}>
						<input
							type="checkbox"
							id="forSwap"
							checked={formData.forSwap}
							onChange={(e) =>
								setFormData({ ...formData, forSwap: e.target.checked })
							}
							className="w-4 h-4 text-secondary rounded focus:ring-secondary"
						/>
						<span className="text-sm font-medium text-gray-700">
							{t("book.for_swap")}
						</span>
					</label>
					<label htmlFor="forSale" className={`${ds.chip} cursor-pointer`}>
						<input
							type="checkbox"
							id="forSale"
							checked={formData.forSale}
							onChange={(e) =>
								setFormData({
									...formData,
									forSale: e.target.checked,
									price: e.target.checked ? formData.price : undefined,
								})
							}
							className="w-4 h-4 text-primary rounded focus:ring-primary"
						/>
						<span className="text-sm font-medium text-gray-700">
							{t("book.for_sale")}
						</span>
					</label>
					{formData.forSale && (
						<div className="flex items-center gap-2 sm:ml-auto">
							<input
								type="number"
								min={1}
								placeholder="Price"
								className={`${ds.input} w-24 p-1.5 text-sm`}
								value={formData.price ?? ""}
								onChange={(e) =>
									setFormData({
										...formData,
										price: e.target.value === "" ? undefined : Number(e.target.value),
									})
								}
							/>
							<span className="text-sm text-gray-500">TL</span>
						</div>
					)}
				</div>
				<div className="flex justify-end pt-4">
					<button
						type="button"
						onClick={() => (onCancel ? onCancel() : navigate(`/user/${user?.id}`))}
						className={`${ds.btnSecondary} mr-3 px-4 py-2`}
						disabled={isSubmitting}
					>
						{t("btn.cancel")}
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className={`bg-primary text-white px-6 py-2 rounded flex items-center gap-2 font-medium transition ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-600"}`}
					>
						{isSubmitting ? (
							<>
								<span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
								{t("btn.saving")}
							</>
						) : initialBook ? (
							t("btn.save_changes")
						) : (
							t("btn.save_book")
						)}
					</button>
				</div>
			</form>
		</div>
	);
};
