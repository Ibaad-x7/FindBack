import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  RotateCcw,
  Search as SearchIcon,
} from "lucide-react";
import ItemCard from "../components/ItemCard";
import {
  GetItemsParams,
  Item,
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  ItemCategory,
  itemsApi,
  ItemStatus,
  ItemType,
  PaginationMeta,
} from "../lib/api";

export default function Search() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") as ItemCategory | null;
  const urlType = searchParams.get("type") as ItemType | null;

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [typeFilter, setTypeFilter] = useState<"ALL" | ItemType>(urlType || "ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | ItemCategory>(urlCategory || "ALL");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ItemStatus>("ACTIVE");
  const [page, setPage] = useState(1);

  // Sync state if URL query params change (e.g. from Hero or Footer links)
  useEffect(() => {
    const s = searchParams.get("search");
    const c = searchParams.get("category") as ItemCategory | null;
    const t = searchParams.get("type") as ItemType | null;
    if (s !== null) {
      setSearchInput(s);
      setDebouncedSearch(s);
    }
    if (c !== null) {
      setCategoryFilter(c);
    }
    if (t !== null) {
      setTypeFilter(t);
    }
    setPage(1);
  }, [searchParams]);

  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 300ms Debounce effect on search term input to prevent keystroke request spam
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: GetItemsParams = {
        page,
        limit: 12,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (typeFilter !== "ALL") params.type = typeFilter;
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (cityFilter.trim()) params.city = cityFilter.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;

      const data = await itemsApi.getItems(params);
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load items. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, typeFilter, categoryFilter, cityFilter, statusFilter, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Listen for custom itemCreated events dispatched from Navbar or modals
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Item>;
      if (custom.detail) {
        setItems((prev) => [custom.detail, ...prev]);
      } else {
        fetchItems();
      }
    };
    window.addEventListener("itemCreated", handler);
    return () => window.removeEventListener("itemCreated", handler);
  }, [fetchItems]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setCityFilter("");
    setStatusFilter("ACTIVE");
    setPage(1);
  };

  const handleItemUpdated = (updatedItem: Item) => {
    setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleItemDeleted = (deletedId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== deletedId));
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse &amp; Search Items</h1>
        <p className="mt-1 text-sm text-gray-600">
          Explore lost and found reports across the community database.
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
        <form onSubmit={handleSearchSubmit}>
          {/* Main search bar */}
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <SearchIcon size={18} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by item name, description, keywords, or location..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-24 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="absolute right-2 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filter Controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Filter size={14} />
            <span>Filters</span>
          </div>

          {/* Type Toggle Tabs */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setTypeFilter("ALL");
                setPage(1);
              }}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                typeFilter === "ALL"
                  ? "bg-white text-brand-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("LOST");
                setPage(1);
              }}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                typeFilter === "LOST"
                  ? "bg-white text-rose-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Lost
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("FOUND");
                setPage(1);
              }}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                typeFilter === "FOUND"
                  ? "bg-white text-emerald-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Found
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as "ALL" | ItemCategory);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Categories</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {/* City Filter Input */}
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by City (e.g. Chennai)"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "ALL" | ItemStatus);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Statuses</option>
            {ITEM_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Results Content Area */}
      <section className="mt-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchItems}
              className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-xl border border-gray-200 bg-white p-5"
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
                <div className="mt-6 h-4 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        )}

        {/* Loaded Items Grid */}
        {!isLoading && items.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                Found <strong className="font-semibold text-gray-900">{pagination?.total ?? items.length}</strong> items
              </span>
              {pagination && pagination.totalPages > 1 && (
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              )}
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

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="text-xs font-medium text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center px-4">
            <div className="rounded-full bg-gray-100 p-4 text-gray-400">
              <Inbox size={36} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No items found</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              We couldn&apos;t find any lost or found items matching your current filters or keywords.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
