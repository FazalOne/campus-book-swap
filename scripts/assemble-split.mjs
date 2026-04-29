/**
 * Assemble extracted slices into src/components and src/pages.
 * Prereq: node scripts/split-app-once.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const ex = path.join(root, "src", "_extracted");

function read(name) {
	return fs.readFileSync(path.join(ex, name), "utf8");
}
function write(rel, content) {
	const p = path.join(root, rel);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, content, "utf8");
	console.log("wrote", rel);
}

function exportNamedComponent(ts, name) {
	const re = new RegExp(`^const ${name}([:\\s])`, "m");
	if (!re.test(ts)) throw new Error(`Missing component ${name}`);
	return ts.replace(re, `export const ${name}$1`);
}

// --- icons ---
const iconsBody = read("icons.txt");
const iconsTsx =
	`import React from "react";\n\n` +
	iconsBody.replace(/^const /m, "export const ").replace(/\nconst /g, "\nexport const ");
write("src/components/icons.tsx", iconsTsx);

// --- bookLabels ---
write(
	"src/lib/bookLabels.ts",
	`export const getConditionKey = (condition: string) => \`condition.\${condition}\`;
export const getStatusKey = (status: string) => \`status.\${status}\`;
export const getDeptKey = (dept: string) => \`dept.\${dept}\`;
`,
);

// --- Modal ---
write(
	"src/components/Modal.tsx",
	`import React from "react";
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
`,
);

// --- BookCard ---
{
	const body = exportNamedComponent(read("BookCard.txt"), "BookCard");
	write(
		"src/components/BookCard.tsx",
		`import React from "react";
import { useNavigate } from "react-router-dom";
import type { Book } from "../types";
import { BookStatus } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { HeartIcon, UserCircleIcon } from "./icons";
import { getDeptKey, getStatusKey, getConditionKey } from "../lib/bookLabels";

${body}
`,
	);
}

// --- ChatPage ---
{
	const body = exportNamedComponent(read("ChatPage.txt"), "ChatPage");
	write(
		"src/pages/ChatPage.tsx",
		`import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Book, ChatMessage, ChatThread, SwapOffer } from "../types";
import { SwapStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ds } from "../designSystem";
import { Modal } from "../components/Modal";
import {
	UserCircleIcon,
	StarIcon,
	FlagIcon,
	CheckCircleIcon,
	NoSymbolIcon,
	TrashIcon,
	EnvelopeIcon,
	PhotoIcon,
	MapPinIcon,
	ChatBubbleLeftRightIcon,
} from "../components/icons";

${body}
`,
	);
}

// --- AdminPanel ---
{
	const body = exportNamedComponent(read("AdminPanel.txt"), "AdminPanel");
	write(
		"src/pages/AdminPanel.tsx",
		`import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, Report, ContactMessage, Book } from "../types";
import { UserRole, SwapStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Modal } from "../components/Modal";
import { PencilIcon, TrashIcon, ChatBubbleLeftRightIcon } from "../components/icons";

${body}
`,
	);
}

// --- ProfilePage ---
{
	const body = exportNamedComponent(read("ProfilePage.txt"), "ProfilePage");
	write(
		"src/pages/ProfilePage.tsx",
		`import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ds } from "../designSystem";
import { PhotoIcon, TrashIcon } from "../components/icons";

${body}
`,
	);
}

// --- PublicProfilePage ---
{
	const body = exportNamedComponent(read("PublicProfilePage.txt"), "PublicProfilePage");
	write(
		"src/pages/PublicProfilePage.tsx",
		`import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Book, User, Review } from "../types";
import { BookStatus, UserRole } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { BookCard } from "../components/BookCard";
import { PencilIcon, StarIcon, BookOpenIcon } from "../components/icons";

${body}
`,
	);
}

// --- BrowseBooksPage ---
{
	const body = exportNamedComponent(read("BrowseBooksPage.txt"), "BrowseBooksPage");
	write(
		"src/pages/BrowseBooksPage.tsx",
		`import React, { useState, useEffect } from "react";
import type { Book } from "../types";
import { BookCondition, BookStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { DEPARTMENTS } from "../constants";
import { ds } from "../designSystem";
import { getDeptKey, getConditionKey } from "../lib/bookLabels";
import { BookCard } from "../components/BookCard";
import {
	MagnifyingGlassIcon,
	HeartIcon,
	BookOpenIcon,
	ArrowPathRoundedSquareIcon,
} from "../components/icons";

${body}
`,
	);
}

// --- MyBooksPage ---
{
	const body = exportNamedComponent(read("MyBooksPage.txt"), "MyBooksPage");
	write(
		"src/pages/MyBooksPage.tsx",
		`import React, { useState, useEffect } from "react";
import type { Book } from "../types";
import { BookStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { BookCard } from "../components/BookCard";
import { PlusCircleIcon, BookOpenIcon, PencilIcon, TrashIcon } from "../components/icons";

${body}
`,
	);
}

// --- AddEditBookForm ---
{
	const body = exportNamedComponent(read("AddEditBookForm.txt"), "AddEditBookForm");
	write(
		"src/pages/AddEditBookForm.tsx",
		`import React, { useState, useEffect, useRef } from "react";
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

${body}
`,
	);
}

// --- SwapsPage ---
{
	const body = exportNamedComponent(read("SwapsPage.txt"), "SwapsPage");
	write(
		"src/pages/SwapsPage.tsx",
		`import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Book, SwapOffer, BookOwnershipEvent } from "../types";
import { SwapStatus } from "../types";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ds } from "../designSystem";
import {
	ArrowPathRoundedSquareIcon,
	MagnifyingGlassIcon,
	TrashIcon,
	ChatBubbleLeftRightIcon,
} from "../components/icons";

${body}
`,
	);
}

// --- Marketing / footer / landing (split combined extract) ---
const marketing = read("AboutPrivacyContactFooterLanding.txt");
const aboutEnd = marketing.indexOf("\n\nconst PrivacyPage:");
const privEnd = marketing.indexOf("\n\nconst ContactPage:");
const contactEnd = marketing.indexOf("\n\nconst Footer:");
const footerEnd = marketing.indexOf("\n\nconst LandingPage");

const aboutRaw = marketing.slice(0, aboutEnd);
const privacyRaw = marketing.slice(aboutEnd + 2, privEnd);
const contactRaw = marketing.slice(privEnd + 2, contactEnd);
const footerRaw = marketing.slice(contactEnd + 2, footerEnd);
const landingRaw = marketing.slice(footerEnd + 2);

write(
	"src/pages/AboutPage.tsx",
	`import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

${exportNamedComponent(aboutRaw, "AboutPage")}
`,
);
write(
	"src/pages/PrivacyPage.tsx",
	`import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

${exportNamedComponent(privacyRaw, "PrivacyPage")}
`,
);
write(
	"src/pages/ContactPage.tsx",
	`import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../lib/api";

${exportNamedComponent(contactRaw, "ContactPage")}
`,
);
write(
	"src/components/Footer.tsx",
	`import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

${exportNamedComponent(footerRaw, "Footer")}
`,
);
write(
	"src/pages/LandingPage.tsx",
	`import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

${landingRaw.replace(/^const LandingPage =/, "export const LandingPage =")}
`,
);

console.log("done.");
