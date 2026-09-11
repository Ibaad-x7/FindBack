import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  HelpCircle,
  Inbox,
  Package,
  PlusCircle,
  RotateCcw,
  Sparkles,
  User,
} from "lucide-react";
import ItemCard from "../components/ItemCard";
import ReportItemModal from "../components/ReportItemModal";
import {
  authApi,
  Item,
  ITEM_STATUSES,
  itemsApi,
  ItemStatus,
  ItemType,
  UserStats,
} from "../lib/api";

export default function MyItems() {
  const [typeFilter, setTypeFilter] = useState<"ALL" | ItemType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ItemStatus>("ALL");
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { stats: fetchedStats } = await authApi.getStats();
      setStats(fetchedStats);
    } catch {
      // ignore silently if stats fail
    }
  }, []);

  const fetchMyItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { type?: ItemType; status?: ItemStatus } = {};
      if (typeFilter !== "ALL") params.type = typeFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const data = await itemsApi.getMyItems(params);
      setItems(data.items);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load your reported items.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchMyItems();
    fetchStats();
  }, [fetchMyItems, fetchStats]);

  const handleItemCreated = (newItem: Item) => {
    setIsReportModalOpen(false);
    // Add to items list if matches filter
    setItems((prev) => [newItem, ...prev]);
    fetchStats();
  };

  const handleItemUpdated = (updatedItem: Item) => {
    setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    fetchStats();
  };

  const handleItemDeleted = (deletedId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== deletedId));
    fetchStats();
  };

  const handleResetFilters = () => {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Dashboard & Listings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your lost and found items, review status changes, and manage your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-colors shrink-0"
          >
            <User size={15} />
            Profile & Settings
          </Link>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors shrink-0"
          >
            <PlusCircle size={15} />
            Report Item
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Reported</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
              <Package size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stats ? stats.totalItems : items.length}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">All submissions</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Active Listings</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <HelpCircle size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {stats ? stats.activeItems : "..."}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Under active search</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Resolved / Recovered</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {stats ? stats.recoveredItems : "..."}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Successfully completed</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Pending Inquiries</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Sparkles size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {stats ? stats.pendingRequests : "..."}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Awaiting your response</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Filter size={14} />
          <span>Filter By:</span>
        </div>

        {/* Type Toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTypeFilter("ALL")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              typeFilter === "ALL"
                ? "bg-white text-brand-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("LOST")}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1 font-medium transition-colors ${
              typeFilter === "LOST"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <HelpCircle size={12} /> Lost
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("FOUND")}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1 font-medium transition-colors ${
              typeFilter === "FOUND"
                ? "bg-white text-emerald-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CheckCircle2 size={12} /> Found
          </button>
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "ALL" | ItemStatus)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="ALL">All Statuses</option>
          {ITEM_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {(typeFilter !== "ALL" || statusFilter !== "ALL") && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Content Section */}
      <section className="mt-8">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchMyItems}
              className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex justify-between">
                  <div className="h-5 w-16 rounded bg-gray-200" />
                  <div className="h-5 w-16 rounded bg-gray-200" />
                </div>
                <div className="mt-4 h-5 w-3/4 rounded bg-gray-200" />
                <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-gray-100" />
                  <div className="h-3 w-4/5 rounded bg-gray-100" />
                </div>
                <div className="mt-6 h-8 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        )}

        {/* Items Grid */}
        {!isLoading && items.length > 0 && (
          <>
            <div className="mb-4 text-xs text-gray-500">
              Showing <strong className="font-semibold text-gray-900">{items.length}</strong> {items.length === 1 ? "item" : "items"}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onItemUpdated={handleItemUpdated}
                  onItemDeleted={handleItemDeleted}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center px-4">
            <div className="rounded-full bg-gray-100 p-4 text-gray-400 mb-3">
              <Inbox size={36} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No items found</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {typeFilter !== "ALL" || statusFilter !== "ALL"
                ? "You don't have any reported items matching the selected filters."
                : "You haven't reported any lost or found items yet."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {typeFilter !== "ALL" || statusFilter !== "ALL" ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  <RotateCcw size={14} /> Reset Filters
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
              >
                <PlusCircle size={14} /> Report an Item
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Report Modal */}
      <ReportItemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onItemCreated={handleItemCreated}
      />
    </main>
  );
}
