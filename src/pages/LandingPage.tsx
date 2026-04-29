import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

export const LandingPage = () => {
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
