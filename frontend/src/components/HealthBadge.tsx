import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { checkHealth, HealthResponse } from "../lib/api";

type Status = "checking" | "online" | "offline";

export default function HealthBadge() {
  const [status, setStatus] = useState<Status>("checking");
  const [details, setDetails] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    checkHealth()
      .then((data) => {
        if (cancelled) return;
        setDetails(data);
        setStatus("online");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("offline");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const icon =
    status === "online" ? (
      <CheckCircle2 size={18} className="text-green-500" />
    ) : status === "offline" ? (
      <XCircle size={18} className="text-red-500" />
    ) : (
      <Loader2 size={18} className="animate-spin text-gray-400" />
    );

  const label =
    status === "online"
      ? "Backend connected"
      : status === "offline"
      ? "Backend unreachable"
      : "Checking backend...";

  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      {details && (
        <div className="text-xs text-gray-400">
          {details.databaseConfigured
            ? "DATABASE_URL is configured"
            : "DATABASE_URL not set yet"}
        </div>
      )}
      {status === "offline" && (
        <p className="max-w-xs text-center text-xs text-gray-400">
          Make sure the backend is running on port 5000 (npm run dev in
          /backend).
        </p>
      )}
    </div>
  );
}
