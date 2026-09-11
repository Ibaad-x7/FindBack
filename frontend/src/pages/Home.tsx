import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Cpu,
  FileText,
  HeartHandshake,
  Inbox,
  Key,
  Laptop,
  Lock,
  PackageSearch,
  PlusCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UploadCloud,
  Wallet,
  Watch,
} from "lucide-react";
import ItemCard from "../components/ItemCard";
import ReportItemModal from "../components/ReportItemModal";
import { Item, ItemCategory, itemsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Search input in Hero
  const [heroSearch, setHeroSearch] = useState("");

  // Report item modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Recent items state
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [activeItemCount, setActiveItemCount] = useState<number | null>(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  const fetchRecentData = useCallback(async () => {
    setIsLoadingRecent(true);
    setRecentError(null);
    try {
      const data = await itemsApi.getItems({ limit: 6, status: "ACTIVE" });
      setRecentItems(data.items);
      setActiveItemCount(data.pagination.total);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRecentError(err.message);
      } else {
        setRecentError("Could not load recent items.");
      }
    } finally {
      setIsLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentData();
  }, [fetchRecentData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearch.trim();
    if (query) {
      navigate(`/search?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/search");
    }
  };

  const handleCategoryClick = (category: ItemCategory) => {
    navigate(`/search?category=${encodeURIComponent(category)}`);
  };

  const handleItemCreated = (item: Item) => {
    setIsReportModalOpen(false);
    setRecentItems((prev) => [item, ...prev.slice(0, 5)]);
    setActiveItemCount((prev) => (prev !== null ? prev + 1 : 1));
    navigate("/my-items");
  };

  // Popular category pills
  const categoryPills: { label: string; category: ItemCategory; icon: React.ReactNode }[] = [
    { label: "Electronics", category: "ELECTRONICS", icon: <Laptop size={14} /> },
    { label: "Wallets", category: "WALLET", icon: <Wallet size={14} /> },
    { label: "Keys", category: "KEYS", icon: <Key size={14} /> },
    { label: "Bags", category: "BAGS", icon: <ShoppingBag size={14} /> },
    { label: "Documents", category: "DOCUMENTS", icon: <FileText size={14} /> },
    { label: "Accessories", category: "ACCESSORIES", icon: <Watch size={14} /> },
    { label: "Jewelry", category: "JEWELRY", icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-brand-50/50 via-white to-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 shadow-xs mb-6">
            <Sparkles size={14} className="text-brand-600 animate-pulse" />
            <span>Smart Lost &amp; Found Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl sm:leading-tight">
            Lost something important?{" "}
            <span className="text-brand-600 block sm:inline">
              FindBack reunites people with what matters.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-600 sm:text-lg sm:leading-relaxed">
            Report lost or found belongings, search the community database, and let our
            intelligent matching engine help reconnect owners and finders safely and privately.
          </p>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="relative flex items-center shadow-md rounded-2xl border border-gray-300 bg-white p-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
              <label htmlFor="hero-search" className="sr-only">
                Search lost and found items
              </label>
              <div className="pointer-events-none pl-3 text-gray-400">
                <Search size={20} />
              </div>
              <input
                id="hero-search"
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search by keyword, item name, location (e.g. Sony Headphones, Chennai)..."
                className="w-full border-0 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors shrink-0"
              >
                <span>Search</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Primary Action Buttons (Auth-Aware) */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  setIsReportModalOpen(true);
                } else {
                  navigate("/login?redirect=/search");
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              <PlusCircle size={17} />
              <span>Report an Item</span>
            </button>

            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <PackageSearch size={17} className="text-gray-500" />
              <span>Browse Database</span>
            </Link>

            {isAuthenticated ? (
              <Link
                to="/my-items"
                className="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
              >
                <Inbox size={16} />
                <span>My Reported Items ({user?.name})</span>
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
              >
                <span>Create Free Account</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* ----------------------------------------------------------- */}
          {/* 2. CATEGORY QUICK-LINKS PILLS                               */}
          {/* ----------------------------------------------------------- */}
          <div className="mt-10 border-t border-gray-100 pt-6">
            <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Explore Popular Categories
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categoryPills.map((pill) => (
                <button
                  key={pill.category}
                  type="button"
                  onClick={() => handleCategoryClick(pill.category)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition-all"
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. PLATFORM METRICS & STATS SECTION                           */}
      {/* ------------------------------------------------------------- */}
      <section className="border-b border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold text-brand-600">
                {activeItemCount !== null ? activeItemCount : "—"}
              </span>
              <span className="mt-1 block text-xs font-medium text-gray-600">
                Active Community Listings
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-600">
                100%
              </span>
              <span className="mt-1 block text-xs font-medium text-gray-600">
                Privacy-Preserving Contact
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold text-brand-700">
                6-Signal
              </span>
              <span className="mt-1 block text-xs font-medium text-gray-600">
                Smart Matching Algorithm
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold text-purple-600">
                5MB
              </span>
              <span className="mt-1 block text-xs font-medium text-gray-600">
                High-Res Photo Verification
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. "HOW FINDBACK WORKS" SECTION                               */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gray-50/50 py-16 sm:py-20 border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Simple 3-Step Process
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              How FindBack Works
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              A transparent, safe, and automated platform connecting community members.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Report with Details &amp; Photo
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Submit a LOST or FOUND report in seconds. Specify the category, city,
                date, exact location, and attach a photo with distinguishing characteristics.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Smart Matching Algorithm
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                The smart matching engine compares reports across category, keywords,
                descriptions, locations, and dates to compute confidence scores between reports.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Reconnect Privately
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Reach out securely through in-app contact requests. Contact info
                (email and phone) is strictly shielded until the report owner reviews and accepts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. PLATFORM FEATURES & TECHNOLOGY SECTION                     */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white py-16 sm:py-20 border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Built for Reliability &amp; Safety
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              Core Platform Capabilities
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Every feature in FindBack is engineered to maximize reunions while safeguarding personal privacy.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-3">
                <Cpu size={20} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Smart Matching Engine</h4>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                Multi-signal matching analyzing name Jaccard similarity, category exact matches,
                city proximity, and day intervals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3">
                <UploadCloud size={20} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Secure Image Uploads</h4>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                Drag-and-drop photo attachment supporting JPEG, PNG, and WebP formats up to
                5MB with cryptographic filename hashing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
                <Lock size={20} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Privacy-First Architecture</h4>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                Personal phone numbers and email addresses are never exposed in search results,
                item cards, or unaccepted requests.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3">
                <HeartHandshake size={20} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Contact Requests</h4>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                Send structured messages to reporters with duplicate prevention, anti-spam
                checks, and one-click accept/decline workflows.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-3">
                <Bell size={20} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Notification Center</h4>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                In-app notification bell with live unread badge, popover dropdown, mark-read,
                and instant status alert tracking.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-3">
                <PackageSearch size={20} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Community Search</h4>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                Debounced keyword search with category filtering, city filtering, report type
                toggles, and item status selectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. RECENT ITEMS SHOWCASE                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gray-50/50 py-16 sm:py-20 border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Community Activity
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">
                Recent Lost &amp; Found Reports
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Latest items reported by community members across cities.
              </p>
            </div>

            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors shrink-0"
            >
              <span>View All Reports</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Error Banner */}
          {recentError && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{recentError}</span>
              </div>
              <button
                type="button"
                onClick={fetchRecentData}
                className="rounded bg-red-100 px-2.5 py-1 font-semibold text-red-800 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoadingRecent && (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Items Grid */}
          {!isLoadingRecent && recentItems.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingRecent && recentItems.length === 0 && !recentError && (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center px-4">
              <div className="rounded-full bg-gray-100 p-4 text-gray-400 mb-3">
                <Inbox size={32} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No active reports yet</h3>
              <p className="mt-1 text-xs text-gray-500 max-w-sm">
                Be the first to post a lost or found report in your area.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) {
                    setIsReportModalOpen(true);
                  } else {
                    navigate("/login?redirect=/search");
                  }
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
              >
                <PlusCircle size={14} /> Report an Item
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. TRUST & SAFETY SECTION                                     */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white py-16 sm:py-20 border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50/70 via-white to-brand-50/40 p-8 sm:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-brand-700 font-semibold text-xs uppercase tracking-wider mb-2">
                  <ShieldCheck size={16} />
                  <span>Privacy &amp; Safety Guaranteed</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Your Personal Contact Info is Always Protected
                </h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  Unlike traditional bulletin boards or social media groups, FindBack never
                  publishes your email address or phone number. When someone reaches out about
                  your item, you review their message first. Contact details are only exchanged
                  after you explicitly click <strong>Accept</strong>.
                </p>

                <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Zero public phone dumps</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Anti-spam request limits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Full owner edit/delete control</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs shrink-0 w-full md:w-80 space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Lock size={16} className="text-brand-600" />
                  <span className="text-xs font-bold text-gray-900">Protected Contact Workflow</span>
                </div>
                <div className="space-y-2 text-[11px] text-gray-600">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <span>Public Item Card</span>
                    <span className="font-semibold text-rose-600">Phone Hidden</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <span>Pending Contact Request</span>
                    <span className="font-semibold text-amber-600">Email Hidden</span>
                  </div>
                  <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <span>Accepted Request</span>
                    <span className="font-semibold text-emerald-700">Contact Exchanged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. BOTTOM CALL-TO-ACTION (CTA) SECTION                        */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-brand-600 text-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to reunite lost belongings?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-brand-100 leading-relaxed">
            Join the FindBack community today. It only takes a minute to file a report
            and bring an item back to its rightful owner.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  setIsReportModalOpen(true);
                } else {
                  navigate("/login?redirect=/search");
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-600 shadow-md hover:bg-brand-50 transition-colors"
            >
              <PlusCircle size={16} />
              <span>Report an Item Now</span>
            </button>

            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-400 bg-brand-700/50 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              <PackageSearch size={16} />
              <span>Search Database</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Report Modal */}
      <ReportItemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onItemCreated={handleItemCreated}
      />
    </div>
  );
}
