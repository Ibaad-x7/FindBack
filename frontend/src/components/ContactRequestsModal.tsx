import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Mail,
  Phone,
  User,
  X,
  XCircle,
} from "lucide-react";
import { ContactRequest, contactRequestsApi } from "../lib/api";

interface ContactRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactRequestsModal({
  isOpen,
  onClose,
}: ContactRequestsModalProps) {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [receivedData, sentData] = await Promise.all([
        contactRequestsApi.getReceived(),
        contactRequestsApi.getSent(),
      ]);
      setReceivedRequests(receivedData.requests);
      setSentRequests(sentData.requests);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load contact requests.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, loadRequests]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (
    id: string,
    status: "ACCEPTED" | "REJECTED"
  ) => {
    setActionInProgressId(id);
    setError(null);
    try {
      const { contactRequest } = await contactRequestsApi.updateStatus(id, status);
      setReceivedRequests((prev) =>
        prev.map((r) => (r.id === id ? contactRequest : r))
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update contact request.");
      }
    } finally {
      setActionInProgressId(null);
    }
  };

  const requestsToDisplay = activeTab === "received" ? receivedRequests : sentRequests;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Contact Requests &amp; Messages
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Coordinate reunions and securely exchange contact details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="mt-4 flex gap-2 border-b border-gray-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "received"
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "sent"
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* List Content */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3.5 pr-1">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}

          {!isLoading && requestsToDisplay.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-2">
                <Inbox size={24} />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                No {activeTab} contact requests
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {activeTab === "received"
                  ? "When other users reach out regarding your reported items, their requests will appear here."
                  : "When you reach out to other users from an item card, you can track their responses here."}
              </p>
            </div>
          )}

          {!isLoading &&
            requestsToDisplay.map((req) => {
              const otherUser = activeTab === "received" ? req.sender : req.receiver;
              const isPending = req.status === "PENDING";
              const isAccepted = req.status === "ACCEPTED";
              const isRejected = req.status === "REJECTED";

              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                          <User size={14} />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                            {otherUser.name || "User"}
                          </h4>
                          <span className="text-[11px] text-gray-400">
                            Regarding: <strong className="text-gray-700">{req.item.name}</strong> ({req.item.city})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 border border-green-200">
                          <CheckCircle2 size={11} /> Accepted
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                          <XCircle size={11} /> Declined
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                    <p className="italic">&ldquo;{req.message}&rdquo;</p>
                  </div>

                  {/* Revealed Contact Information when ACCEPTED */}
                  {isAccepted && (otherUser.email || otherUser.phone) && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50/70 p-3 text-xs">
                      <span className="font-bold text-green-900 block mb-1">
                        Contact Details Exchanged:
                      </span>
                      <div className="space-y-1 text-green-800">
                        {otherUser.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} className="shrink-0 text-green-600" />
                            <a href={`mailto:${otherUser.email}`} className="underline hover:text-green-900">
                              {otherUser.email}
                            </a>
                          </div>
                        )}
                        {otherUser.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} className="shrink-0 text-green-600" />
                            <a href={`tel:${otherUser.phone}`} className="hover:text-green-900">
                              {otherUser.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons for received PENDING requests */}
                  {activeTab === "received" && isPending && (
                    <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={actionInProgressId === req.id}
                        onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <X size={13} />
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={actionInProgressId === req.id}
                        onClick={() => handleUpdateStatus(req.id, "ACCEPTED")}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-50"
                      >
                        {actionInProgressId === req.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Accept &amp; Share Contact
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

