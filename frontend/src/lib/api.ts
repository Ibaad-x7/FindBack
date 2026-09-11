// Base URL for API calls. Empty string means "same origin" — during local
// dev, Vite's proxy (see vite.config.ts) forwards /api/* to the Express
// backend on port 5000, so relative paths work without CORS setup.
// FindBack - Frontend API Client
// Centralized, typed API calls connecting to the Express backend.

const API_URL = import.meta.env.VITE_API_URL || "";
export const TOKEN_STORAGE_KEY = "findback_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.error("Failed to persist token in localStorage", err);
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to remove token from localStorage", err);
  }
}

// -----------------------------------------------------------------------
// Models & Data Types
// -----------------------------------------------------------------------

export type Role = "USER" | "ADMIN";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthData {
  user: SafeUser;
  token: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  profileImage?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UserStats {
  totalItems: number;
  activeItems: number;
  recoveredItems: number;
  receivedRequests: number;
  pendingRequests: number;
  unreadNotifications: number;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalItems: number;
  lostItems: number;
  foundItems: number;
  activeItems: number;
  matchedItems: number;
  recoveredItems: number;
  closedItems: number;
  pendingContactRequests: number;
  totalContactRequests: number;
  totalMatches: number;
}

export interface AdminUser extends SafeUser {
  _count: {
    items: number;
    receivedContactRequests?: number;
    sentContactRequests?: number;
  };
}

export interface PaginatedAdminUsersResponse {
  users: AdminUser[];
  pagination: PaginationMeta;
}

export interface GetAdminUsersParams {
  search?: string;
  role?: Role;
  page?: number;
  limit?: number;
}

export interface AdminItem extends Item {
  contactRequestsCount: number;
  matchesCount: number;
}

export interface PaginatedAdminItemsResponse {
  items: AdminItem[];
  pagination: PaginationMeta;
}

export interface GetAdminItemsParams {
  search?: string;
  type?: ItemType;
  status?: ItemStatus;
  category?: ItemCategory;
  page?: number;
  limit?: number;
}

export type ItemType = "LOST" | "FOUND";

export type ItemCategory =
  | "ELECTRONICS"
  | "DOCUMENTS"
  | "WALLET"
  | "KEYS"
  | "BAGS"
  | "CLOTHING"
  | "JEWELRY"
  | "BOOKS"
  | "ACCESSORIES"
  | "OTHER";

export const ITEM_CATEGORIES: ItemCategory[] = [
  "ELECTRONICS",
  "DOCUMENTS",
  "WALLET",
  "KEYS",
  "BAGS",
  "CLOTHING",
  "JEWELRY",
  "BOOKS",
  "ACCESSORIES",
  "OTHER",
];

export type ItemStatus = "ACTIVE" | "MATCHED" | "RECOVERED" | "CLOSED";

export const ITEM_STATUSES: ItemStatus[] = [
  "ACTIVE",
  "MATCHED",
  "RECOVERED",
  "CLOSED",
];

export interface Item {
  id: string;
  userId: string;
  type: ItemType;
  name: string;
  category: ItemCategory;
  description: string;
  imageUrl: string | null;
  location: string;
  city: string;
  date: string;
  additionalDetails: string | null;
  identifyingCharacteristics: string | null;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  owner?: SafeUser;
}

export interface CreateItemInput {
  type: ItemType;
  name: string;
  category: ItemCategory;
  description: string;
  location: string;
  city: string;
  date: string;
  additionalDetails?: string | null;
  identifyingCharacteristics?: string | null;
  imageUrl?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  category?: ItemCategory;
  description?: string;
  location?: string;
  city?: string;
  date?: string;
  additionalDetails?: string | null;
  identifyingCharacteristics?: string | null;
  status?: ItemStatus;
  imageUrl?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedItemsResponse {
  items: Item[];
  pagination: PaginationMeta;
}

export interface GetItemsParams {
  type?: ItemType;
  category?: ItemCategory;
  city?: string;
  status?: ItemStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export type MatchStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface ScoreBreakdown {
  category: number;
  name: number;
  description: number;
  location: number;
  date: number;
  characteristics: number;
}

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  score: number;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  lostItem: Item;
  foundItem: Item;
}

export interface RunMatchingSummary {
  consideredPairs: number;
  created: number;
  updated: number;
  threshold: number;
}

export interface RunMatchingResponse {
  summary: RunMatchingSummary;
  matches: Match[];
}

export type ContactRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface ContactRequest {
  id: string;
  senderId: string;
  receiverId: string;
  itemId: string;
  message: string;
  status: ContactRequestStatus;
  createdAt: string;
  updatedAt: string;
  item: Item;
  sender: Partial<SafeUser>;
  receiver: Partial<SafeUser>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface HealthResponse {
  status: string;
  message: string;
  environment: string;
  databaseConfigured: boolean;
  timestamp: string;
}

// -----------------------------------------------------------------------
// Standard API Client Helper
// -----------------------------------------------------------------------

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  authToken?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const token = authToken !== undefined ? authToken : getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let json: ApiResponse<T> | null = null;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    // If response was not JSON
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && path !== "/api/auth/login") {
      removeStoredToken();
    }
    const errorMsg = json?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  if (json && json.data !== undefined) {
    return json.data;
  }

  return (json as unknown) as T;
}

// -----------------------------------------------------------------------
// API Service Methods
// -----------------------------------------------------------------------

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthData> {
    return apiFetch<AuthData>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login(email: string, password: string): Promise<AuthData> {
    return apiFetch<AuthData>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(customToken?: string): Promise<{ user: SafeUser }> {
    return apiFetch<{ user: SafeUser }>("/api/auth/me", { method: "GET" }, customToken);
  },

  async updateProfile(data: UpdateProfileInput): Promise<{ user: SafeUser }> {
    return apiFetch<{ user: SafeUser }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: ChangePasswordInput): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getStats(): Promise<{ stats: UserStats }> {
    return apiFetch<{ stats: UserStats }>("/api/auth/stats", {
      method: "GET",
    });
  },
};

export const itemsApi = {
  async getItems(params: GetItemsParams = {}): Promise<PaginatedItemsResponse> {
    const query = new URLSearchParams();
    if (params.type) query.set("type", params.type);
    if (params.category) query.set("category", params.category);
    if (params.city) query.set("city", params.city);
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());

    const qs = query.toString();
    return apiFetch<PaginatedItemsResponse>(`/api/items${qs ? `?${qs}` : ""}`);
  },

  async getItemById(id: string): Promise<{ item: Item }> {
    return apiFetch<{ item: Item }>(`/api/items/${encodeURIComponent(id)}`);
  },

  async getMyItems(params: { type?: ItemType; status?: ItemStatus } = {}): Promise<PaginatedItemsResponse> {
    const query = new URLSearchParams();
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);

    const qs = query.toString();
    return apiFetch<PaginatedItemsResponse>(`/api/items/my${qs ? `?${qs}` : ""}`);
  },

  async createItem(input: CreateItemInput): Promise<{ item: Item }> {
    return apiFetch<{ item: Item }>("/api/items", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateItem(id: string, input: UpdateItemInput): Promise<{ item: Item }> {
    return apiFetch<{ item: Item }>(`/api/items/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async updateItemStatus(id: string, status: ItemStatus): Promise<{ item: Item }> {
    return apiFetch<{ item: Item }>(`/api/items/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async deleteItem(id: string): Promise<void> {
    await apiFetch<void>(`/api/items/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

export const matchesApi = {
  async runMatching(): Promise<RunMatchingResponse> {
    return apiFetch<RunMatchingResponse>("/api/matches/run", {
      method: "POST",
    });
  },

  async getMatches(): Promise<{ matches: Match[] }> {
    return apiFetch<{ matches: Match[] }>("/api/matches");
  },

  async getMatchById(id: string): Promise<{ match: Match }> {
    return apiFetch<{ match: Match }>(`/api/matches/${encodeURIComponent(id)}`);
  },

  async updateMatchStatus(id: string, status: "ACCEPTED" | "REJECTED"): Promise<{ match: Match }> {
    return apiFetch<{ match: Match }>(`/api/matches/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

export const contactRequestsApi = {
  async create(itemId: string, message: string): Promise<{ contactRequest: ContactRequest }> {
    return apiFetch<{ contactRequest: ContactRequest }>("/api/contact-requests", {
      method: "POST",
      body: JSON.stringify({ itemId, message }),
    });
  },

  async getReceived(): Promise<{ requests: ContactRequest[] }> {
    return apiFetch<{ requests: ContactRequest[] }>("/api/contact-requests/received");
  },

  async getSent(): Promise<{ requests: ContactRequest[] }> {
    return apiFetch<{ requests: ContactRequest[] }>("/api/contact-requests/sent");
  },

  async updateStatus(
    id: string,
    status: "ACCEPTED" | "REJECTED"
  ): Promise<{ contactRequest: ContactRequest }> {
    return apiFetch<{ contactRequest: ContactRequest }>(
      `/api/contact-requests/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  },
};

export const notificationsApi = {
  async getNotifications(unreadOnly = false): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> {
    const qs = unreadOnly ? "?unreadOnly=true" : "";
    return apiFetch<{ notifications: Notification[]; unreadCount: number }>(
      `/api/notifications${qs}`
    );
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiFetch<{ unreadCount: number }>("/api/notifications/unread-count");
  },

  async markAsRead(id: string): Promise<{ notification: Notification }> {
    return apiFetch<{ notification: Notification }>(
      `/api/notifications/${encodeURIComponent(id)}/read`,
      {
        method: "PATCH",
      }
    );
  },

  async markAllAsRead(): Promise<{ markedCount: number }> {
    return apiFetch<{ markedCount: number }>("/api/notifications/read-all", {
      method: "PATCH",
    });
  },

  async deleteNotification(id: string): Promise<void> {
    await apiFetch<void>(`/api/notifications/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

export interface UploadImageResponse {
  imageUrl: string;
  filename: string;
  mimetype: string;
  size: number;
}

export const uploadApi = {
  async uploadImage(file: File): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append("image", file);

    return apiFetch<UploadImageResponse>("/api/upload/image", {
      method: "POST",
      body: formData,
    });
  },
};

export const adminApi = {
  async getStats(): Promise<{ stats: AdminStats }> {
    return apiFetch<{ stats: AdminStats }>("/api/admin/stats");
  },

  async getUsers(params: GetAdminUsersParams = {}): Promise<PaginatedAdminUsersResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.role) query.set("role", params.role);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    const qs = query.toString();
    return apiFetch<PaginatedAdminUsersResponse>(`/api/admin/users${qs ? `?${qs}` : ""}`);
  },

  async updateUserRole(id: string, role: Role): Promise<{ user: SafeUser }> {
    return apiFetch<{ user: SafeUser }>(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  async getAdminItems(params: GetAdminItemsParams = {}): Promise<PaginatedAdminItemsResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    if (params.category) query.set("category", params.category);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    const qs = query.toString();
    return apiFetch<PaginatedAdminItemsResponse>(`/api/admin/items${qs ? `?${qs}` : ""}`);
  },
};

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}
