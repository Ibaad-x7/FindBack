import React, { useEffect, useState } from "react";
import { AlertCircle, Edit3, Loader2, X } from "lucide-react";
import ImageUpload from "./ImageUpload";
import {
  Item,
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  ItemCategory,
  itemsApi,
  ItemStatus,
  UpdateItemInput,
} from "../lib/api";

interface EditItemModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: (updatedItem: Item) => void;
}

export default function EditItemModal({
  item,
  isOpen,
  onClose,
  onItemUpdated,
}: EditItemModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("ELECTRONICS");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [identifyingCharacteristics, setIdentifyingCharacteristics] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [status, setStatus] = useState<ItemStatus>("ACTIVE");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setCategory(item.category || "ELECTRONICS");
      setDescription(item.description || "");
      setLocation(item.location || "");
      setCity(item.city || "");
      try {
        const d = new Date(item.date);
        setDate(!Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "");
      } catch {
        setDate("");
      }
      setIdentifyingCharacteristics(item.identifyingCharacteristics || "");
      setAdditionalDetails(item.additionalDetails || "");
      setStatus(item.status || "ACTIVE");
      setImageUrl(item.imageUrl || null);
      setError(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }
    if (!city.trim()) {
      setError("City is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const input: UpdateItemInput = {
        name: name.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        city: city.trim(),
        date: new Date(date).toISOString(),
        identifyingCharacteristics: identifyingCharacteristics.trim() || null,
        additionalDetails: additionalDetails.trim() || null,
        status,
        imageUrl: imageUrl || null,
      };

      const result = await itemsApi.updateItem(item.id, input);
      onItemUpdated(result.item);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update item report. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Edit3 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Edit {item.type === "LOST" ? "Lost" : "Found"} Item
              </h2>
              <p className="text-xs text-gray-500">
                Update details, status, or photos for this item report.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 mt-4 space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Selection */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Report Status
            </label>
            <p className="text-[11px] text-gray-500 mb-2">
              Mark as recovered once an item has been reunited with its owner.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ITEM_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`rounded-lg py-1.5 px-2 text-xs font-semibold border transition-all text-center ${
                    status === st
                      ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Component */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Item Photo
            </label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* City & Specific Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Specific Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Identifying Characteristics */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Identifying Characteristics (Optional)
            </label>
            <input
              type="text"
              value={identifyingCharacteristics}
              onChange={(e) => setIdentifyingCharacteristics(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Additional Details (Optional)
            </label>
            <input
              type="text"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

