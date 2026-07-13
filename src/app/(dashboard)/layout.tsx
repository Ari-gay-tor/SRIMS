"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAppStore } from "@/stores/app-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { currentUser, setCurrentUser, allUsers, addAuditLog } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadCount = useAppStore((s) =>
    s.notifications.filter((n) => !n.isRead).length
  );

  // Sync the Zustand "currentUser" to whoever authenticated via NextAuth,
  // and write a LOGIN audit entry the first time each session is established.
  useEffect(() => {
    if (session?.user?.email) {
      const matched = allUsers.find(
        (u) => u.email.toLowerCase() === session.user.email!.toLowerCase()
      );
      if (matched && matched.id !== currentUser.id) {
        setCurrentUser(matched.id);
        addAuditLog("LOGIN", "User", matched.id, `User ${matched.name} logged in (${matched.role})`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-app">
        <div className="text-[13px] text-text-secondary">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-app">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar
        userRole={currentUser.role}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Topbar
        user={currentUser}
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        notificationCount={unreadCount}
        onSignOut={() => {
          addAuditLog("LOGOUT", "User", currentUser.id, `User ${currentUser.name} logged out`);
          signOut({ callbackUrl: "/login" });
        }}
      />
      <main
        className={cn(
          "pt-topbar transition-all duration-300",
          sidebarCollapsed ? "lg:ml-[64px]" : "lg:ml-[240px]"
        )}
      >
        <div className="p-page-padding">{children}</div>
      </main>
    </div>
  );
}
