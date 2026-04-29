import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

export const AboutPage: React.FC = () => {
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
