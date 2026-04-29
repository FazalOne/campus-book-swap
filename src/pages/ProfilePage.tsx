import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ds } from "../designSystem";
import { PhotoIcon, TrashIcon } from "../components/icons";

export const ProfilePage: React.FC = () => {
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

