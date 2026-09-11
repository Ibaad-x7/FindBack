import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Inbox,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  PackageSearch,
  PlusCircle,
  Shield,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ReportItemModal from "./ReportItemModal";
import NotificationBell from "./NotificationBell";
import ContactRequestsModal from "./ContactRequestsModal";
import { Item } from "../lib/api";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-brand-600 font-semibold" : "text-gray-600 hover:text-brand-600"
  }`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const handleItemCreated = (item: Item) => {
    setIsReportModalOpen(false);
    // Dispatch custom event so active pages (Search, MyItems, Home) can update reactively without reloading
    window.dispatchEvent(new CustomEvent("itemCreated", { detail: item }));
    navigate("/my-items");
  };

  // Extract initials from user's name
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-xs">
              FB
            </span>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              FindBack
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <PackageSearch size={16} />
                Search
              </span>
            </NavLink>

            {isAuthenticated && (
              <NavLink to="/my-items" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <Inbox size={16} />
                  My Items
                </span>
              </NavLink>
            )}

            {isAuthenticated && user?.role === "ADMIN" && (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                  <Shield size={16} />
                  Admin
                </span>
              </NavLink>
            )}
          </nav>

          {/* Desktop Actions & User Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                {/* Report Item */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-700"
                >
                  <PlusCircle size={15} />
                  <span>Report Item</span>
                </button>

                {/* Messages / Requests button */}
                <button
                  type="button"
                  onClick={() => setIsRequestsModalOpen(true)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition-colors"
                  title="Contact Requests & Messages"
                >
                  <MessageSquare size={14} />
                  <span>Requests</span>
                </button>

                {/* Notification Bell */}
                <NotificationBell />

                {/* User avatar & name - links to /profile */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-1 group hover:opacity-85 transition-opacity"
                  title="View Profile & Settings"
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 group-hover:bg-brand-200 transition-colors">
                      {initials}
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800 leading-tight max-w-[120px] truncate group-hover:text-brand-600 transition-colors">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-gray-500 capitalize">
                      {user.role.toLowerCase()}
                    </span>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 hover:text-red-600 ml-1"
                  title="Log out"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink to="/login" className={navLinkClass}>
                  <span className="flex items-center gap-1.5">
                    <LogIn size={16} />
                    Login
                  </span>
                </NavLink>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-700"
                >
                  <UserPlus size={15} />
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Bell (if authenticated) + Hamburger Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationBell />}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden shadow-lg space-y-3">
            <div className="flex flex-col space-y-2">
              <NavLink
                to="/"
                end
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-brand-50 text-brand-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/search"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-brand-50 text-brand-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                <PackageSearch size={16} />
                Search
              </NavLink>

              {isAuthenticated && (
                <NavLink
                  to="/my-items"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-brand-50 text-brand-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  <Inbox size={16} />
                  My Reported Items
                </NavLink>
              )}

              {isAuthenticated && user?.role === "ADMIN" && (
                <NavLink
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-indigo-600 hover:bg-indigo-50"
                    }`
                  }
                >
                  <Shield size={16} />
                  Admin Dashboard
                </NavLink>
              )}
            </div>

            {isAuthenticated && user ? (
              <div className="border-t border-gray-100 pt-3 space-y-2">
                {/* User info - links to /profile */}
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 shrink-0">
                      {initials}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-600 shrink-0">
                    Profile →
                  </span>
                </Link>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsReportModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
                  >
                    <PlusCircle size={14} />
                    Report Item
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsRequestsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <MessageSquare size={14} />
                    Requests
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                <NavLink
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <LogIn size={15} />
                  Login
                </NavLink>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
                >
                  <UserPlus size={15} />
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modals */}
      <ReportItemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onItemCreated={handleItemCreated}
      />

      <ContactRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
      />
    </>
  );
}
