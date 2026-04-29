import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(root, "src", "App.tsx");
const lines = fs.readFileSync(appPath, "utf8").split(/\r?\n/);
const tail = lines.slice(4816).join("\n");

const head = `import React, { useState, useEffect } from "react";
import {
	Routes,
	Route,
	Link,
	useNavigate,
	Navigate,
	useLocation,
} from "react-router-dom";
import {
	Book,
	ChatThread,
	SwapOffer,
	BookStatus,
	SwapStatus,
	BookOwnershipEvent,
} from "./types";
import { api } from "./lib/api";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";
import { LoginPage, RegisterPage } from "./AuthPages";
import { ds } from "./designSystem";
import { getConditionKey, getStatusKey } from "./lib/bookLabels";
import { Modal } from "./components/Modal";
import { Footer } from "./components/Footer";
import { AddEditBookForm } from "./pages/AddEditBookForm";
import { BrowseBooksPage } from "./pages/BrowseBooksPage";
import { ChatPage } from "./pages/ChatPage";
import { AdminPanel } from "./pages/AdminPanel";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { SwapsPage } from "./pages/SwapsPage";
import { AboutPage } from "./pages/AboutPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ContactPage } from "./pages/ContactPage";
import { LandingPage } from "./pages/LandingPage";
import {
	BookOpenIcon,
	UserCircleIcon,
	MagnifyingGlassIcon,
	ArrowPathRoundedSquareIcon,
	ChatBubbleLeftRightIcon,
	ArrowRightOnRectangleIcon,
	ArrowLeftOnRectangleIcon,
	UserPlusIcon,
	ShieldCheckIcon,
	XMarkIcon,
	Bars3Icon,
} from "./components/icons"`;

fs.writeFileSync(appPath, `${head}\n\n${tail}`);
console.log("trimmed App.tsx");
