"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { useAppStore } from "@/stores/app-store";
import { Save, Eye, EyeOff, Camera, Trash2, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface SaveState {
  status: "idle" | "saving" | "success" | "error";
  message?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { currentUser, updateUser } = useAppStore();

  // Profile fields
  const [name, setName] = useState(currentUser.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null | undefined>(
    currentUser.avatarUrl
  );
  const [avatarDirty, setAvatarDirty] = useState(false); // has avatar changed since last save?

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // UI state
  const [profileSave, setProfileSave] = useState<SaveState>({ status: "idle" });
  const [passwordSave, setPasswordSave] = useState<SaveState>({ status: "idle" });
  const [avatarError, setAvatarError] = useState("");
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null); // null = unknown

  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    USER: "Employee",
    APPROVER: "Manager / Approver",
    INVENTORY_MGR: "Inventory Manager",
  };

  // ── On mount: fetch fresh profile from DB ──────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 503) {
        // No database — stay in mock/localStorage mode
        setDbAvailable(false);
        return;
      }
      if (!res.ok) return;
      setDbAvailable(true);
      const data = await res.json();
      // Sync local form state and Zustand store with whatever is in the DB
      setName(data.name ?? currentUser.name);
      setAvatarPreview(data.avatarUrl ?? null);
      updateUser(currentUser.id, {
        name: data.name,
        avatarUrl: data.avatarUrl ?? undefined,
      });
    } catch {
      // Network error — assume no DB, keep localStorage state
      setDbAvailable(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Avatar handling ────────────────────────────────────────────────────────
  const handleAvatarSelect = (file: File | undefined) => {
    if (!file) return;
    setAvatarError("");
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      setAvatarDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarDirty(true);
    setAvatarError("");
  };

  // ── Save profile (name + avatar) ──────────────────────────────────────────
  const handleSaveProfile = async () => {
    setProfileSave({ status: "saving" });

    // Always update Zustand immediately for instant UI feedback
    updateUser(currentUser.id, {
      name,
      avatarUrl: avatarPreview ?? undefined,
    });
    setAvatarDirty(false);

    if (!dbAvailable) {
      // Mock / no-DB mode — Zustand + localStorage is the source of truth
      setProfileSave({ status: "success", message: "Profile updated (local only — no database connected)." });
      setTimeout(() => setProfileSave({ status: "idle" }), 3000);
      return;
    }

    try {
      const payload: Record<string, unknown> = { name };
      // Only send avatarUrl if it actually changed
      if (avatarDirty) {
        payload.avatarUrl = avatarPreview ?? null; // null clears it in DB
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileSave({ status: "error", message: data.error ?? "Failed to save." });
        return;
      }

      // Re-sync from DB response (canonical source of truth)
      updateUser(currentUser.id, {
        name: data.name,
        avatarUrl: data.avatarUrl ?? undefined,
      });
      setAvatarPreview(data.avatarUrl ?? null);
      setProfileSave({ status: "success", message: "Profile saved." });
      setTimeout(() => setProfileSave({ status: "idle" }), 3000);
    } catch {
      setProfileSave({ status: "error", message: "Network error — changes saved locally only." });
      setTimeout(() => setProfileSave({ status: "idle" }), 4000);
    }
  };

  // ── Save password ─────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!newPassword || !currentPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordSave({ status: "error", message: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordSave({ status: "error", message: "New password must be at least 8 characters." });
      return;
    }

    setPasswordSave({ status: "saving" });

    if (!dbAvailable) {
      setPasswordSave({ status: "error", message: "Password changes require a connected database." });
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordSave({ status: "error", message: data.error ?? "Failed to update password." });
        return;
      }

      setPasswordSave({ status: "success", message: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSave({ status: "idle" }), 3500);
    } catch {
      setPasswordSave({ status: "error", message: "Network error. Please try again." });
      setTimeout(() => setPasswordSave({ status: "idle" }), 4000);
    }
  };

  // ── Derived booleans ───────────────────────────────────────────────────────
  const profileDirty = name !== currentUser.name || avatarDirty;
  const passwordReady =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account information and password" />

      {/* No-DB notice */}
      {dbAvailable === false && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <span>
            <strong>Running in demo mode.</strong> No database is connected, so changes are saved
            to your browser only and won&apos;t persist across devices or after clearing browser
            data. Password changes are disabled.
          </span>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* ── Profile Info ──────────────────────────────────────────────────── */}
        <div className="rounded-card border border-border bg-surface-card p-card-padding">
          <h3 className="mb-5 text-[15px] font-semibold text-text-primary">Profile Information</h3>

          {/* Avatar */}
          <div className="mb-6 flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
            />
            <div className="group relative">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={currentUser.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-primary/20"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-[22px] font-bold text-white">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
                title="Change photo"
              >
                <Camera size={18} />
              </button>
            </div>

            <div>
              <h4 className="text-[15px] font-semibold text-text-primary">{currentUser.name}</h4>
              <p className="text-[13px] text-text-secondary">
                {roleLabels[currentUser.role]} · {currentUser.departmentName}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[12px] font-medium text-brand-primary hover:underline"
                >
                  Upload photo
                </button>
                {avatarPreview && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1 text-[12px] font-medium text-red-600 hover:underline"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                )}
              </div>
              {avatarError && (
                <p className="mt-1 text-[11px] text-red-600">{avatarError}</p>
              )}
              {avatarDirty && (
                <p className="mt-1 text-[11px] text-amber-600">
                  Unsaved — click &quot;Save Changes&quot; to persist.
                </p>
              )}
            </div>
          </div>

          {/* Text fields */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Email Address
              </label>
              <input
                type="email"
                value={currentUser.email}
                readOnly
                className="w-full rounded-button border border-border bg-gray-50 px-3 py-2 text-[14px] text-text-secondary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Department
              </label>
              <input
                type="text"
                value={currentUser.departmentName}
                readOnly
                className="w-full rounded-button border border-border bg-gray-50 px-3 py-2 text-[14px] text-text-secondary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Role
              </label>
              <input
                type="text"
                value={roleLabels[currentUser.role] ?? currentUser.role}
                readOnly
                className="w-full rounded-button border border-border bg-gray-50 px-3 py-2 text-[14px] text-text-secondary"
              />
            </div>
          </div>

          {/* Profile save button */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={profileSave.status === "saving" || !profileDirty}
              className="flex items-center gap-2 rounded-button bg-brand-primary px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
            >
              {profileSave.status === "saving" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {profileSave.status === "saving" ? "Saving…" : "Save Changes"}
            </button>

            {profileSave.status === "success" && (
              <span className="flex items-center gap-1.5 text-[13px] text-green-600">
                <CheckCircle2 size={14} />
                {profileSave.message}
              </span>
            )}
            {profileSave.status === "error" && (
              <span className="flex items-center gap-1.5 text-[13px] text-red-600">
                <AlertCircle size={14} />
                {profileSave.message}
              </span>
            )}
          </div>
        </div>

        {/* ── Change Password ───────────────────────────────────────────────── */}
        <div className="rounded-card border border-border bg-surface-card p-card-padding">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={16} className="text-text-secondary" />
            <h3 className="text-[15px] font-semibold text-text-primary">Change Password</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-button border border-border px-3 py-2 pr-10 text-[14px] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="mt-1 text-[11px] text-amber-600">At least 8 characters required.</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              {!passwordsMatch && (
                <p className="mt-1 text-[12px] text-red-600">Passwords do not match.</p>
              )}
            </div>
          </div>

          {/* Password save button */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSavePassword}
              disabled={
                passwordSave.status === "saving" ||
                !passwordReady ||
                dbAvailable === false
              }
              className="flex items-center gap-2 rounded-button bg-brand-primary px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
            >
              {passwordSave.status === "saving" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <KeyRound size={16} />
              )}
              {passwordSave.status === "saving" ? "Updating…" : "Update Password"}
            </button>

            {passwordSave.status === "success" && (
              <span className="flex items-center gap-1.5 text-[13px] text-green-600">
                <CheckCircle2 size={14} />
                {passwordSave.message}
              </span>
            )}
            {passwordSave.status === "error" && (
              <span className="flex items-center gap-1.5 text-[13px] text-red-600">
                <AlertCircle size={14} />
                {passwordSave.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
