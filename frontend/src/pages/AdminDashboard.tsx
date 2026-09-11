import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  adminApi,
  AdminItem,
  AdminStats,
  AdminUser,
  ItemCategory,
  ITEM_CATEGORIES,
  itemsApi,
  ItemStatus,
  ITEM_STATUSES,
  ItemType,
  Role,
} from "../lib/api";

type TabType = "overview" | "users" | "items";

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // --- Overview State ---
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // --- Users State ---
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState<"ALL" | Role>("ALL");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // User action modals
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminUser | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // --- Items Moderation State ---
  const [items, setItems] = useState<AdminItem[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const [itemsSearch, setItemsSearch] = useState("");
  const [itemsTypeFilter, setItemsTypeFilter] = useState<"ALL" | ItemType>("ALL");
  const [itemsStatusFilter, setItemsStatusFilter] = useState<"ALL" | ItemStatus>("ALL");
  const [itemsCategoryFilter, setItemsCategoryFilter] = useState<"ALL" | ItemCategory>("ALL");
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // Item deletion modal
  const [deleteItemTarget, setDeleteItemTarget] = useState<AdminItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Success / Alert message toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const clearFeedback = () => setFeedback(null);

  // Auto-dismiss feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // ---------------------------------------------------------------------------
  // Data Fetching: Stats
  // ---------------------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const res = await adminApi.getStats();
      setStats(res.stats);
    } catch (err: unknown) {
      setStatsError(err instanceof Error ? err.message : "Failed to load admin statistics.");
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Data Fetching: Users
  // ---------------------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const params: { page: number; limit: number; search?: string; role?: Role } = {
        page: usersPage,
        limit: 10,
      };
      if (usersSearch.trim()) params.search = usersSearch.trim();
      if (usersRoleFilter !== "ALL") params.role = usersRoleFilter;

      const res = await adminApi.getUsers(params);
      setUsers(res.users);
      setUsersTotal(res.pagination.total);
      setUsersTotalPages(res.pagination.totalPages);
    } catch (err: unknown) {
      setUsersError(err instanceof Error ? err.message : "Failed to load users list.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [usersPage, usersSearch, usersRoleFilter]);

  // ---------------------------------------------------------------------------
  // Data Fetching: Items
  // ---------------------------------------------------------------------------
  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    setItemsError(null);
    try {
      const params: {
        page: number;
        limit: number;
        search?: string;
        type?: ItemType;
        status?: ItemStatus;
        category?: ItemCategory;
      } = {
        page: itemsPage,
        limit: 10,
      };
      if (itemsSearch.trim()) params.search = itemsSearch.trim();
      if (itemsTypeFilter !== "ALL") params.type = itemsTypeFilter;
      if (itemsStatusFilter !== "ALL") params.status = itemsStatusFilter;
      if (itemsCategoryFilter !== "ALL") params.category = itemsCategoryFilter;

      const res = await adminApi.getAdminItems(params);
      setItems(res.items);
      setItemsTotal(res.pagination.total);
      setItemsTotalPages(res.pagination.totalPages);
    } catch (err: unknown) {
      setItemsError(err instanceof Error ? err.message : "Failed to load items for moderation.");
    } finally {
      setIsLoadingItems(false);
    }
  }, [itemsPage, itemsSearch, itemsTypeFilter, itemsStatusFilter, itemsCategoryFilter]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "items") {
      fetchItems();
    }
  }, [activeTab, fetchUsers, fetchItems]);

  const handleRefreshAll = () => {
    fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "items") fetchItems();
  };

  // ---------------------------------------------------------------------------
  // Handlers: Role Change
  // ---------------------------------------------------------------------------
  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    const targetId = roleChangeTarget.id;
    const newRole: Role = roleChangeTarget.role === "ADMIN" ? "USER" : "ADMIN";

    setIsUpdatingRole(true);
    try {
      await adminApi.updateUserRole(targetId, newRole);
      setFeedback({
        type: "success",
        message: `Successfully changed ${roleChangeTarget.name}'s role to ${newRole}.`,
      });
      setRoleChangeTarget(null);
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update user role.",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers: Delete User
  // ---------------------------------------------------------------------------
  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    const targetId = deleteUserTarget.id;

    setIsDeletingUser(true);
    try {
      await adminApi.deleteUser(targetId);
      setFeedback({
        type: "success",
        message: `User account "${deleteUserTarget.name}" and associated records were deleted.`,
      });
      setDeleteUserTarget(null);
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete user.",
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers: Item Moderation Status & Deletion
  // ---------------------------------------------------------------------------
  const handleItemStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    try {
      await itemsApi.updateItemStatus(itemId, newStatus);
      setFeedback({
        type: "success",
        message: `Listing status updated to ${newStatus}.`,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
      );
      fetchStats();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update item status.",
      });
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!deleteItemTarget) return;
    const targetId = deleteItemTarget.id;

    setIsDeletingItem(true);
    try {
      await itemsApi.deleteItem(targetId);
      setFeedback({
        type: "success",
        message: `Listing "${deleteItemTarget.name}" was permanently removed.`,
      });
      setDeleteItemTarget(null);
      setItems((prev) => prev.filter((i) => i.id !== targetId));
      fetchStats();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete item.",
      });
    } finally {
      setIsDeletingItem(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
              <ShieldCheck size={14} />
              Admin Portal
            </span>
            <span className="text-xs text-gray-500 font-medium">Logged in as {currentUser?.name}</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            System Dashboard & Moderation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            Monitor platform metrics, manage registered user permissions, and review reported listings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={isLoadingStats || isLoadingUsers || isLoadingItems}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={isLoadingStats || isLoadingUsers || isLoadingItems ? "animate-spin text-brand-600" : ""}
          />
          Refresh Data
        </button>
      </div>

      {/* Floating Feedback Toast */}
      {feedback && (
        <div
          className={`mt-4 flex items-center justify-between rounded-xl p-3.5 text-xs font-medium border shadow-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={clearFeedback} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
            activeTab === "overview"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <BarChart3 size={16} />
          Platform Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
            activeTab === "users"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Users size={16} />
          User Management ({stats ? stats.totalUsers : "..."})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
            activeTab === "items"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Package size={16} />
          Item Moderation ({stats ? stats.totalItems : "..."})
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: PLATFORM OVERVIEW                                              */}
      {/* ===================================================================== */}
      {activeTab === "overview" && (
        <section className="mt-6 space-y-6">
          {statsError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{statsError}</span>
            </div>
          )}

          {/* Primary Metric Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Total Users</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Users size={14} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {isLoadingStats ? "..." : stats?.totalUsers ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {stats ? `${stats.totalAdmins} with Admin access` : ""}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Total Items</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Package size={14} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {isLoadingStats ? "..." : stats?.totalItems ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {stats ? `${stats.lostItems} Lost • ${stats.foundItems} Found` : ""}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Active Listings</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <HelpCircle size={14} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {isLoadingStats ? "..." : stats?.activeItems ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">Open in community search</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Recovered Items</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <CheckCircle2 size={14} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-purple-600">
                {isLoadingStats ? "..." : stats?.recoveredItems ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">Reunited with owners</p>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-gray-500">Matched Pairs</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {isLoadingStats ? "..." : stats?.matchedItems ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">Status: MATCHED</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-gray-500">Closed Listings</p>
              <p className="mt-1 text-2xl font-bold text-gray-600">
                {isLoadingStats ? "..." : stats?.closedItems ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">Archived or expired</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-gray-500">Pending Inquiries</p>
              <p className="mt-1 text-2xl font-bold text-rose-600">
                {isLoadingStats ? "..." : stats?.pendingContactRequests ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {stats ? `Out of ${stats.totalContactRequests} total requests` : ""}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-gray-500">Smart Matches</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {isLoadingStats ? "..." : stats?.totalMatches ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">AI similarity matches</p>
            </div>
          </div>

          {/* Visual Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Breakdown: Lost vs Found */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Package size={16} className="text-brand-600" />
                Inventory Type Distribution
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Ratio of lost reports to found reports</p>

              {stats && stats.totalItems > 0 ? (
                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-rose-600 flex items-center gap-1">
                        <HelpCircle size={13} /> Lost Items
                      </span>
                      <span className="text-gray-700">
                        {stats.lostItems} ({Math.round((stats.lostItems / stats.totalItems) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${(stats.lostItems / stats.totalItems) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Found Items
                      </span>
                      <span className="text-gray-700">
                        {stats.foundItems} ({Math.round((stats.foundItems / stats.totalItems) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(stats.foundItems / stats.totalItems) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-gray-400">No items available yet for breakdown.</p>
              )}
            </div>

            {/* Breakdown: Item Statuses */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <BarChart3 size={16} className="text-brand-600" />
                Item Status Lifecycle
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Current state of reported listings</p>

              {stats && stats.totalItems > 0 ? (
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60">
                    <span className="font-semibold text-blue-700">Active Listings</span>
                    <span className="font-bold text-blue-900">{stats.activeItems}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60">
                    <span className="font-semibold text-amber-700">Matched Listings</span>
                    <span className="font-bold text-amber-900">{stats.matchedItems}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/60">
                    <span className="font-semibold text-purple-700">Recovered (Reunited)</span>
                    <span className="font-bold text-purple-900">{stats.recoveredItems}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="font-semibold text-gray-600">Closed / Expired</span>
                    <span className="font-bold text-gray-800">{stats.closedItems}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-gray-400">No data available.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: USER MANAGEMENT                                                */}
      {/* ===================================================================== */}
      {activeTab === "users" && (
        <section className="mt-6 space-y-4">
          {/* User Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUsersPage(1);
                fetchUsers();
              }}
              className="relative flex-1"
            >
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </form>

            {/* Role Filter Tabs */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 text-xs self-start sm:self-auto">
              {(["ALL", "USER", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setUsersRoleFilter(r);
                    setUsersPage(1);
                  }}
                  className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                    usersRoleFilter === r
                      ? "bg-white text-brand-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {r === "ALL" ? "All Users" : r === "ADMIN" ? "Admins Only" : "Standard Users"}
                </button>
              ))}
            </div>
          </div>

          {usersError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{usersError}</span>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Items Reported</th>
                    <th className="px-5 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <Loader2 size={24} className="animate-spin mx-auto text-brand-600" />
                        <p className="mt-2 text-xs font-medium">Loading user accounts...</p>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <Users size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-700">No users match your filters</p>
                        <p className="text-xs text-gray-400 mt-1">Try refining your search query.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isCurrent = currentUser?.id === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {u.profileImage ? (
                                <img
                                  src={u.profileImage}
                                  alt={u.name}
                                  className="h-8 w-8 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-xs">
                                  {u.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-gray-900">{u.name}</span>
                                  {isCurrent && (
                                    <span className="rounded-md bg-gray-100 px-1.5 py-0.2 text-[10px] font-bold text-gray-600">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-500">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                                u.role === "ADMIN"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                            >
                              {u.role === "ADMIN" && <Shield size={11} />}
                              {u.role}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 font-medium text-gray-700">
                            {u._count.items} {u._count.items === 1 ? "item" : "items"}
                          </td>

                          <td className="px-5 py-3.5 text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Role toggle button */}
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={() => setRoleChangeTarget(u)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title={
                                  isCurrent
                                    ? "You cannot modify your own role"
                                    : u.role === "ADMIN"
                                    ? "Demote to standard User"
                                    : "Promote to Administrator"
                                }
                              >
                                {u.role === "ADMIN" ? (
                                  <>
                                    <UserX size={12} className="text-amber-600" />
                                    <span>Demote</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={12} className="text-indigo-600" />
                                    <span>Make Admin</span>
                                  </>
                                )}
                              </button>

                              {/* Delete user button */}
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={() => setDeleteUserTarget(u)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title={isCurrent ? "You cannot delete your own account" : "Delete user"}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {usersTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-5 py-3 text-xs">
                <span className="text-gray-500">
                  Showing page <strong className="text-gray-900">{usersPage}</strong> of{" "}
                  <strong className="text-gray-900">{usersTotalPages}</strong> ({usersTotal} total users)
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={usersPage <= 1 || isLoadingUsers}
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={usersPage >= usersTotalPages || isLoadingUsers}
                    onClick={() => setUsersPage((p) => p + 1)}
                    className="rounded-lg border border-gray-200 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ITEM MODERATION                                                */}
      {/* ===================================================================== */}
      {activeTab === "items" && (
        <section className="mt-6 space-y-4">
          {/* Moderation Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setItemsPage(1);
                fetchItems();
              }}
              className="relative flex-1 min-w-[200px]"
            >
              <input
                type="text"
                value={itemsSearch}
                onChange={(e) => setItemsSearch(e.target.value)}
                placeholder="Search listing by title, city, description..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </form>

            {/* Type Filter */}
            <select
              value={itemsTypeFilter}
              onChange={(e) => {
                setItemsTypeFilter(e.target.value as "ALL" | ItemType);
                setItemsPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="LOST">Lost Reports</option>
              <option value="FOUND">Found Reports</option>
            </select>

            {/* Status Filter */}
            <select
              value={itemsStatusFilter}
              onChange={(e) => {
                setItemsStatusFilter(e.target.value as "ALL" | ItemStatus);
                setItemsPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="ALL">All Statuses (inc. CLOSED)</option>
              {ITEM_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={itemsCategoryFilter}
              onChange={(e) => {
                setItemsCategoryFilter(e.target.value as "ALL" | ItemCategory);
                setItemsPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {itemsError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{itemsError}</span>
            </div>
          )}

          {/* Items Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Listing Title</th>
                    <th className="px-5 py-3.5">Type & Category</th>
                    <th className="px-5 py-3.5">Owner / Contact</th>
                    <th className="px-5 py-3.5">Status Moderator</th>
                    <th className="px-5 py-3.5 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingItems ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <Loader2 size={24} className="animate-spin mx-auto text-brand-600" />
                        <p className="mt-2 text-xs font-medium">Loading listings for moderation...</p>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <Package size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-700">No items match your moderation filters</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting status or category.</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Title & thumbnail */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-10 w-10 rounded-lg object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400 shrink-0">
                                <Package size={18} />
                              </div>
                            )}
                            <div>
                              <Link
                                to={`/items/${item.id}`}
                                className="font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-1"
                              >
                                {item.name}
                              </Link>
                              <p className="text-gray-400 text-[11px]">
                                {item.city} • {new Date(item.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type & Category */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                item.type === "LOST"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {item.type}
                            </span>
                            <span className="text-gray-500 text-[11px] capitalize">
                              {item.category.toLowerCase()}
                            </span>
                          </div>
                        </td>

                        {/* Owner info */}
                        <td className="px-5 py-3.5">
                          {item.owner ? (
                            <div>
                              <p className="font-medium text-gray-800">{item.owner.name}</p>
                              <p className="text-gray-400 text-[11px]">{item.owner.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unknown</span>
                          )}
                        </td>

                        {/* Status Moderator Dropdown */}
                        <td className="px-5 py-3.5">
                          <select
                            value={item.status}
                            onChange={(e) => handleItemStatusChange(item.id, e.target.value as ItemStatus)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${
                              item.status === "ACTIVE"
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : item.status === "MATCHED"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : item.status === "RECOVERED"
                                ? "bg-purple-50 border-purple-200 text-purple-700"
                                : "bg-gray-100 border-gray-200 text-gray-700"
                            }`}
                          >
                            {ITEM_STATUSES.map((st) => (
                              <option key={st} value={st} className="bg-white text-gray-800">
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Remove Action */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteItemTarget(item)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                            title="Delete this listing"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {itemsTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-5 py-3 text-xs">
                <span className="text-gray-500">
                  Showing page <strong className="text-gray-900">{itemsPage}</strong> of{" "}
                  <strong className="text-gray-900">{itemsTotalPages}</strong> ({itemsTotal} total items)
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={itemsPage <= 1 || isLoadingItems}
                    onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={itemsPage >= itemsTotalPages || isLoadingItems}
                    onClick={() => setItemsPage((p) => p + 1)}
                    className="rounded-lg border border-gray-200 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* MODALS: CONFIRMATIONS                                                 */}
      {/* ===================================================================== */}

      {/* Role Change Modal */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3">
              <ShieldAlert size={22} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Confirm Role Change</h3>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Are you sure you want to change <strong>{roleChangeTarget.name}</strong>'s role from{" "}
              <strong className="uppercase">{roleChangeTarget.role}</strong> to{" "}
              <strong className="uppercase">
                {roleChangeTarget.role === "ADMIN" ? "USER" : "ADMIN"}
              </strong>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                disabled={isUpdatingRole}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={isUpdatingRole}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUpdatingRole && <Loader2 size={13} className="animate-spin" />}
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delete User Account</h3>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong>{deleteUserTarget.name}</strong> ({deleteUserTarget.email})?
              This will permanently delete their account and all their reported items and photos. This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                disabled={isDeletingUser}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingUser && <Loader2 size={13} className="animate-spin" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {deleteItemTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Remove Listing</h3>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Are you sure you want to remove <strong>"{deleteItemTarget.name}"</strong>? The listing and its attached photos will be permanently deleted from the platform.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteItemTarget(null)}
                disabled={isDeletingItem}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                disabled={isDeletingItem}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingItem && <Loader2 size={13} className="animate-spin" />}
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
