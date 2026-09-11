import { Link } from "react-router-dom";
import { ArrowLeft, Home, PackageSearch, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs border border-brand-100">
          <PackageSearch size={32} />
        </div>

        {/* Status code & title */}
        <span className="mt-6 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
          404 Error
        </span>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Page Not Found
        </h1>

        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          The page you are looking for doesn&apos;t exist, has been removed, or the link may be broken. Let&apos;s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
          >
            <Home size={16} />
            <span>Return to Home</span>
          </Link>

          <Link
            to="/search"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-colors"
          >
            <Search size={16} />
            <span>Browse Items</span>
          </Link>
        </div>

        {/* Quick Help */}
        <div className="mt-10 border-t border-gray-100 pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to FindBack Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

