
export enum BookCondition {
    NEW = "New",
    LIKE_NEW = "Like New",
    VERY_GOOD = "Very Good",
    GOOD = "Good",
    ACCEPTABLE = "Acceptable",
}

export enum BookStatus {
    AVAILABLE = "Available",
    REQUESTED = "Requested",
    RESERVED = "Reserved",
    SWAPPED = "Swapped",
    SOLD = "Sold",
    ARCHIVED = "Archived"
}

export interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    edition?: string;
    course?: string;
    department?: string;
    condition: BookCondition;
    description: string;
    imageUrl: string;
    ownerId: string;
    ownerUsername?: string;
    price?: number;
    forSwap: boolean;
    forSale: boolean;
    listedDate: string;
    status: BookStatus;
    favoriteCount?: number; // Added
    isFavorited?: boolean;  // Added
}

export enum UserRole {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    MODERATOR = "moderator",
    USER = "user"
}

export interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
    avatarUrl?: string;
    token?: string; // JWT Token
    averageRating?: number; // Added for profile
}

export interface Review {
    id: number;
    reviewerId: string;
    reviewerUsername: string;
    reviewerAvatarUrl: string;
    targetUserId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    chatThreadId: string;
    senderId: string;
    text: string;
    timestamp: string;
    isRead?: boolean;
}

export interface ChatThread {
    id: string;
    participantIds: string[];
    participantUsernames: { [key: string]: string };
    bookId?: string;
    lastMessageText?: string;
    lastMessageTimestamp: string;
    unreadMessages: number;
    lastSenderId?: string;
    status: 'pending' | 'accepted'; // Added
}

export enum SwapStatus {
    PENDING = "Pending",
    ACCEPTED = "Accepted",
    REJECTED = "Rejected",
    COMPLETED = "Completed",
    CANCELLED = "Cancelled",
}

export interface SwapOffer {
    id: string;
    offeredById: string;
    offeredByUsername?: string; // Added
    offeredToId: string;
    offeredToUsername?: string; // Added
    offeredBookIds: string[];
    requestedBookId: string;
    status: SwapStatus;
    message?: string;
    creationDate: string;
    lastUpdateDate: string;
}

export interface OptionType {
    value: string;
    label: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface Report {
    id: number;
    reporterId: string;
    reporterUsername: string;
    reportedUserId: string;
    reportedUsername: string;
    reason: string;
    chatId?: string;
    createdAt: string;
}

export interface ContactMessage {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
}
