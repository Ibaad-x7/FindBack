import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, Send, X } from "lucide-react";
import { Item, contactRequestsApi } from "../lib/api";

interface ContactReporterModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ContactReporterModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: ContactReporterModalProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please write a message before sending.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Message cannot exceed 1000 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await contactRequestsApi.create(item.id, trimmed);
      setIsSent(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send contact request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage("");
    setError(null);
    setIsSent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Mail size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Contact Reporter
              </h2>
              <p className="text-xs text-gray-500">
                Send a secure message regarding &ldquo;{item.name}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {isSent ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Contact Request Sent!
            </h3>
            <p className="mt-1.5 text-xs text-gray-600 max-w-sm mx-auto">
              The reporter has been notified. When they accept your request, you
              will receive an in-app notification and contact information will be
              exchanged.
            </p>
            <button
              onClick={handleClose}
              className="mt-5 rounded-lg bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Item summary pill */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600 flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-800">{item.name}</span>
                <span className="text-gray-400 mx-1.5">•</span>
                <span>{item.city}</span>
              </div>
              <span className="font-medium text-brand-600">
                {item.type === "LOST" ? "Lost Item" : "Found Item"}
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Your Message *
                </label>
                <span className="text-[11px] text-gray-400">
                  {message.length} / 1000
                </span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain why you are contacting the reporter (e.g., provide matching characteristics, ask clarifying questions)..."
                className="w-full rounded-lg border border-gray-300 p-3 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Your email and phone are kept private until the reporter accepts
                your request.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

