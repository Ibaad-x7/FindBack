import { useState } from "react";
import { AlertCircle, AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Item, itemsApi } from "../lib/api";

interface ConfirmDeleteModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onItemDeleted: (deletedItemId: string) => void;
}

export default function ConfirmDeleteModal({
  item,
  isOpen,
  onClose,
  onItemDeleted,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await itemsApi.deleteItem(item.id);
      onItemDeleted(item.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete item. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Delete Item Report</h2>
              <p className="text-xs text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 space-y-2">
          <p>
            Are you sure you want to delete <strong className="text-gray-900">&ldquo;{item.name}&rdquo;</strong>?
          </p>
          <p className="text-xs text-gray-500">
            Deleting this item will permanently remove the report, remove any uploaded photo from our servers, and cancel any pending matches or contact requests related to it.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Yes, Delete Item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

