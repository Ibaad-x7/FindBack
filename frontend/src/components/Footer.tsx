import { Link } from "react-router-dom";
import {
  FileText,
  GraduationCap,
  HeartHandshake,
  Inbox,
  Key,
  Laptop,
  Lock,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import HealthBadge from "./HealthBadge";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white text-gray-600">
      {/* Main Footer Links & Info */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-xs">
                FB
              </span>
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                FindBack
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              FindBack is a community-driven, privacy-preserving lost and found
              platform powered by an intelligent multi-attribute matching engine.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 border border-emerald-200 w-fit">
              <ShieldCheck size={14} className="shrink-0" />
              <span>Contact details protected</span>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-brand-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1.5 hover:text-brand-600 transition-colors"
                >
                  <PackageSearch size={13} className="text-gray-400" />
                  Search Database
                </Link>
              </li>
              <li>
                <Link
                  to="/search?type=LOST"
                  className="hover:text-brand-600 transition-colors"
                >
                  Browse Lost Items
                </Link>
              </li>
              <li>
                <Link
                  to="/search?type=FOUND"
                  className="hover:text-brand-600 transition-colors"
                >
                  Browse Found Items
                </Link>
              </li>
              {isAuthenticated ? (
                <li>
                  <Link
                    to="/my-items"
                    className="inline-flex items-center gap-1.5 hover:text-brand-600 transition-colors"
                  >
                    <Inbox size={13} className="text-gray-400" />
                    My Reported Items
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="hover:text-brand-600 transition-colors"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="hover:text-brand-600 transition-colors"
                    >
                      Create Free Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5">
              Popular Categories
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/search?category=ELECTRONICS"
                  className="inline-flex items-center gap-1.5 hover:text-brand-600 transition-colors"
                >
                  <Laptop size={13} className="text-gray-400" />
                  Electronics
                </Link>
              </li>
              <li>
                <Link
                  to="/search?category=WALLET"
                  className="inline-flex items-center gap-1.5 hover:text-brand-600 transition-colors"
                >
                  <Wallet size={13} className="text-gray-400" />
                  Wallets &amp; Purses
                </Link>
              </li>
              <li>
                <Link
                  to="/search?category=KEYS"
                  className="inline-flex items-center gap-1.5 hover:text-brand-600 transition-colors"
                >
                  <Key size={13} className="text-gray-400" />
                  Keys &amp; Fobs
                </Link>
              </li>
              <li>
                <Link
                  to="/search?category=BAGS"
                  className="inline-flex items-center gap-1.5 hover:text-brand-600 transition-colors"
                >
                  <ShoppingBag size={13} className="text-gray-400" />
                  Bags &amp; Backpacks
                </Link>
              </li>
              <li>
                <Link
                  to="/search?category=DOCUMENTS"
                  className="inline-flex items-center gap-1.5 hover:text-brand-600 transition-colors"
                >
                  <FileText size={13} className="text-gray-400" />
                  IDs &amp; Documents
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust & System Status */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Trust &amp; Status
            </h3>
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                <Lock size={13} className="text-brand-600" />
                <span>Zero Public Contact Dumps</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Your email and phone are strictly hidden until you accept a contact
                request from another verified user.
              </p>
            </div>

            {/* Subtle Health Badge Container */}
            <div className="pt-1">
              <span className="block text-[11px] font-semibold text-gray-500 mb-1">
                System Status:
              </span>
              <HealthBadge />
            </div>
          </div>
        </div>
      </div>

      {/* College Project Team / Developed By */}
      <div className="border-t border-gray-200 bg-gray-50/70 py-3.5 px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs sm:flex-row">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              <GraduationCap size={13} className="shrink-0" />
            </span>
            <span className="font-semibold text-gray-900">College Project Team:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center sm:text-right text-xs">
            <div className="inline-flex items-center gap-2">
              <span className="font-semibold text-gray-900">MOHAMMED IBAAD D</span>
              <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-mono font-medium text-gray-600 border border-gray-200">
                Reg: 24BCS0077
              </span>
            </div>
            <span className="hidden text-gray-300 sm:inline">•</span>
            <div className="inline-flex items-center gap-2">
              <span className="font-semibold text-gray-900">MOHAMMED HAMDAAN M</span>
              <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-mono font-medium text-gray-600 border border-gray-200">
                Reg: 24BCS0069
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-gray-50/50 py-4">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between px-4 text-xs text-gray-500 sm:px-6 gap-2 text-center sm:text-left">
          <p>© {currentYear} FindBack — Smart Lost and Found Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1 text-gray-600">
              <HeartHandshake size={13} className="text-rose-500" />
              Reuniting Belongings
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
