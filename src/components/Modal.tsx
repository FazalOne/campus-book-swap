import React from "react";
import { XMarkIcon } from "./icons";

export const Modal: React.FC<{
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
