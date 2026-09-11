import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  HelpCircle,
  MapPin,
  MessageSquare,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { Item, ItemStatus } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ContactReporterModal from "./ContactReporterModal";
import EditItemModal from "./EditItemModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface ItemCardProps {
  item: Item;
  onItemUpdated?: (updatedItem: Item) => void;
  onItemDeleted?: (deletedItemId: string) => void;
}

export default function ItemCard({
  item: initialItem,
  onItemUpdated,
  onItemDeleted,
}: ItemCardProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState<Item>(initialItem);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Keep internal state in sync if initialItem changes from parent
  React.useEffect(() => {
    setItem(initialItem);
  }, [initialItem]);

  const isLost = item.type === "LOST";
  const isOwner = Boolean(user && (user.id === item.userId || user.role === "ADMIN"));
  const canContact = Boolean(isAuthenticated && user && user.id !== item.userId);

  // Format date cleanly
  let formattedDate = item.date;
  try {
    const parsed = new Date(item.date);
    if (!Number.isNaN(parsed.getTime())) {
      formattedDate = parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    // Keep raw string on error
  }

  // Status badge styling
  const statusStyles: Record<ItemStatus, string> = {
    ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
    MATCHED: "bg-amber-50 text-amber-700 border-amber-200",
    RECOVERED: "bg-purple-50 text-purple-700 border-purple-200",
    CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const handleCardClick = () => {
    navigate(`/items/${item.id}`);
  };

  const handleItemUpdated = (updated: Item) => {
    setItem(updated);
    if (onItemUpdated) {
      onItemUpdated(updated);
    }
  };

  const handleItemDeleted = (deletedId: string) => {
    if (onItemDeleted) {
      onItemDeleted(deletedId);
    }
  };

  return (
    <>
      <article
        onClick={handleCardClick}
        className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-gray-300 cursor-pointer"
      >
        <div>
          {/* Optional Image */}
          {item.imageUrl && (
            <div className="mb-3.5 overflow-hidden rounded-lg bg-gray-100 aspect-video relative border border-gray-100">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                loading="lazy"
                onError={(e) => {
                  const parent = e.currentTarget.parentElement;
                  if (parent) parent.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Badges: Type & Status */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                isLost
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isLost ? (
                <>
                  <HelpCircle size={12} /> Lost
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} /> Found
                </>
              )}
            </span>

            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                statusStyles[item.status] || "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {item.status}
            </span>
          </div>

          {/* Item Title & Category */}
          <div className="mt-3">
            <h3
              className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-brand-600 transition-colors"
              title={item.name}
            >
              {item.name}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-brand-600 font-medium">
              <Tag size={12} />
              <span>{item.category.replace(/_/g, " ")}</span>
            </div>
          </div>

          {/* Description */}
          <p className="mt-2.5 text-sm text-gray-600 line-clamp-2" title={item.description}>
            {item.description}
          </p>

          {/* Identifying characteristics note if present */}
          {(item.identifyingCharacteristics || item.additionalDetails) && (
            <div className="mt-2.5 rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Details: </span>
              <span className="line-clamp-1">
                {item.identifyingCharacteristics || item.additionalDetails}
              </span>
            </div>
          )}
        </div>

        {/* Metadata footer */}
        <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500 space-y-2">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0 text-gray-400" />
            <span className="truncate" title={`${item.location}, ${item.city}`}>
              {item.location}, <strong className="font-medium text-gray-700">{item.city}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="shrink-0 text-gray-400" />
              <span>{formattedDate}</span>
            </div>

            {item.owner && (
              <div
                className="flex items-center gap-1 text-[11px] text-gray-400"
                title={`Reported by ${item.owner.name}`}
              >
                <User size={12} />
                <span className="truncate max-w-[100px]">{item.owner.name}</span>
              </div>
            )}
          </div>

          {/* Action Buttons (with stopPropagation to prevent navigating) */}
          {canContact && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsContactModalOpen(true);
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/50 py-1.5 text-xs font-semibold text-brand-700 shadow-2xs hover:bg-brand-100 hover:border-brand-300 transition-colors"
            >
              <MessageSquare size={13} />
              Contact Reporter
            </button>
          )}

          {isOwner && (
            <div className="mt-2 flex items-center gap-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(true);
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Edit3 size={12} />
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteModalOpen(true);
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50/40 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>
      </article>

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
        onItemUpdated={handleItemUpdated}
      />

      <ConfirmDeleteModal
        item={item}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onItemDeleted={handleItemDeleted}
      />
    </>
  );
}
