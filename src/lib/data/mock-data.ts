// ─── Mock Data Store ───
// Complete seed data matching the SRIMS master prompt.
// Replace with Prisma queries when MySQL is connected.

export interface MockUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // plaintext in mock, bcrypt in production
  role: "ADMIN" | "USER" | "APPROVER" | "INVENTORY_MGR";
  departmentId: string;
  departmentName: string;
  approverId: string | null;
  isActive: boolean;
  avatarUrl?: string;
}

export interface MockDepartment {
  id: string;
  name: string;
}

export interface MockCategory {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
  color: string;
  bgColor: string;
}

export interface MockItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
  minStockLevel: number;
  isActive: boolean;
  iconKey: string;
}

export interface MockRequisitionItem {
  id: string;
  requisitionId: string;
  itemId: string;
  itemName: string;
  categoryName: string;
  unit: string;
  requestedQty: number;
  approvedQty: number;
  issuedQty: number;
  unitPrice: number;
}

export interface MockRequisition {
  id: string;
  userId: string;
  userName: string;
  departmentId: string;
  departmentName: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ISSUED" | "PARTIAL";
  purpose: string;
  remarks: string;
  requiredDate: string;
  priority: "LOW" | "NORMAL" | "URGENT";
  totalAmount: number;
  createdAt: string;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  items: MockRequisitionItem[];
}

export interface MockStockTransaction {
  id: string;
  type: "INWARD" | "OUTWARD" | "ADJUSTMENT";
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  referenceNo: string;
  date: string;
  userId: string;
  /** Set automatically for outward movements created via Issue Items;
   *  settable manually (optional) for ad-hoc outward entries recorded
   *  directly on the Stock Outward page. */
  linkedRequisitionId?: string;
}

// ─── Departments ───
export const departments: MockDepartment[] = [
  { id: "dept-1", name: "Marketing" },
  { id: "dept-2", name: "Finance" },
  { id: "dept-3", name: "HR" },
  { id: "dept-4", name: "Operations" },
  { id: "dept-5", name: "IT" },
];

// ─── Users (4 roles) ───
export const users: MockUser[] = [
  {
    id: "user-1",
    name: "Rahul Sharma",
    email: "rahul@srims.com",
    passwordHash: "Admin@123",
    role: "ADMIN",
    departmentId: "dept-1",
    departmentName: "Marketing",
    approverId: null,
    isActive: true,
  },
  {
    id: "user-2",
    name: "Priya Singh",
    email: "priya@srims.com",
    passwordHash: "User@123",
    role: "USER",
    departmentId: "dept-1",
    departmentName: "Marketing",
    approverId: "user-3",
    isActive: true,
  },
  {
    id: "user-3",
    name: "Amit Verma",
    email: "amit@srims.com",
    passwordHash: "Approver@123",
    role: "APPROVER",
    departmentId: "dept-1",
    departmentName: "Marketing",
    approverId: null,
    isActive: true,
  },
  {
    id: "user-4",
    name: "Sandeep Kumar",
    email: "sandeep@srims.com",
    passwordHash: "Inventory@123",
    role: "INVENTORY_MGR",
    departmentId: "dept-4",
    departmentName: "Operations",
    approverId: null,
    isActive: true,
  },
  // Extra users for realistic data
  {
    id: "user-5",
    name: "Neha Gupta",
    email: "neha@srims.com",
    passwordHash: "User@123",
    role: "USER",
    departmentId: "dept-2",
    departmentName: "Finance",
    approverId: "user-3",
    isActive: true,
  },
  {
    id: "user-6",
    name: "Rohit Kumar",
    email: "rohit@srims.com",
    passwordHash: "User@123",
    role: "USER",
    departmentId: "dept-3",
    departmentName: "HR",
    approverId: "user-3",
    isActive: true,
  },
  {
    id: "user-7",
    name: "Sneha Iyer",
    email: "sneha@srims.com",
    passwordHash: "User@123",
    role: "USER",
    departmentId: "dept-5",
    departmentName: "IT",
    approverId: "user-3",
    isActive: true,
  },
];

// ─── Categories ───
export const categories: MockCategory[] = [
  { id: "cat-1", name: "Writing Instruments", parentId: null, icon: "PenTool", color: "#2563EB", bgColor: "#DBEAFE" },
  { id: "cat-2", name: "Paper Products", parentId: null, icon: "FileText", color: "#D97706", bgColor: "#FEF3C7" },
  { id: "cat-3", name: "Desk Accessories", parentId: null, icon: "Briefcase", color: "#059669", bgColor: "#D1FAE5" },
  { id: "cat-4", name: "Files & Folders", parentId: null, icon: "Folder", color: "#CA8A04", bgColor: "#FEF9C3" },
  { id: "cat-5", name: "Office Electronics", parentId: null, icon: "Calculator", color: "#475569", bgColor: "#F1F5F9" },
  { id: "cat-6", name: "Others", parentId: null, icon: "MoreHorizontal", color: "#6B7280", bgColor: "#F3F4F6" },
];

// ─── Items (25 items) ───
export const items: MockItem[] = [
  { id: "ITM-0001", name: "Ball Pen (Blue)", categoryId: "cat-1", categoryName: "Writing Instruments", unit: "Piece", unitPrice: 5.0, currentStock: 15, minStockLevel: 50, isActive: true, iconKey: "pen-blue" },
  { id: "ITM-0002", name: "Ball Pen (Red)", categoryId: "cat-1", categoryName: "Writing Instruments", unit: "Piece", unitPrice: 5.0, currentStock: 120, minStockLevel: 50, isActive: true, iconKey: "pen-red" },
  { id: "ITM-0003", name: "Marker (Black)", categoryId: "cat-1", categoryName: "Writing Instruments", unit: "Piece", unitPrice: 18.0, currentStock: 5, minStockLevel: 30, isActive: true, iconKey: "marker" },
  { id: "ITM-0004", name: "Pencil (HB)", categoryId: "cat-1", categoryName: "Writing Instruments", unit: "Piece", unitPrice: 4.0, currentStock: 200, minStockLevel: 100, isActive: true, iconKey: "pencil" },
  { id: "ITM-0005", name: "Highlighter (Yellow)", categoryId: "cat-1", categoryName: "Writing Instruments", unit: "Piece", unitPrice: 15.0, currentStock: 2, minStockLevel: 25, isActive: true, iconKey: "highlighter" },
  { id: "ITM-0006", name: "Stapler Pins (10 No.)", categoryId: "cat-3", categoryName: "Desk Accessories", unit: "Box", unitPrice: 20.0, currentStock: 85, minStockLevel: 30, isActive: true, iconKey: "stapler-pins" },
  { id: "ITM-0007", name: "A4 Copier Paper (70 GSM)", categoryId: "cat-2", categoryName: "Paper Products", unit: "Ream", unitPrice: 210.0, currentStock: 8, minStockLevel: 20, isActive: true, iconKey: "paper-a4" },
  { id: "ITM-0008", name: "Spiral Notebook (A5)", categoryId: "cat-2", categoryName: "Paper Products", unit: "Piece", unitPrice: 45.0, currentStock: 65, minStockLevel: 30, isActive: true, iconKey: "notebook" },
  { id: "ITM-0009", name: "File Folder", categoryId: "cat-4", categoryName: "Files & Folders", unit: "Piece", unitPrice: 25.0, currentStock: 45, minStockLevel: 20, isActive: true, iconKey: "folder" },
  { id: "ITM-0010", name: "Eraser", categoryId: "cat-3", categoryName: "Desk Accessories", unit: "Piece", unitPrice: 5.0, currentStock: 150, minStockLevel: 50, isActive: true, iconKey: "eraser" },
  { id: "ITM-0011", name: "Gel Pen (Black)", categoryId: "cat-1", categoryName: "Writing Instruments", unit: "Piece", unitPrice: 12.0, currentStock: 90, minStockLevel: 40, isActive: true, iconKey: "pen-black" },
  { id: "ITM-0012", name: "Whiteboard Marker", categoryId: "cat-1", categoryName: "Writing Instruments", unit: "Piece", unitPrice: 25.0, currentStock: 7, minStockLevel: 20, isActive: true, iconKey: "marker-wb" },
  { id: "ITM-0013", name: "Sticky Notes (3x3)", categoryId: "cat-2", categoryName: "Paper Products", unit: "Pack", unitPrice: 35.0, currentStock: 40, minStockLevel: 15, isActive: true, iconKey: "sticky-notes" },
  { id: "ITM-0014", name: "Paper Clips", categoryId: "cat-3", categoryName: "Desk Accessories", unit: "Box", unitPrice: 10.0, currentStock: 100, minStockLevel: 25, isActive: true, iconKey: "clips" },
  { id: "ITM-0015", name: "Stapler", categoryId: "cat-3", categoryName: "Desk Accessories", unit: "Piece", unitPrice: 120.0, currentStock: 12, minStockLevel: 5, isActive: true, iconKey: "stapler" },
  { id: "ITM-0016", name: "Scissors", categoryId: "cat-3", categoryName: "Desk Accessories", unit: "Piece", unitPrice: 45.0, currentStock: 18, minStockLevel: 8, isActive: true, iconKey: "scissors" },
  { id: "ITM-0017", name: "Tape (Transparent)", categoryId: "cat-3", categoryName: "Desk Accessories", unit: "Roll", unitPrice: 15.0, currentStock: 4, minStockLevel: 15, isActive: true, iconKey: "tape" },
  { id: "ITM-0018", name: "Envelope (A4)", categoryId: "cat-2", categoryName: "Paper Products", unit: "Pack", unitPrice: 30.0, currentStock: 55, minStockLevel: 20, isActive: true, iconKey: "envelope" },
  { id: "ITM-0019", name: "Correction Pen", categoryId: "cat-1", categoryName: "Writing Instruments", unit: "Piece", unitPrice: 20.0, currentStock: 35, minStockLevel: 15, isActive: true, iconKey: "correction" },
  { id: "ITM-0020", name: "Calculator (Basic)", categoryId: "cat-5", categoryName: "Office Electronics", unit: "Piece", unitPrice: 250.0, currentStock: 0, minStockLevel: 5, isActive: true, iconKey: "calculator" },
  { id: "ITM-0021", name: "Rubber Bands", categoryId: "cat-6", categoryName: "Others", unit: "Pack", unitPrice: 8.0, currentStock: 75, minStockLevel: 20, isActive: true, iconKey: "rubber-bands" },
  { id: "ITM-0022", name: "Glue Stick", categoryId: "cat-6", categoryName: "Others", unit: "Piece", unitPrice: 15.0, currentStock: 3, minStockLevel: 10, isActive: true, iconKey: "glue" },
  { id: "ITM-0023", name: "Lever Arch File", categoryId: "cat-4", categoryName: "Files & Folders", unit: "Piece", unitPrice: 85.0, currentStock: 6, minStockLevel: 10, isActive: true, iconKey: "arch-file" },
  { id: "ITM-0024", name: "Desk Organizer", categoryId: "cat-3", categoryName: "Desk Accessories", unit: "Piece", unitPrice: 180.0, currentStock: 0, minStockLevel: 3, isActive: true, iconKey: "organizer" },
  { id: "ITM-0025", name: "USB Flash Drive (32GB)", categoryId: "cat-5", categoryName: "Office Electronics", unit: "Piece", unitPrice: 350.0, currentStock: 0, minStockLevel: 5, isActive: true, iconKey: "usb" },
];

// ─── Suppliers ───
export const suppliers = [
  { id: "sup-1", name: "ABC Stationery Suppliers", contact: "+91 98765 43210", address: "12, MG Road, Kolkata 700001" },
  { id: "sup-2", name: "Delhi Office Supplies Pvt. Ltd.", contact: "+91 98765 43211", address: "45, Connaught Place, New Delhi 110001" },
  { id: "sup-3", name: "Sharma Trading Co.", contact: "+91 98765 43212", address: "78, Park Street, Kolkata 700016" },
];

// ─── Requisitions (18 across statuses) ───
export const requisitions: MockRequisition[] = [
  {
    id: "REQ-2025-00128", userId: "user-2", userName: "Priya Singh", departmentId: "dept-1", departmentName: "Marketing",
    status: "PENDING", purpose: "Marketing Campaign", remarks: "Urgent requirement for upcoming event", requiredDate: "2025-06-05",
    priority: "URGENT", totalAmount: 1250.0, createdAt: "2025-05-31T10:30:00", approvedById: null, approvedByName: null, approvedAt: null, rejectedReason: null,
    items: [
      { id: "ri-1", requisitionId: "REQ-2025-00128", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 50, approvedQty: 0, issuedQty: 0, unitPrice: 5.0 },
      { id: "ri-2", requisitionId: "REQ-2025-00128", itemId: "ITM-0007", itemName: "A4 Copier Paper (70 GSM)", categoryName: "Paper Products", unit: "Ream", requestedQty: 5, approvedQty: 0, issuedQty: 0, unitPrice: 210.0 },
    ],
  },
  {
    id: "REQ-2025-00127", userId: "user-3", userName: "Amit Verma", departmentId: "dept-1", departmentName: "Marketing",
    status: "APPROVED", purpose: "Monthly office supplies", remarks: "", requiredDate: "2025-06-03",
    priority: "NORMAL", totalAmount: 630.0, createdAt: "2025-05-30T14:20:00",
    approvedById: "user-1", approvedByName: "Rahul Sharma", approvedAt: "2025-05-30T16:00:00", rejectedReason: null,
    items: [
      { id: "ri-3", requisitionId: "REQ-2025-00127", itemId: "ITM-0008", itemName: "Spiral Notebook (A5)", categoryName: "Paper Products", unit: "Piece", requestedQty: 10, approvedQty: 10, issuedQty: 0, unitPrice: 45.0 },
      { id: "ri-4", requisitionId: "REQ-2025-00127", itemId: "ITM-0006", itemName: "Stapler Pins (10 No.)", categoryName: "Desk Accessories", unit: "Box", requestedQty: 9, approvedQty: 9, issuedQty: 0, unitPrice: 20.0 },
    ],
  },
  {
    id: "REQ-2025-00126", userId: "user-5", userName: "Neha Gupta", departmentId: "dept-2", departmentName: "Finance",
    status: "ISSUED", purpose: "Office Use", remarks: "Standard monthly replenishment", requiredDate: "2025-06-01",
    priority: "NORMAL", totalAmount: 2310.0, createdAt: "2025-05-29T09:15:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-29T11:30:00", rejectedReason: null,
    items: [
      { id: "ri-5", requisitionId: "REQ-2025-00126", itemId: "ITM-0007", itemName: "A4 Copier Paper (70 GSM)", categoryName: "Paper Products", unit: "Ream", requestedQty: 10, approvedQty: 10, issuedQty: 10, unitPrice: 210.0 },
      { id: "ri-6", requisitionId: "REQ-2025-00126", itemId: "ITM-0014", itemName: "Paper Clips", categoryName: "Desk Accessories", unit: "Box", requestedQty: 3, approvedQty: 3, issuedQty: 3, unitPrice: 10.0 },
      { id: "ri-7", requisitionId: "REQ-2025-00126", itemId: "ITM-0009", itemName: "File Folder", categoryName: "Files & Folders", unit: "Piece", requestedQty: 1, approvedQty: 1, issuedQty: 1, unitPrice: 25.0 },
    ],
  },
  {
    id: "REQ-2025-00125", userId: "user-6", userName: "Rohit Kumar", departmentId: "dept-3", departmentName: "HR",
    status: "PENDING", purpose: "Training Session", remarks: "For new joiner orientation week", requiredDate: "2025-06-07",
    priority: "NORMAL", totalAmount: 850.0, createdAt: "2025-05-29T11:00:00",
    approvedById: null, approvedByName: null, approvedAt: null, rejectedReason: null,
    items: [
      { id: "ri-8", requisitionId: "REQ-2025-00125", itemId: "ITM-0008", itemName: "Spiral Notebook (A5)", categoryName: "Paper Products", unit: "Piece", requestedQty: 10, approvedQty: 0, issuedQty: 0, unitPrice: 45.0 },
      { id: "ri-9", requisitionId: "REQ-2025-00125", itemId: "ITM-0004", itemName: "Pencil (HB)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 100, approvedQty: 0, issuedQty: 0, unitPrice: 4.0 },
    ],
  },
  {
    id: "REQ-2025-00124", userId: "user-7", userName: "Sneha Iyer", departmentId: "dept-5", departmentName: "IT",
    status: "REJECTED", purpose: "Office Use", remarks: "", requiredDate: "2025-06-01",
    priority: "LOW", totalAmount: 460.0, createdAt: "2025-05-28T15:45:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: null, rejectedReason: "Budget exceeded for this quarter. Please resubmit next month with revised quantities.",
    items: [
      { id: "ri-10", requisitionId: "REQ-2025-00124", itemId: "ITM-0015", itemName: "Stapler", categoryName: "Desk Accessories", unit: "Piece", requestedQty: 2, approvedQty: 0, issuedQty: 0, unitPrice: 120.0 },
      { id: "ri-11", requisitionId: "REQ-2025-00124", itemId: "ITM-0016", itemName: "Scissors", categoryName: "Desk Accessories", unit: "Piece", requestedQty: 2, approvedQty: 0, issuedQty: 0, unitPrice: 45.0 },
      { id: "ri-12", requisitionId: "REQ-2025-00124", itemId: "ITM-0019", itemName: "Correction Pen", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 5, approvedQty: 0, issuedQty: 0, unitPrice: 20.0 },
    ],
  },
  // Additional requisitions to reach ~18
  {
    id: "REQ-2025-00123", userId: "user-2", userName: "Priya Singh", departmentId: "dept-1", departmentName: "Marketing",
    status: "ISSUED", purpose: "Event Preparation", remarks: "", requiredDate: "2025-05-28",
    priority: "URGENT", totalAmount: 1520.0, createdAt: "2025-05-26T09:00:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-26T10:30:00", rejectedReason: null,
    items: [
      { id: "ri-13", requisitionId: "REQ-2025-00123", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 100, approvedQty: 100, issuedQty: 100, unitPrice: 5.0 },
      { id: "ri-14", requisitionId: "REQ-2025-00123", itemId: "ITM-0008", itemName: "Spiral Notebook (A5)", categoryName: "Paper Products", unit: "Piece", requestedQty: 20, approvedQty: 20, issuedQty: 20, unitPrice: 45.0 },
      { id: "ri-15", requisitionId: "REQ-2025-00123", itemId: "ITM-0004", itemName: "Pencil (HB)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 30, approvedQty: 30, issuedQty: 30, unitPrice: 4.0 },
    ],
  },
  {
    id: "REQ-2025-00122", userId: "user-5", userName: "Neha Gupta", departmentId: "dept-2", departmentName: "Finance",
    status: "APPROVED", purpose: "Quarterly Audit", remarks: "Required for audit documentation", requiredDate: "2025-06-10",
    priority: "NORMAL", totalAmount: 975.0, createdAt: "2025-05-25T13:30:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-25T15:00:00", rejectedReason: null,
    items: [
      { id: "ri-16", requisitionId: "REQ-2025-00122", itemId: "ITM-0009", itemName: "File Folder", categoryName: "Files & Folders", unit: "Piece", requestedQty: 15, approvedQty: 15, issuedQty: 0, unitPrice: 25.0 },
      { id: "ri-17", requisitionId: "REQ-2025-00122", itemId: "ITM-0023", itemName: "Lever Arch File", categoryName: "Files & Folders", unit: "Piece", requestedQty: 5, approvedQty: 5, issuedQty: 0, unitPrice: 85.0 },
    ],
  },
  {
    id: "REQ-2025-00121", userId: "user-6", userName: "Rohit Kumar", departmentId: "dept-3", departmentName: "HR",
    status: "DRAFT", purpose: "Office Use", remarks: "Draft — reviewing quantities", requiredDate: "2025-06-15",
    priority: "LOW", totalAmount: 350.0, createdAt: "2025-05-24T16:00:00",
    approvedById: null, approvedByName: null, approvedAt: null, rejectedReason: null,
    items: [
      { id: "ri-18", requisitionId: "REQ-2025-00121", itemId: "ITM-0013", itemName: "Sticky Notes (3x3)", categoryName: "Paper Products", unit: "Pack", requestedQty: 10, approvedQty: 0, issuedQty: 0, unitPrice: 35.0 },
    ],
  },
  {
    id: "REQ-2025-00120", userId: "user-7", userName: "Sneha Iyer", departmentId: "dept-5", departmentName: "IT",
    status: "PARTIAL", purpose: "IT Department Supplies", remarks: "Some items out of stock", requiredDate: "2025-05-30",
    priority: "NORMAL", totalAmount: 1180.0, createdAt: "2025-05-23T10:00:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-23T12:00:00", rejectedReason: null,
    items: [
      { id: "ri-19", requisitionId: "REQ-2025-00120", itemId: "ITM-0020", itemName: "Calculator (Basic)", categoryName: "Office Electronics", unit: "Piece", requestedQty: 2, approvedQty: 2, issuedQty: 0, unitPrice: 250.0 },
      { id: "ri-20", requisitionId: "REQ-2025-00120", itemId: "ITM-0025", itemName: "USB Flash Drive (32GB)", categoryName: "Office Electronics", unit: "Piece", requestedQty: 2, approvedQty: 2, issuedQty: 1, unitPrice: 350.0 },
    ],
  },
  {
    id: "REQ-2025-00119", userId: "user-2", userName: "Priya Singh", departmentId: "dept-1", departmentName: "Marketing",
    status: "PENDING", purpose: "Marketing Campaign", remarks: "", requiredDate: "2025-06-08",
    priority: "NORMAL", totalAmount: 540.0, createdAt: "2025-05-22T08:30:00",
    approvedById: null, approvedByName: null, approvedAt: null, rejectedReason: null,
    items: [
      { id: "ri-21", requisitionId: "REQ-2025-00119", itemId: "ITM-0003", itemName: "Marker (Black)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 30, approvedQty: 0, issuedQty: 0, unitPrice: 18.0 },
    ],
  },
  // More to reach 18
  {
    id: "REQ-2025-00118", userId: "user-5", userName: "Neha Gupta", departmentId: "dept-2", departmentName: "Finance",
    status: "ISSUED", purpose: "Office Use", remarks: "", requiredDate: "2025-05-25",
    priority: "LOW", totalAmount: 420.0, createdAt: "2025-05-20T11:00:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-20T14:00:00", rejectedReason: null,
    items: [
      { id: "ri-22", requisitionId: "REQ-2025-00118", itemId: "ITM-0007", itemName: "A4 Copier Paper (70 GSM)", categoryName: "Paper Products", unit: "Ream", requestedQty: 2, approvedQty: 2, issuedQty: 2, unitPrice: 210.0 },
    ],
  },
  {
    id: "REQ-2025-00117", userId: "user-6", userName: "Rohit Kumar", departmentId: "dept-3", departmentName: "HR",
    status: "APPROVED", purpose: "Workshop", remarks: "Annual HR workshop", requiredDate: "2025-06-12",
    priority: "NORMAL", totalAmount: 1650.0, createdAt: "2025-05-18T09:00:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-18T11:30:00", rejectedReason: null,
    items: [
      { id: "ri-23", requisitionId: "REQ-2025-00117", itemId: "ITM-0008", itemName: "Spiral Notebook (A5)", categoryName: "Paper Products", unit: "Piece", requestedQty: 30, approvedQty: 30, issuedQty: 0, unitPrice: 45.0 },
      { id: "ri-24", requisitionId: "REQ-2025-00117", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 30, approvedQty: 30, issuedQty: 0, unitPrice: 5.0 },
      { id: "ri-25", requisitionId: "REQ-2025-00117", itemId: "ITM-0004", itemName: "Pencil (HB)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 30, approvedQty: 30, issuedQty: 0, unitPrice: 4.0 },
    ],
  },
  {
    id: "REQ-2025-00116", userId: "user-2", userName: "Priya Singh", departmentId: "dept-1", departmentName: "Marketing",
    status: "REJECTED", purpose: "Marketing Event", remarks: "", requiredDate: "2025-05-22",
    priority: "LOW", totalAmount: 3500.0, createdAt: "2025-05-15T14:00:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: null, rejectedReason: "Duplicate request. Please check REQ-2025-00123.",
    items: [
      { id: "ri-26", requisitionId: "REQ-2025-00116", itemId: "ITM-0025", itemName: "USB Flash Drive (32GB)", categoryName: "Office Electronics", unit: "Piece", requestedQty: 10, approvedQty: 0, issuedQty: 0, unitPrice: 350.0 },
    ],
  },
  {
    id: "REQ-2025-00115", userId: "user-7", userName: "Sneha Iyer", departmentId: "dept-5", departmentName: "IT",
    status: "ISSUED", purpose: "IT Supplies", remarks: "", requiredDate: "2025-05-20",
    priority: "NORMAL", totalAmount: 960.0, createdAt: "2025-05-14T09:00:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-14T10:00:00", rejectedReason: null,
    items: [
      { id: "ri-27", requisitionId: "REQ-2025-00115", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 20, approvedQty: 20, issuedQty: 20, unitPrice: 5.0 },
      { id: "ri-28", requisitionId: "REQ-2025-00115", itemId: "ITM-0011", itemName: "Gel Pen (Black)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 20, approvedQty: 20, issuedQty: 20, unitPrice: 12.0 },
      { id: "ri-29", requisitionId: "REQ-2025-00115", itemId: "ITM-0013", itemName: "Sticky Notes (3x3)", categoryName: "Paper Products", unit: "Pack", requestedQty: 10, approvedQty: 10, issuedQty: 10, unitPrice: 35.0 },
      { id: "ri-30", requisitionId: "REQ-2025-00115", itemId: "ITM-0017", itemName: "Tape (Transparent)", categoryName: "Desk Accessories", unit: "Roll", requestedQty: 10, approvedQty: 10, issuedQty: 10, unitPrice: 15.0 },
    ],
  },
  {
    id: "REQ-2025-00114", userId: "user-5", userName: "Neha Gupta", departmentId: "dept-2", departmentName: "Finance",
    status: "DRAFT", purpose: "Year End", remarks: "Preparing for fiscal year end", requiredDate: "2025-06-20",
    priority: "LOW", totalAmount: 250.0, createdAt: "2025-05-12T16:00:00",
    approvedById: null, approvedByName: null, approvedAt: null, rejectedReason: null,
    items: [
      { id: "ri-31", requisitionId: "REQ-2025-00114", itemId: "ITM-0009", itemName: "File Folder", categoryName: "Files & Folders", unit: "Piece", requestedQty: 10, approvedQty: 0, issuedQty: 0, unitPrice: 25.0 },
    ],
  },
  {
    id: "REQ-2025-00113", userId: "user-6", userName: "Rohit Kumar", departmentId: "dept-3", departmentName: "HR",
    status: "PENDING", purpose: "Recruitment Drive", remarks: "", requiredDate: "2025-06-05",
    priority: "URGENT", totalAmount: 720.0, createdAt: "2025-05-10T10:00:00",
    approvedById: null, approvedByName: null, approvedAt: null, rejectedReason: null,
    items: [
      { id: "ri-32", requisitionId: "REQ-2025-00113", itemId: "ITM-0008", itemName: "Spiral Notebook (A5)", categoryName: "Paper Products", unit: "Piece", requestedQty: 8, approvedQty: 0, issuedQty: 0, unitPrice: 45.0 },
      { id: "ri-33", requisitionId: "REQ-2025-00113", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 72, approvedQty: 0, issuedQty: 0, unitPrice: 5.0 },
    ],
  },
  {
    id: "REQ-2025-00112", userId: "user-2", userName: "Priya Singh", departmentId: "dept-1", departmentName: "Marketing",
    status: "ISSUED", purpose: "Office Use", remarks: "", requiredDate: "2025-05-15",
    priority: "NORMAL", totalAmount: 880.0, createdAt: "2025-05-08T09:00:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-08T10:00:00", rejectedReason: null,
    items: [
      { id: "ri-34", requisitionId: "REQ-2025-00112", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 20, approvedQty: 20, issuedQty: 20, unitPrice: 5.0 },
      { id: "ri-35", requisitionId: "REQ-2025-00112", itemId: "ITM-0005", itemName: "Highlighter (Yellow)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 20, approvedQty: 20, issuedQty: 20, unitPrice: 15.0 },
      { id: "ri-36", requisitionId: "REQ-2025-00112", itemId: "ITM-0010", itemName: "Eraser", categoryName: "Desk Accessories", unit: "Piece", requestedQty: 50, approvedQty: 50, issuedQty: 50, unitPrice: 5.0 },
      { id: "ri-37", requisitionId: "REQ-2025-00112", itemId: "ITM-0006", itemName: "Stapler Pins (10 No.)", categoryName: "Desk Accessories", unit: "Box", requestedQty: 3, approvedQty: 3, issuedQty: 3, unitPrice: 20.0 },
    ],
  },
  {
    id: "REQ-2025-00111", userId: "user-7", userName: "Sneha Iyer", departmentId: "dept-5", departmentName: "IT",
    status: "APPROVED", purpose: "Server Room", remarks: "Labels for server room cables", requiredDate: "2025-05-18",
    priority: "NORMAL", totalAmount: 310.0, createdAt: "2025-05-05T14:30:00",
    approvedById: "user-3", approvedByName: "Amit Verma", approvedAt: "2025-05-06T09:00:00", rejectedReason: null,
    items: [
      { id: "ri-38", requisitionId: "REQ-2025-00111", itemId: "ITM-0003", itemName: "Marker (Black)", categoryName: "Writing Instruments", unit: "Piece", requestedQty: 5, approvedQty: 5, issuedQty: 0, unitPrice: 18.0 },
      { id: "ri-39", requisitionId: "REQ-2025-00111", itemId: "ITM-0017", itemName: "Tape (Transparent)", categoryName: "Desk Accessories", unit: "Roll", requestedQty: 10, approvedQty: 10, issuedQty: 0, unitPrice: 15.0 },
      { id: "ri-40", requisitionId: "REQ-2025-00111", itemId: "ITM-0021", itemName: "Rubber Bands", categoryName: "Others", unit: "Pack", requestedQty: 5, approvedQty: 5, issuedQty: 0, unitPrice: 8.0 },
    ],
  },
];

// ─── Stock Transactions (~30) ───
export const stockTransactions: MockStockTransaction[] = [
  { id: "st-1", type: "INWARD", itemId: "ITM-0007", itemName: "A4 Copier Paper (70 GSM)", quantity: 500, unitPrice: 210.0, referenceNo: "GRN-2025-0045", date: "2025-05-31", userId: "user-4" },
  { id: "st-2", type: "OUTWARD", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", quantity: 50, unitPrice: 5.0, referenceNo: "ISS-2025-00155", date: "2025-05-31", userId: "user-4" },
  { id: "st-3", type: "INWARD", itemId: "ITM-0003", itemName: "Marker (Black)", quantity: 100, unitPrice: 18.0, referenceNo: "GRN-2025-0044", date: "2025-05-30", userId: "user-4" },
  { id: "st-4", type: "OUTWARD", itemId: "ITM-0008", itemName: "Spiral Notebook (A5)", quantity: 25, unitPrice: 45.0, referenceNo: "ISS-2025-00154", date: "2025-05-30", userId: "user-4" },
  { id: "st-5", type: "OUTWARD", itemId: "ITM-0009", itemName: "File Folder", quantity: 30, unitPrice: 25.0, referenceNo: "ISS-2025-00153", date: "2025-05-29", userId: "user-4" },
  { id: "st-6", type: "INWARD", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", quantity: 200, unitPrice: 5.0, referenceNo: "GRN-2025-0043", date: "2025-05-28", userId: "user-4" },
  { id: "st-7", type: "INWARD", itemId: "ITM-0004", itemName: "Pencil (HB)", quantity: 500, unitPrice: 4.0, referenceNo: "GRN-2025-0042", date: "2025-05-27", userId: "user-4" },
  { id: "st-8", type: "OUTWARD", itemId: "ITM-0004", itemName: "Pencil (HB)", quantity: 100, unitPrice: 4.0, referenceNo: "ISS-2025-00152", date: "2025-05-27", userId: "user-4" },
  { id: "st-9", type: "OUTWARD", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", quantity: 100, unitPrice: 5.0, referenceNo: "ISS-2025-00151", date: "2025-05-26", userId: "user-4" },
  { id: "st-10", type: "INWARD", itemId: "ITM-0005", itemName: "Highlighter (Yellow)", quantity: 50, unitPrice: 15.0, referenceNo: "GRN-2025-0041", date: "2025-05-25", userId: "user-4" },
  { id: "st-11", type: "OUTWARD", itemId: "ITM-0005", itemName: "Highlighter (Yellow)", quantity: 48, unitPrice: 15.0, referenceNo: "ISS-2025-00150", date: "2025-05-25", userId: "user-4" },
  { id: "st-12", type: "INWARD", itemId: "ITM-0008", itemName: "Spiral Notebook (A5)", quantity: 100, unitPrice: 45.0, referenceNo: "GRN-2025-0040", date: "2025-05-24", userId: "user-4" },
  { id: "st-13", type: "OUTWARD", itemId: "ITM-0007", itemName: "A4 Copier Paper (70 GSM)", quantity: 20, unitPrice: 210.0, referenceNo: "ISS-2025-00149", date: "2025-05-23", userId: "user-4" },
  { id: "st-14", type: "ADJUSTMENT", itemId: "ITM-0010", itemName: "Eraser", quantity: -5, unitPrice: 5.0, referenceNo: "ADJ-2025-001", date: "2025-05-22", userId: "user-4" },
  { id: "st-15", type: "INWARD", itemId: "ITM-0006", itemName: "Stapler Pins (10 No.)", quantity: 100, unitPrice: 20.0, referenceNo: "GRN-2025-0039", date: "2025-05-21", userId: "user-4" },
  { id: "st-16", type: "OUTWARD", itemId: "ITM-0010", itemName: "Eraser", quantity: 50, unitPrice: 5.0, referenceNo: "ISS-2025-00148", date: "2025-05-20", userId: "user-4" },
  { id: "st-17", type: "INWARD", itemId: "ITM-0011", itemName: "Gel Pen (Black)", quantity: 100, unitPrice: 12.0, referenceNo: "GRN-2025-0038", date: "2025-05-19", userId: "user-4" },
  { id: "st-18", type: "OUTWARD", itemId: "ITM-0011", itemName: "Gel Pen (Black)", quantity: 20, unitPrice: 12.0, referenceNo: "ISS-2025-00147", date: "2025-05-19", userId: "user-4" },
  { id: "st-19", type: "INWARD", itemId: "ITM-0009", itemName: "File Folder", quantity: 50, unitPrice: 25.0, referenceNo: "GRN-2025-0037", date: "2025-05-18", userId: "user-4" },
  { id: "st-20", type: "OUTWARD", itemId: "ITM-0013", itemName: "Sticky Notes (3x3)", quantity: 10, unitPrice: 35.0, referenceNo: "ISS-2025-00146", date: "2025-05-17", userId: "user-4" },
  { id: "st-21", type: "INWARD", itemId: "ITM-0014", itemName: "Paper Clips", quantity: 50, unitPrice: 10.0, referenceNo: "GRN-2025-0036", date: "2025-05-16", userId: "user-4" },
  { id: "st-22", type: "OUTWARD", itemId: "ITM-0017", itemName: "Tape (Transparent)", quantity: 10, unitPrice: 15.0, referenceNo: "ISS-2025-00145", date: "2025-05-15", userId: "user-4" },
  { id: "st-23", type: "INWARD", itemId: "ITM-0015", itemName: "Stapler", quantity: 10, unitPrice: 120.0, referenceNo: "GRN-2025-0035", date: "2025-05-14", userId: "user-4" },
  { id: "st-24", type: "OUTWARD", itemId: "ITM-0001", itemName: "Ball Pen (Blue)", quantity: 20, unitPrice: 5.0, referenceNo: "ISS-2025-00144", date: "2025-05-13", userId: "user-4" },
  { id: "st-25", type: "INWARD", itemId: "ITM-0002", itemName: "Ball Pen (Red)", quantity: 150, unitPrice: 5.0, referenceNo: "GRN-2025-0034", date: "2025-05-12", userId: "user-4" },
  { id: "st-26", type: "OUTWARD", itemId: "ITM-0006", itemName: "Stapler Pins (10 No.)", quantity: 15, unitPrice: 20.0, referenceNo: "ISS-2025-00143", date: "2025-05-11", userId: "user-4" },
  { id: "st-27", type: "INWARD", itemId: "ITM-0013", itemName: "Sticky Notes (3x3)", quantity: 30, unitPrice: 35.0, referenceNo: "GRN-2025-0033", date: "2025-05-10", userId: "user-4" },
  { id: "st-28", type: "ADJUSTMENT", itemId: "ITM-0024", itemName: "Desk Organizer", quantity: -2, unitPrice: 180.0, referenceNo: "ADJ-2025-002", date: "2025-05-09", userId: "user-4" },
  { id: "st-29", type: "INWARD", itemId: "ITM-0016", itemName: "Scissors", quantity: 20, unitPrice: 45.0, referenceNo: "GRN-2025-0032", date: "2025-05-08", userId: "user-4" },
  { id: "st-30", type: "OUTWARD", itemId: "ITM-0002", itemName: "Ball Pen (Red)", quantity: 30, unitPrice: 5.0, referenceNo: "ISS-2025-00142", date: "2025-05-07", userId: "user-4" },
];

// ─── Helper: get current user (mock session) ───
let currentUserId = "user-1"; // Default: Admin

export function setCurrentUser(userId: string) {
  currentUserId = userId;
}

export function getCurrentUser(): MockUser {
  return users.find((u) => u.id === currentUserId) || users[0];
}

export function getUserById(id: string): MockUser | undefined {
  return users.find((u) => u.id === id);
}

// ─── Helper: get requisitions for current user ───
export function getMyRequisitions(): MockRequisition[] {
  const user = getCurrentUser();
  if (user.role === "ADMIN") return requisitions;
  return requisitions.filter((r) => r.userId === user.id);
}

export function getPendingApprovals(): MockRequisition[] {
  return requisitions.filter((r) => r.status === "PENDING");
}

export function getApprovedRequisitions(): MockRequisition[] {
  return requisitions.filter((r) => r.status === "APPROVED");
}

export function getIssueQueue(): MockRequisition[] {
  return requisitions.filter((r) => r.status === "APPROVED");
}

// ─── Helper: stock status ───
export function getStockStatus(item: MockItem): "IN_STOCK" | "LOW" | "CRITICAL" | "OUT_OF_STOCK" {
  if (item.currentStock === 0) return "OUT_OF_STOCK";
  if (item.currentStock <= item.minStockLevel * 0.2) return "CRITICAL";
  if (item.currentStock < item.minStockLevel) return "LOW";
  return "IN_STOCK";
}

export function getLowStockItems(): MockItem[] {
  return items.filter((i) => {
    const status = getStockStatus(i);
    return status === "LOW" || status === "CRITICAL";
  });
}

// ─── Helper: generate new IDs ───
/**
 * Generates a globally unique requisition ID using:
 *   - Current year (so IDs are visually year-scoped)
 *   - Unix timestamp in seconds (unique per second across users)
 *   - 3-digit random suffix (collision protection within the same second)
 *
 * Format:  REQ-2026-1751234567-842
 * Guarantees: no two IDs are the same regardless of which user submits,
 * how fast they submit, or whether the server has restarted.
 */
export function generateRequisitionId(): string {
  const year = new Date().getFullYear();
  const ts   = Math.floor(Date.now() / 1000);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `REQ-${year}-${ts}-${rand}`;
}

/**
 * Same pattern for Issuance IDs.
 */
export function generateIssuanceId(): string {
  const year = new Date().getFullYear();
  const ts   = Math.floor(Date.now() / 1000);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ISS-${year}-${ts}-${rand}`;
}
