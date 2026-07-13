"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/navigation";
import { UserRole, NavItem, NavSection } from "@/types";
import { useAppStore } from "@/stores/app-store";
import {
  ShoppingCart,
  LayoutDashboard,
  FileText,
  CheckSquare,
  Package,
  BarChart3,
  Truck,
  ListChecks,
  History,
  FolderTree,
  Box,
  Building2,
  Users,
  ShieldCheck,
  UserCircle,
  Settings,
  ScrollText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Package,
  BarChart3,
  Truck,
  ListChecks,
  History,
  FolderTree,
  Box,
  Building2,
  Users,
  ShieldCheck,
  UserCircle,
  Settings,
  ScrollText,
  HelpCircle,
  Plus,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  TrendingUp,
};

interface SidebarProps {
  userRole: UserRole;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ userRole, collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Requisitions: true,
    Approvals: true,
    Inventory: true,
  });

  // Live pending approvals count — shown as badge only for roles that can act on them
  const pendingCount = useAppStore((s) =>
    (userRole === "ADMIN" || userRole === "APPROVER")
      ? s.requisitions.filter((r) => r.status === "PENDING").length
      : 0
  );

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isItemVisible = (item: NavItem): boolean => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  const isActive = (href: string): boolean => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderIcon = (iconName: string, size = 18) => {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (!isItemVisible(item)) return null;

    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.label];

    // Filter visible children
    const visibleChildren = item.children?.filter(isItemVisible) || [];
    if (hasChildren && visibleChildren.length === 0) return null;

    return (
      <div key={item.href}>
        {hasChildren ? (
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-4 py-3 text-sidebar-item transition-colors",
              "text-sidebar-text hover:bg-white/[0.04]",
              active && "bg-sidebar-active text-sidebar-text-hi",
              isChild && "pl-9"
            )}
          >
            <span className="flex-shrink-0">{renderIcon(item.icon, 18)}</span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {isExpanded ? (
                  <ChevronDown size={14} className="opacity-60" />
                ) : (
                  <ChevronRight size={14} className="opacity-60" />
                )}
              </>
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={() => onMobileClose?.()}
            className={cn(
              "flex items-center gap-3 rounded-md px-4 py-3 text-sidebar-item transition-colors",
              "text-sidebar-text hover:bg-white/[0.04]",
              active && "bg-sidebar-active text-sidebar-text-hi border-l-[3px] border-white",
              isChild && "pl-9"
            )}
          >
            <span className="flex-shrink-0">{renderIcon(item.icon, 18)}</span>
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {/* Dynamic badge: live pending count only on Pending Approvals */}
                {item.href === "/approvals/pending" && pendingCount > 0 ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {pendingCount}
                  </span>
                ) : item.badge !== undefined && item.badge > 0 ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </>
            )}
          </Link>
        )}

        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-0.5 space-y-0.5">
            {visibleChildren.map((child) => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section: NavSection) => {
    const visibleItems = section.items.filter(isItemVisible);
    if (visibleItems.length === 0) return null;

    return (
      <div key={section.title} className="pt-4">
        {!collapsed && (
          <div className="px-4 pb-2 text-sidebar-section uppercase tracking-sidebar-section text-sidebar-section">
            {section.title}
          </div>
        )}
        <div className="space-y-0.5">{visibleItems.map((item) => renderNavItem(item))}</div>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar-bg transition-all duration-300",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Brand Block */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-active">
          <ShoppingCart size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[16px] font-bold text-white">SRIMS</div>
            <div className="text-[10px] leading-tight text-slate-300">
              Stationery Requisition &<br />
              Inventory Management System
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {navigation.map(renderSection)}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center border-t border-sidebar-border py-3 text-sidebar-text hover:text-white transition-colors"
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3 text-center">
        {!collapsed ? (
          <>
            <div className="text-[12px] text-slate-400">© 2025 SRIMS</div>
            <div className="text-[11px] text-slate-500">Version 1.0.0</div>
          </>
        ) : (
          <div className="text-[10px] text-slate-500">v1.0</div>
        )}
      </div>
    </aside>
  );
}
