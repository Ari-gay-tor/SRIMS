"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { useAppStore } from "@/stores/app-store";
import {
  Bell,
  Menu,
  Calendar,
  ChevronDown,
  Check,
  UserCircle,
  LogOut,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}
function formatDisplay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toInputValue(from), to: toInputValue(to) };
}

interface TopbarProps {
  user: User;
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  notificationCount?: number;
  onSignOut?: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Topbar({
  user,
  sidebarCollapsed,
  onMenuClick,
  onSignOut,
}: TopbarProps) {
  const { notifications, markNotificationRead } = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState(defaultRange);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    USER: "Employee",
    APPROVER: "Manager",
    INVENTORY_MGR: "Inventory Manager",
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-30 flex h-topbar items-center justify-between border-b border-border bg-white px-6 transition-all duration-300",
        sidebarCollapsed ? "lg:left-[64px]" : "lg:left-[240px]"
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-text-secondary hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">

        {/* Date Range Filter */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[13px] text-text-secondary hover:bg-gray-50"
          >
            <Calendar size={14} />
            <span>{formatDisplay(dateRange.from)} – {formatDisplay(dateRange.to)}</span>
            <ChevronDown size={14} />
          </button>

          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-card border border-border bg-surface-card p-4 shadow-lg">
                <p className="mb-3 text-[12px] font-semibold text-text-primary">Select Date Range</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-text-secondary">From</label>
                    <input
                      type="date"
                      value={dateRange.from}
                      max={dateRange.to}
                      onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
                      className="w-full rounded-md border border-border px-3 py-1.5 text-[13px] text-text-primary focus:border-brand-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-text-secondary">To</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      min={dateRange.from}
                      onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
                      className="w-full rounded-md border border-border px-3 py-1.5 text-[13px] text-text-primary focus:border-brand-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setDateRange(defaultRange()); }}
                    className="text-[12px] text-text-muted hover:text-text-primary"
                  >
                    Reset to current month
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="rounded-md bg-brand-primary px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-md p-2 text-text-secondary hover:bg-gray-100"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-card border border-border bg-surface-card shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-[13px] font-semibold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] text-text-muted">{unreadCount} unread</span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[13px] text-text-muted">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setShowNotifs(false);
                        }}
                        className={cn(
                          "flex items-start gap-2 border-b border-border px-4 py-3 last:border-0 hover:bg-gray-50",
                          !n.isRead && "bg-blue-50/50"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full",
                            n.isRead ? "bg-transparent" : "bg-brand-primary"
                          )}
                        />
                        <div className="flex-1">
                          <p className="text-[13px] text-text-primary leading-snug">{n.message}</p>
                          <p className="mt-0.5 text-[11px] text-text-muted">{timeAgo(n.createdAt)}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      notifications.forEach((n) => !n.isRead && markNotificationRead(n.id));
                    }}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-[12px] font-medium text-brand-primary hover:bg-gray-50"
                  >
                    <Check size={12} />
                    Mark all as read
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Separator */}
        <div className="hidden h-8 w-px bg-border md:block" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-gray-50"
          >
            {/* Avatar */}
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-[13px] font-semibold text-white">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="hidden text-left md:block">
              <div className="text-[14px] font-semibold text-text-primary">
                {user.name}
              </div>
              <div className="text-[12px] font-medium text-text-secondary">
                {roleLabels[user.role] || user.role}
                {user.departmentName && ` - ${user.departmentName}`}
              </div>
            </div>
            <ChevronDown size={14} className="hidden text-text-muted md:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-card border border-border bg-surface-card py-1 shadow-lg">
                <Link
                  href="/system/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-text-primary hover:bg-gray-50"
                >
                  <UserCircle size={16} className="text-text-secondary" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSignOut?.();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
