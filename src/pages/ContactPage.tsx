import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../lib/api";

export const ContactPage: React.FC = () => {
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
