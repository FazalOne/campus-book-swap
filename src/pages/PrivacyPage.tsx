import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

export const PrivacyPage: React.FC = () => {
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
