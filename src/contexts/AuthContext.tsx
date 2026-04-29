import React, { createContext, useState, useContext, useEffect } from "react";
import { User } from "../types";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

interface AuthContextType {
	user: User | null;
	login: (userData: User, token: string) => void;
	logout: () => void;
	updateUser: (userData: User) => void;
	loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	// Safe storage helper: removes large avatar data before saving to localStorage
	const saveToStorage = (userData: User) => {
		const userToSave = { ...userData };
		// If avatarUrl is a large base64 string (>1000 chars), don't save it to local storage to avoid quota errors.
		if (userToSave.avatarUrl && userToSave.avatarUrl.length > 1000) {
			delete userToSave.avatarUrl;
		}
		localStorage.setItem("user", JSON.stringify(userToSave));
	};

	useEffect(() => {
		const storedUserStr = localStorage.getItem("user");
		if (storedUserStr) {
			const storedUser = JSON.parse(storedUserStr);
			// Set initial state from storage (might be missing avatar)
			setUser(storedUser);

			// Fetch full profile (including avatar) from API if token exists
			if (storedUser.token) {
				api
					.get<User>("/auth/me")
					.then((fullUser) => {
						// Update state with full user data, ensuring we keep the token
						setUser((prev) => ({ ...fullUser, token: storedUser.token }));
					})
					.catch((err) => {
						console.error("Failed to refresh user session", err);
						// If fetching fails (e.g. invalid token), user stays logged in with stored data or we could logout.
						// keeping silent for now.
					});
			}
		}
		setLoading(false);
	}, []);

	const login = (userData: User, token: string) => {
		const userWithToken = { ...userData, token };
		setUser(userWithToken);
		saveToStorage(userWithToken);
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem("user");
		navigate("/");
	};

	const updateUser = (userData: User) => {
		if (!user) return;
		// Keep the token, update other fields
		const updatedUser = { ...user, ...userData };
		setUser(updatedUser);
		saveToStorage(updatedUser);
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
