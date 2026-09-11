import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Inbox,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi, uploadApi, UserStats } from "../lib/api";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile info state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // User activity stats
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Synchronize state when user loads or updates
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setProfileImage(user.profileImage);
    }
  }, [user]);

  // Fetch account stats
  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const { stats: fetchedStats } = await authApi.getStats();
        if (isMounted) {
          setStats(fetchedStats);
        }
      } catch (err) {
        console.warn("Could not load account stats:", err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Format initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Format joined date
  let formattedJoinedDate = "Recently";
  if (user?.createdAt) {
    try {
      const parsed = new Date(user.createdAt);
      if (!Number.isNaN(parsed.getTime())) {
        formattedJoinedDate = parsed.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch {
      // fallback
    }
  }

  // Handle Avatar file selection
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setProfileError(null);
    setProfileSuccess(null);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar image must be under 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadRes = await uploadApi.uploadImage(file);
      await updateProfile({ profileImage: uploadRes.imageUrl });
      setProfileImage(uploadRes.imageUrl);
      setProfileSuccess("Profile picture updated successfully.");
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Failed to upload avatar.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle remove Avatar
  const handleRemoveAvatar = async () => {
    if (!profileImage) return;
    setAvatarError(null);
    setProfileError(null);
    setProfileSuccess(null);
    setIsUploadingAvatar(true);

    try {
      await updateProfile({ profileImage: null });
      setProfileImage(null);
      setProfileSuccess("Profile picture removed.");
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Failed to remove avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim() || name.trim().length < 2) {
      setProfileError("Full Name must be at least 2 characters long.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
      });
      setProfileSuccess("Your profile details have been saved successfully.");
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match. Please verify.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar container */}
          <div className="relative shrink-0">
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-4 border-white/20 bg-brand-800 text-3xl font-bold shadow-inner overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user?.name || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}

              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                  <Loader2 size={24} className="animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Camera Overlay Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-600 shadow-md hover:bg-gray-100 hover:scale-105 transition-all"
              title="Upload new profile picture"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {user?.name || "User Profile"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
                <ShieldCheck size={13} />
                {user?.role || "USER"}
              </span>
            </div>

            <p className="mt-1 text-sm text-brand-100 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail size={14} className="opacity-80" />
              {user?.email}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-brand-100">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Joined {formattedJoinedDate}
              </span>
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {user.phone}
                </span>
              )}
            </div>

            {/* Quick avatar buttons */}
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-xs transition-colors"
              >
                Change Photo
              </button>
              {profileImage && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-100 px-3 py-1 text-xs font-medium backdrop-blur-xs transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative background blob */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {avatarError && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>{avatarError}</span>
        </div>
      )}

      {/* Overview Stats Cards */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Reported Items</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loadingStats ? "..." : stats?.totalItems ?? 0}
          </p>
          <Link
            to="/my-items"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
          >
            <Inbox size={12} /> View listings
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Active Listings</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {loadingStats ? "..." : stats?.activeItems ?? 0}
          </p>
          <p className="mt-2 text-[11px] text-gray-400">Currently searching</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Recovered / Matched</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {loadingStats ? "..." : stats?.recoveredItems ?? 0}
          </p>
          <p className="mt-2 text-[11px] text-gray-400">Resolved successfully</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Pending Requests</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {loadingStats ? "..." : stats?.pendingRequests ?? 0}
          </p>
          <p className="mt-2 text-[11px] text-gray-400">Awaiting your response</p>
        </div>
      </section>

      {/* Main Grid: Profile Form + Security Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Details Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
              <p className="text-xs text-gray-500">Update your public name and contact details</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="profile-name" className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="e.g. Jane Doe"
              />
            </div>

            {/* Email (Read-Only) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="profile-email" className="block text-xs font-semibold text-gray-700">
                  Email Address
                </label>
                <span className="text-[11px] text-gray-400 font-normal">Account login</span>
              </div>
              <input
                id="profile-email"
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Email cannot be changed directly to safeguard account ownership.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="profile-phone" className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="e.g. +1 (555) 123-4567"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Shared with matched finders only after you accept their contact request.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {isUpdatingProfile && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Security & Password</h2>
              <p className="text-xs text-gray-500">Ensure your account remains safe with a strong password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label htmlFor="current-password" className="block text-xs font-semibold text-gray-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                Must be at least 8 characters with a mix of letters and numbers.
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Repeat your new password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Lock size={14} />
                )}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

