import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Inbox,
  Loader2,
  Trash2,
} from "lucide-react";
import { Notification, notificationsApi } from "../lib/api";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch {
      // Fail silently for background poll
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Could not load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 25000); // 25s polling
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      if (target && !target.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden flex flex-col max-h-[28rem]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/75 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoading && (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-2">
                  <Inbox size={20} />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  No notifications yet
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  You&apos;ll be notified about contact requests and match updates here.
                </p>
              </div>
            )}

            {!isLoading &&
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start justify-between gap-2.5 p-3.5 transition-colors ${
                    notif.read ? "bg-white hover:bg-gray-50" : "bg-blue-50/40 hover:bg-blue-50/60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-600 shrink-0" />
                      )}
                      <h4
                        className={`text-xs truncate ${
                          notif.read ? "font-medium text-gray-800" : "font-bold text-gray-900"
                        }`}
                      >
                        {notif.title}
                      </h4>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="mt-1 block text-[10px] text-gray-400">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                        title="Mark as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

