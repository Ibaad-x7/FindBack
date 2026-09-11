import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit3,
  HelpCircle,
  ImageIcon,
  MapPin,
  MessageSquare,
  Sparkles,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { Item, ItemStatus, itemsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ContactReporterModal from "../components/ContactReporterModal";
import EditItemModal from "../components/EditItemModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchItem = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await itemsApi.getItemById(id);
      setItem(data.item);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Item not found or could not be loaded.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const isOwner = Boolean(user && item && (user.id === item.userId || user.role === "ADMIN"));
  const canContact = Boolean(isAuthenticated && user && item && user.id !== item.userId);
  const isLost = item?.type === "LOST";

  // Status badge styling
  const statusStyles: Record<ItemStatus, string> = {
    ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
    MATCHED: "bg-amber-50 text-amber-700 border-amber-200",
    RECOVERED: "bg-purple-50 text-purple-700 border-purple-200",
    CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  };

  let formattedDate = item?.date || "";
  if (item?.date) {
    try {
      const parsed = new Date(item.date);
      if (!Number.isNaN(parsed.getTime())) {
        formattedDate = parsed.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch {
      // ignore
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-24 animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Item Not Found</h1>
        <p className="mt-2 text-sm text-gray-600">
          {error || "The lost or found report you requested does not exist or has been removed."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
          <Link
            to="/search"
            className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
          >
            Browse All Items
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to previous page
        </button>

        {isOwner && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
            You reported this item
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Image Display */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
          {item.imageUrl ? (
            <div className="relative aspect-4/3 w-full bg-black/5 flex items-center justify-center overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-3">
                <ImageIcon size={32} />
              </div>
              <p className="text-sm font-semibold text-gray-700">No Photo Uploaded</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                The reporter did not attach a photograph for this item.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="flex flex-col">
          {/* Type & Status Badges */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                isLost
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isLost ? (
                <>
                  <HelpCircle size={13} /> Lost Item
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} /> Found Item
                </>
              )}
            </span>

            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${
                statusStyles[item.status] || "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {item.status}
            </span>
          </div>

          {/* Title & Category */}
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {item.name}
          </h1>

          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-600">
            <Tag size={13} />
            <span>Category: {item.category.replace(/_/g, " ")}</span>
          </div>

          {/* Description */}
          <div className="mt-5 rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Description
            </h3>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Identifying Characteristics */}
          {(item.identifyingCharacteristics || item.additionalDetails) && (
            <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <Sparkles size={14} />
                <span>Identifying Details &amp; Characteristics</span>
              </div>
              <p className="mt-1.5 text-xs text-gray-700 leading-normal">
                {item.identifyingCharacteristics || item.additionalDetails}
              </p>
            </div>
          )}

          {/* Location & Date Details */}
          <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-4 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="shrink-0 text-gray-400 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-800">Location: </span>
                <span>{item.location}, </span>
                <strong className="text-gray-900">{item.city}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={15} className="shrink-0 text-gray-400" />
              <div>
                <span className="font-semibold text-gray-800">Date Reported: </span>
                <span>{formattedDate}</span>
              </div>
            </div>

            {item.owner && (
              <div className="flex items-center gap-2">
                <User size={15} className="shrink-0 text-gray-400" />
                <div>
                  <span className="font-semibold text-gray-800">Reported By: </span>
                  <span>{item.owner.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Triggers */}
          <div className="mt-8 border-t border-gray-100 pt-5">
            {canContact && (
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
              >
                <MessageSquare size={16} />
                Contact Reporter
              </button>
            )}

            {!isAuthenticated && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-xs text-gray-600">
                  Have information regarding this item or think it is yours?
                </p>
                <Link
                  to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
                >
                  Sign in to Contact Reporter
                </Link>
              </div>
            )}

            {isOwner && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Edit3 size={14} />
                    Edit Item &amp; Status
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 py-2.5 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-100 hover:border-rose-300 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContactReporterModal
        item={item}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      <EditItemModal
        item={item}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onItemUpdated={(updated) => setItem(updated)}
      />

      <ConfirmDeleteModal
        item={item}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onItemDeleted={() => {
          navigate("/my-items");
        }}
      />
    </main>
  );
}

