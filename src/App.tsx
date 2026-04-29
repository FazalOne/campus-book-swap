import React, { useState, useEffect, useRef } from "react";
import {
	Routes,
	Route,
	Link,
	useParams,
	useNavigate,
	Navigate,
	useLocation,
} from "react-router-dom";
import {
	Book,
	User,
	ChatMessage,
	ChatThread,
	SwapOffer,
	BookCondition,
	SwapStatus,
	UserRole,
	Review,
	BookStatus,
	Report,
	ContactMessage,
	BookOwnershipEvent,
} from "./types";
import { api } from "./lib/api";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";
import { LoginPage, RegisterPage } from "./AuthPages";
import { DEPARTMENTS } from "./constants";
import { ds } from "./designSystem";

// --- Icons (Inline SVGs) ---
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className || "w-6 h-6"}
	>
		<path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.882V4.533ZM12.75 20.633A8.237 8.237 0 0 0 18 18.75c1.995 0 3.823.707 5.25 1.882a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.099Z" />
	</svg>
);
const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			fillRule="evenodd"
			d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75-9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
			clipRule="evenodd"
		/>
	</svg>
);
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			fillRule="evenodd"
			d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
			clipRule="evenodd"
		/>
	</svg>
);
const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M6 18 18 6M6 6l12 12"
		/>
	</svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
		/>
	</svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
		/>
	</svg>
);

const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({
	className,
}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
		/>
	</svg>
);

const ArrowPathRoundedSquareIcon: React.FC<{ className?: string }> = ({
	className,
}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
		/>
	</svg>
);

const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			fillRule="evenodd"
			d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
			clipRule="evenodd"
		/>
	</svg>
);

const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			fillRule="evenodd"
			d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
			clipRule="evenodd"
		/>
	</svg>
);

const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1 1.043-3.296A3.745 3.745 0 0 1 21 12Z"
		/>
	</svg>
);

const MagnifyingGlassIcon: React.FC<{ className?: string }> = ({
	className,
}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
		/>
	</svg>
);

const ArrowRightOnRectangleIcon: React.FC<{ className?: string }> = ({
	className,
}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
		/>
	</svg>
);

const ArrowLeftOnRectangleIcon: React.FC<{ className?: string }> = ({
	className,
}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
		/>
	</svg>
);

const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
		/>
	</svg>
);

const EnvelopeIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
		/>
	</svg>
);

const StarIcon: React.FC<{
	className?: string;
	filled?: boolean;
	onClick?: () => void;
}> = ({ className, filled, onClick }) => (
	<svg
		onClick={onClick}
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill={filled ? "currentColor" : "none"}
		stroke="currentColor"
		strokeWidth={filled ? 0 : 1.5}
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
		/>
	</svg>
);

const FlagIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
		/>
	</svg>
);

const NoSymbolIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
		/>
	</svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
		/>
	</svg>
);

const HeartIcon: React.FC<{
	className?: string;
	filled?: boolean;
	onClick?: (e: React.MouseEvent) => void;
}> = ({ className, filled, onClick }) => (
	<svg
		onClick={onClick}
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill={filled ? "currentColor" : "none"}
		stroke="currentColor"
		strokeWidth={1.5}
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
		/>
	</svg>
);

const Bars3Icon: React.FC<{ className?: string; onClick?: () => void }> = ({
	className,
	onClick,
}) => (
	<svg
		onClick={onClick}
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth={1.5}
		stroke="currentColor"
		className={className || "w-6 h-6"}
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
		/>
	</svg>
);

// --- Components ---

const Modal: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh]">
				<div className="flex justify-between items-center p-4 border-b shrink-0 bg-gray-50">
					<h3 className="text-xl font-bold text-gray-800">{title}</h3>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
					>
						<XMarkIcon className="w-6 h-6" />
					</button>
				</div>
				<div className="p-0 overflow-y-auto">{children}</div>
			</div>
		</div>
	);
};

// ... Helper for dynamic condition translation keys
const getConditionKey = (condition: string) => `condition.${condition}`;
const getStatusKey = (status: string) => `status.${status}`;
const getDeptKey = (dept: string) => `dept.${dept}`;

// BookCard Component
const BookCard: React.FC<{
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

// ... ChatPage ...
const ChatPage: React.FC<{
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

// ... AdminPanel ...
const AdminPanel: React.FC<{ onViewDetails: (book: Book) => void }> = ({ onViewDetails }) => {
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

// ... ProfilePage ...
const ProfilePage: React.FC = () => {
	// ... (ProfilePage content unchanged)
	const { user, updateUser } = useAuth();
	const { t } = useLanguage();
	const [formData, setFormData] = useState<User | null>(null);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [oldPassword, setOldPassword] = useState("");
	const [analytics, setAnalytics] = useState<any | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (user) setFormData(user);
	}, [user]);

	useEffect(() => {
		if (!user) return;
		api.get<any>("/analytics/dashboard").then(setAnalytics).catch(() => setAnalytics(null));
	}, [user]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!formData) return;
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && formData) {
			if (file.size > 5000000) {
				alert("File is too large.");
				return;
			}
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormData({ ...formData, avatarUrl: reader.result as string });
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemovePhoto = async () => {
		if (!formData || !user) return;
		if (
			!window.confirm(
				t("profile.remove_photo_confirm") ||
					"Are you sure you want to remove your profile photo?",
			)
		)
			return;

		const defaultUrl = `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`;

		try {
			// Update immediately on backend to persist change
			const res = await api.put<{ success: boolean; user: User }>(
				`/users/${user.id}`,
				{
					...formData,
					avatarUrl: defaultUrl,
				},
			);

			if (res.success) {
				setFormData({ ...formData, avatarUrl: defaultUrl });
				updateUser(res.user);
			}
		} catch (e: any) {
			alert("Failed to remove photo: " + e.message);
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData) return;
		if (newPassword && newPassword !== confirmPassword) {
			alert(t("profile.passwords_do_not_match"));
			return;
		}
		try {
			const res = await api.put<{ success: boolean; user: User }>(
				`/users/${user?.id}`,
				{ ...formData, newPassword, oldPassword },
			);
			if (res.success) {
				updateUser(res.user);
				setNewPassword("");
				setConfirmPassword("");
				setOldPassword("");
				alert(t("profile.success"));
			}
		} catch (e: any) {
			alert("Failed to update profile: " + e.message);
		}
	};

	if (!formData) return <div>Loading...</div>;

	return (
		<div className="container mx-auto p-4 max-w-2xl">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				{t("profile.title")}
			</h1>
			<div className={`${ds.surface} p-8`}>
				<div className="flex items-center gap-6 mb-8 border-b pb-6 relative group">
					<div className="relative w-24 h-24 rounded-full border-4 border-gray-100 shadow-sm overflow-hidden group/img">
						<img
							src={formData.avatarUrl}
							alt="Avatar"
							className="w-full h-full object-cover"
						/>
						<div
							className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
							onClick={() => fileInputRef.current?.click()}
						>
							<PhotoIcon className="w-8 h-8 text-white" />
						</div>
					</div>
					<div>
						<h2 className="text-2xl font-bold text-gray-900">
							{user?.username}
						</h2>
						<span className="inline-block bg-primary text-white text-xs px-2 py-1 rounded-full uppercase mt-1 font-bold tracking-wide">
							{user?.role}
						</span>
						<div className="flex gap-3 mt-2">
							<p
								className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline"
								onClick={() => fileInputRef.current?.click()}
							>
								{t("profile.change_photo")}
							</p>
							<p
								className="text-xs text-red-500 font-semibold cursor-pointer hover:underline flex items-center gap-1"
								onClick={handleRemovePhoto}
							>
								<TrashIcon className="w-3 h-3" /> {t("profile.remove_photo")}
							</p>
						</div>
						<button
							onClick={() => navigate(`/user/${user?.id}`)}
							className="text-xs text-gray-500 underline mt-2 hover:text-primary transition"
						>
							View Public Profile
						</button>
					</div>
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept="image/*"
						onChange={handleImageUpload}
					/>
				</div>
				{analytics && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
						<div className="md-surface p-3">
							<p className="text-xs text-blue-600 font-bold uppercase">My Books</p>
							<p className="text-xl font-bold text-gray-800">{analytics.myBooks ?? 0}</p>
						</div>
						<div className="md-surface p-3">
							<p className="text-xs text-pink-600 font-bold uppercase">Favorites</p>
							<p className="text-xl font-bold text-gray-800">{analytics.myFavorites ?? 0}</p>
						</div>
						<div className="md-surface p-3">
							<p className="text-xs text-emerald-600 font-bold uppercase">Completed Swaps</p>
							<p className="text-xl font-bold text-gray-800">{analytics.mySwaps?.completed ?? 0}</p>
						</div>
						<div className="md-surface p-3">
							<p className="text-xs text-yellow-700 font-bold uppercase">Active Chats</p>
							<p className="text-xl font-bold text-gray-800">{analytics.myChats ?? 0}</p>
						</div>
					</div>
				)}
				<form onSubmit={handleUpdate} className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-secondary pl-3">
							{t("profile.personal_info")}
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-600 mb-1">
									{t("reg.firstName")}
								</label>
								<input
									name="firstName"
									value={formData.firstName}
									onChange={handleChange}
									className={`${ds.input} w-full p-2`}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 mb-1">
									{t("reg.lastName")}
								</label>
								<input
									name="lastName"
									value={formData.lastName}
									onChange={handleChange}
									className={`${ds.input} w-full p-2`}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 mb-1">
									{t("reg.email")}
								</label>
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									className={`${ds.input} w-full p-2`}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 mb-1">
									{t("reg.phone")}
								</label>
								<input
									type="tel"
									name="phone"
									value={formData.phone}
									onChange={handleChange}
									className={`${ds.input} w-full p-2`}
								/>
							</div>
						</div>
					</div>
					<div>
						<h3 className="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-red-400 pl-3">
							{t("profile.security")}
						</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-600 mb-1">
									{t("profile.old_pass")}
								</label>
								<input
									type="password"
									value={oldPassword}
									onChange={(e) => setOldPassword(e.target.value)}
									className="w-full p-2 border rounded focus:ring-red-400 focus:border-red-400 bg-gray-50"
									placeholder="******"
								/>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-600 mb-1">
										{t("admin.label.new_pass")}
									</label>
									<input
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="w-full p-2 border rounded focus:ring-red-400 focus:border-red-400"
										placeholder={t("profile.new_pass_placeholder")}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-600 mb-1">
										{t("profile.confirm_pass")}
									</label>
									<input
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="w-full p-2 border rounded focus:ring-red-400 focus:border-red-400"
										placeholder="******"
									/>
								</div>
							</div>
						</div>
					</div>
					<div className="pt-4 flex justify-end">
						<button
							type="submit"
							className="bg-primary text-white px-8 py-3 rounded-lg shadow font-bold hover:bg-blue-600 transition"
						>
							{t("profile.update_btn")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// ... PublicProfilePage ...
// (Kept as is)
const PublicProfilePage: React.FC<{
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

// ... BrowseBooksPage ...
const BrowseBooksPage: React.FC<{ onViewDetails: (book: Book) => void }> = ({
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

// MyBooksPage consolidated: show Listed and Owned sections
const MyBooksPage: React.FC<{
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



// ... AddEditBookForm ...
const AddEditBookForm: React.FC<{
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

const SwapsPage: React.FC<{ onViewDetails: (book: Book) => void }> = ({
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

const AboutPage: React.FC = () => {
	const { t } = useLanguage();
	return (
		<div className="container mx-auto p-4 max-w-3xl">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				{t("about.title")}
			</h1>
			<div className="md-surface p-6 space-y-6">
				<section>
					<h2 className="text-xl font-bold text-primary mb-2">
						{t("about.mission")}
					</h2>
					<p className="text-gray-700">{t("about.mission_text")}</p>
				</section>
				<section>
					<h2 className="text-xl font-bold text-primary mb-2">
						{t("about.how_it_works")}
					</h2>
					<ul className="list-disc list-inside space-y-2 text-gray-700">
						<li>{t("about.step1")}</li>
						<li>{t("about.step2")}</li>
						<li>{t("about.step3")}</li>
					</ul>
				</section>
			</div>
		</div>
	);
};

const PrivacyPage: React.FC = () => {
	const { t } = useLanguage();
	return (
		<div className="container mx-auto p-4 max-w-3xl">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				{t("privacy.title")}
			</h1>
			<div className="md-surface p-6 space-y-6">
				<p className="text-gray-700 italic">{t("privacy.intro")}</p>
				<section>
					<h2 className="text-xl font-bold text-gray-800 mb-2">
						{t("privacy.data_collection")}
					</h2>
					<p className="text-gray-700">{t("privacy.data_text")}</p>
				</section>
				<section>
					<h2 className="text-xl font-bold text-gray-800 mb-2">
						{t("privacy.security")}
					</h2>
					<p className="text-gray-700">{t("privacy.security_text")}</p>
				</section>
			</div>
		</div>
	);
};

const ContactPage: React.FC = () => {
	const { t } = useLanguage();
	const [sent, setSent] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "Suggestion",
		message: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await api.post("/contact", formData);
			setSent(true);
		} catch (e: any) {
			alert("Failed to send message: " + e.message);
		}
	};

	if (sent)
		return (
			<div className="container mx-auto p-4 max-w-lg text-center py-20">
				<div className="bg-green-100 text-green-800 p-8 rounded-lg shadow">
					<h2 className="text-2xl font-bold mb-2">Thank You!</h2>
					<p>{t("contact.success")}</p>
					<button
						onClick={() => {
							setSent(false);
							setFormData({ ...formData, message: "" });
						}}
						className="mt-4 text-sm underline"
					>
						Send another
					</button>
				</div>
			</div>
		);

	return (
		<div className="container mx-auto p-4 max-w-lg">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				{t("contact.title")}
			</h1>
			<form
				onSubmit={handleSubmit}
				className="md-surface p-6 space-y-4"
			>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						{t("contact.form_name")}
					</label>
					<input
						required
						className="w-full p-2 border rounded mt-1"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						{t("contact.form_email")}
					</label>
					<input
						required
						type="email"
						className="w-full p-2 border rounded mt-1"
						value={formData.email}
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						{t("contact.form_subject")}
					</label>
					<select
						className="w-full p-2 border rounded mt-1"
						value={formData.subject}
						onChange={(e) =>
							setFormData({ ...formData, subject: e.target.value })
						}
					>
						<option value="Suggestion">{t("contact.type_suggestion")}</option>
						<option value="Complaint">{t("contact.type_complaint")}</option>
						<option value="Feedback">{t("contact.type_feedback")}</option>
						<option value="Other">{t("contact.type_other")}</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						{t("contact.form_message")}
					</label>
					<textarea
						required
						rows={4}
						className="w-full p-2 border rounded mt-1"
						value={formData.message}
						onChange={(e) =>
							setFormData({ ...formData, message: e.target.value })
						}
					/>
				</div>
				<button
					type="submit"
					className="w-full bg-primary text-white py-2 rounded font-bold hover:bg-blue-600 transition"
				>
					{t("contact.btn_send")}
				</button>
			</form>
			<div className="mt-8 text-center text-gray-500 text-sm">
				<p>
					{t("contact.admin_email_label")}:{" "}
					<a
						href="mailto:admin@campusbookswap.com"
						className="text-primary hover:underline"
					>
						admin@campusbookswap.com
					</a>
				</p>
			</div>
		</div>
	);
};

const Footer: React.FC = () => {
	const { t } = useLanguage();
	return (
		<footer className="bg-gray-800 text-gray-300 py-8 mt-auto">
			<div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
				<div className="text-center md:text-left">
					<h3 className="text-white font-bold text-lg mb-1">
						{t("app.title")}
					</h3>
					<p className="text-sm opacity-70">{t("footer.desc")}</p>
				</div>
				<div className="flex gap-6 text-sm font-medium">
					<Link to="/about" className="hover:text-white transition-all duration-200 ease-out hover:-translate-y-0.5 inline-block">
						{t("footer.about")}
					</Link>
					<Link to="/privacy" className="hover:text-white transition-all duration-200 ease-out hover:-translate-y-0.5 inline-block">
						{t("footer.privacy")}
					</Link>
					<Link to="/contact" className="hover:text-white transition-all duration-200 ease-out hover:-translate-y-0.5 inline-block">
						{t("footer.contact")}
					</Link>
				</div>
				<div className="text-xs opacity-50">
					&copy; {new Date().getFullYear()} {t("footer.rights")}
				</div>
			</div>
		</footer>
	);
};

const LandingPage = () => {
	const { t } = useLanguage();
	return (
		<div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 bg-gradient-to-b from-blue-50/50 to-white">
			{" "}
			<div className="max-w-3xl">
				{" "}
				<h1 className="text-4xl md:text-6xl font-extrabold text-primary mb-6">
					{" "}
					{t("app.title")}{" "}
				</h1>{" "}
				<p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl px-4 inline-block">
					{" "}
					Buy, sell, and trade textbooks with students on your campus. Help the
					environment and save money every semester.{" "}
				</p>{" "}
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					{" "}
					<Link
						to="/register"
						className="bg-primary text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
					>
						{" "}
						Get Started{" "}
					</Link>{" "}
					<Link
						to="/login"
						className="bg-white text-primary border-2 border-primary px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-50 shadow hover:shadow-md transition"
					>
						{" "}
						Log In{" "}
					</Link>{" "}
				</div>{" "}
				<div className="mt-12 flex justify-center opacity-70">
					{" "}
					<img
						src="/academic-cap-illustration.svg"
						alt=""
						className="h-48"
						onError={(e) => (e.target.style.display = "none")}
					/>{" "}
				</div>{" "}
			</div>{" "}
		</div>
	);
};

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
				setUserBooks(
					allBooks.filter(
						(b) =>
							b.ownerId === user.id &&
							b.forSwap &&
							b.status === BookStatus.AVAILABLE,
					),
				);
			});
		}
	}, [user, isSwapModalOpen]);

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
		if (offerType === "swap" && !selectedOwnBook) return;
		if (offerType === "buy" && (!offeredAmount || Number(offeredAmount) <= 0)) return;
		try {
			await api.post("/swaps", {
				id: `swap_${Date.now()}`,
				offeredToId: selectedBook.ownerId,
				offeredBookIds: offerType === "swap" ? [selectedOwnBook] : [],
				requestedBookId: selectedBook.id,
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
								disabled={offerType === "swap" ? !selectedOwnBook : !offeredAmount || Number(offeredAmount) <= 0}
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
