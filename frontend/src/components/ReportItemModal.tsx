import React, { useState } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, Loader2, X } from "lucide-react";
import ImageUpload from "./ImageUpload";
import { CreateItemInput, Item, ITEM_CATEGORIES, ItemCategory, itemsApi, ItemType } from "../lib/api";

interface ReportItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: (item: Item) => void;
}

export default function ReportItemModal({
  isOpen,
  onClose,
  onItemCreated,
}: ReportItemModalProps) {
  const [type, setType] = useState<ItemType>("LOST");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("ELECTRONICS");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [identifyingCharacteristics, setIdentifyingCharacteristics] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      const input: CreateItemInput = {
        type,
        name: name.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        city: city.trim(),
        date: new Date(date).toISOString(),
        identifyingCharacteristics: identifyingCharacteristics.trim() || null,
        imageUrl: imageUrl || null,
      };

      const result = await itemsApi.createItem(input);
      onItemCreated(result.item);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create report. Please try again.");
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
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Report a {type === "LOST" ? "Lost" : "Found"} Item
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Provide details and upload a photo to help identify this item.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 mt-4 space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("LOST")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-semibold transition-all ${
                  type === "LOST"
                    ? "border-rose-500 bg-rose-50 text-rose-700 shadow-xs"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <HelpCircle size={16} /> I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setType("FOUND")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-semibold transition-all ${
                  type === "FOUND"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CheckCircle2 size={16} /> I Found Something
              </button>
            </div>
          </div>

          {/* Image Upload Component */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Item Photo (Optional)
            </label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sony Wireless Headphones, Black Leather Wallet"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Category *
              </label>
              <div className="relative mt-1">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Date *
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Location & City */}
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
                placeholder="e.g. Chennai"
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
                placeholder="e.g. Central Library, 2nd Floor"
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
              placeholder="Provide general details about the item..."
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
              placeholder="e.g. Scratch on back, sticker on bottom, red keychain"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Actions */}
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
                  Submitting Report...
                </>
              ) : (
                "Publish Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
