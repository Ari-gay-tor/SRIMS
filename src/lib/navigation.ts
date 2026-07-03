import { NavSection } from "@/types";

export const navigation: NavSection[] = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
        roles: ["ADMIN", "APPROVER", "INVENTORY_MGR"],
      },
      {
        label: "Requisitions",
        href: "/requisitions",
        icon: "FileText",
        children: [
          { label: "New Requisition", href: "/requisitions/new", icon: "Plus" },
          { label: "My Requisitions", href: "/requisitions/my", icon: "FileText" },
          { label: "Drafts", href: "/requisitions/drafts", icon: "FileText" },
        ],
      },
      {
        label: "Approvals",
        href: "/approvals",
        icon: "CheckSquare",
        roles: ["ADMIN", "APPROVER"],
        children: [
          {
            label: "Pending Approvals",
            href: "/approvals/pending",
            icon: "CheckSquare",
            badge: 18, 
          },
          { label: "Approved", href: "/approvals/approved", icon: "CheckSquare" },
          { label: "Rejected", href: "/approvals/rejected", icon: "CheckSquare" },
        ],
      },
      {
        label: "Inventory",
        href: "/inventory",
        icon: "Package",
        roles: ["ADMIN", "INVENTORY_MGR"],
        children: [
          { label: "Stock Overview", href: "/inventory/overview", icon: "Package" },
          { label: "Stock Inward", href: "/inventory/inward", icon: "ArrowDownToLine" },
          { label: "Stock Outward", href: "/inventory/outward", icon: "ArrowUpFromLine" },
          { label: "Adjust Stock", href: "/inventory/adjust", icon: "Package" },
          { label: "All Transactions", href: "/inventory/transactions", icon: "History" },
          { label: "Low Stock Alerts", href: "/inventory/low-stock", icon: "AlertTriangle" },
        ],
      },
      {
        label: "Reports",
        href: "/reports",
        icon: "BarChart3",
        roles: ["ADMIN", "APPROVER", "INVENTORY_MGR"],
        children: [
          { label: "Overview", href: "/reports", icon: "BarChart3" },
          {
            label: "Requisition Analytics",
            href: "/reports/requisition-analytics",
            icon: "TrendingUp",
            roles: ["ADMIN"],
          },
        ],
      },
      {
        label: "Issue Items",
        href: "/issue/items",
        icon: "Truck",
        roles: ["ADMIN", "INVENTORY_MGR"],
      },
      {
        label: "Issue Queue",
        href: "/issue/queue",
        icon: "ListChecks",
        roles: ["ADMIN", "INVENTORY_MGR"],
      },
      {
        label: "Issued History",
        href: "/issue/history",
        icon: "History",
        roles: ["ADMIN", "INVENTORY_MGR"],
      },
    ],
  },
  {
    title: "MASTERS",
    items: [
      {
        label: "Categories",
        href: "/masters/categories",
        icon: "FolderTree",
        roles: ["ADMIN", "INVENTORY_MGR"],
      },
      {
        label: "Items",
        href: "/masters/items",
        icon: "Box",
        roles: ["ADMIN", "INVENTORY_MGR"],
      },
      {
        label: "Suppliers",
        href: "/masters/suppliers",
        icon: "Building2",
        roles: ["ADMIN", "INVENTORY_MGR"],
      },
      {
        label: "Auto-Approval Rules",
        href: "/masters/auto-approval",
        icon: "Zap",
        roles: ["ADMIN", "INVENTORY_MGR"],
      },
      {
        label: "Users",
        href: "/masters/users",
        icon: "Users",
        roles: ["ADMIN"],
      },
      {
        label: "Roles & Permissions",
        href: "/masters/roles",
        icon: "ShieldCheck",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Profile",
        href: "/system/profile",
        icon: "UserCircle",
      },
      {
        label: "Settings",
        href: "/system/settings",
        icon: "Settings",
        roles: ["ADMIN"],
      },
      {
        label: "Audit Logs",
        href: "/system/audit-logs",
        icon: "ScrollText",
        roles: ["ADMIN"],
      },
      {
        label: "Help & Support",
        href: "/system/help",
        icon: "HelpCircle",
      },
    ],
  },
];
