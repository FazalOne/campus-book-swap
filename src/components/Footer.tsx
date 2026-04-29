import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

export const Footer: React.FC = () => {
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
