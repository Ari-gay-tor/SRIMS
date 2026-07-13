/**
 * SRIMS database seed script.
 *
 * Pulls directly from the same mock dataset that powers the in-memory demo
 * (src/lib/data/mock-data.ts), so a freshly migrated database starts with
 * the exact same departments, users, categories, items, suppliers,
 * requisitions, and stock transactions you already know from the app.
 *
 * Run with:  npx prisma db seed
 * (this is wired up automatically by the "prisma.seed" entry in package.json)
 *
 * NOTE ON THIS DEVELOPMENT SANDBOX:
 * This script has been carefully hand-reviewed against prisma/schema.prisma
 * but has NOT been executed end-to-end here, because Prisma's CLI requires
 * downloading an engine binary from binaries.prisma.sh, which is not on this
 * sandbox's network allowlist (every prisma command — generate, validate,
 * format, migrate — fails the same way here). This is a restriction specific
 * to this sandbox, not a problem with Prisma itself: on your own machine,
 * with normal internet access, `npx prisma generate` and `npx prisma db seed`
 * will work as documented. Please run it locally and let me know if you hit
 * any errors — I'm happy to debug from there.
 */

import { PrismaClient, Role, RequisitionStatus, Priority, StockTransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  departments,
  users,
  categories,
  items,
  suppliers,
  requisitions,
  stockTransactions,
} from "../src/lib/data/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SRIMS database...");

  // ─── Departments ───
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: { name: dept.name },
      create: { id: dept.id, name: dept.name },
    });
  }
  console.log(`✓ ${departments.length} departments`);

  // ─── Users (two-pass: insert first, then wire up approverId.
  //     Some users reference an approver that appears later in the array,
  //     so resolving approverId in a second pass avoids FK ordering issues.) ───
  const SALT_ROUNDS = 10;
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.passwordHash, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role as Role,
        departmentId: user.departmentId,
        isActive: user.isActive,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role as Role,
        departmentId: user.departmentId,
        isActive: user.isActive,
      },
    });
  }
  for (const user of users) {
    if (user.approverId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { approverId: user.approverId },
      });
    }
  }
  console.log(`✓ ${users.length} users (passwords hashed with bcrypt)`);

  // ─── Categories ───
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, parentId: cat.parentId, icon: cat.icon, color: cat.color },
      create: { id: cat.id, name: cat.name, parentId: cat.parentId, icon: cat.icon, color: cat.color },
    });
  }
  console.log(`✓ ${categories.length} categories`);

  // ─── Suppliers ───
  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { id: sup.id },
      update: { name: sup.name, contact: sup.contact, address: sup.address },
      create: { id: sup.id, name: sup.name, contact: sup.contact, address: sup.address },
    });
  }
  console.log(`✓ ${suppliers.length} suppliers`);

  // ─── Items ───
  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        categoryId: item.categoryId,
        unit: item.unit,
        unitPrice: item.unitPrice,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        isActive: item.isActive,
        iconKey: item.iconKey,
      },
      create: {
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        unit: item.unit,
        unitPrice: item.unitPrice,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        isActive: item.isActive,
        iconKey: item.iconKey,
      },
    });
  }
  console.log(`✓ ${items.length} items`);

  // ─── Requisitions + their line items ───
  for (const req of requisitions) {
    await prisma.requisition.upsert({
      where: { id: req.id },
      update: {
        userId: req.userId,
        departmentId: req.departmentId,
        status: req.status as RequisitionStatus,
        purpose: req.purpose || null,
        remarks: req.remarks || null,
        requiredDate: req.requiredDate ? new Date(req.requiredDate) : null,
        totalAmount: req.totalAmount,
        priority: req.priority as Priority,
        createdAt: new Date(req.createdAt),
        approvedById: req.approvedById || null,
        approvedAt: req.approvedAt ? new Date(req.approvedAt) : null,
        rejectedReason: req.rejectedReason || null,
      },
      create: {
        id: req.id,
        userId: req.userId,
        departmentId: req.departmentId,
        status: req.status as RequisitionStatus,
        purpose: req.purpose || null,
        remarks: req.remarks || null,
        requiredDate: req.requiredDate ? new Date(req.requiredDate) : null,
        totalAmount: req.totalAmount,
        priority: req.priority as Priority,
        createdAt: new Date(req.createdAt),
        approvedById: req.approvedById || null,
        approvedAt: req.approvedAt ? new Date(req.approvedAt) : null,
        rejectedReason: req.rejectedReason || null,
      },
    });

    // Replace line items idempotently (delete + recreate) so re-running the
    // seed doesn't duplicate or orphan RequisitionItem rows.
    await prisma.requisitionItem.deleteMany({ where: { requisitionId: req.id } });
    for (const line of req.items) {
      await prisma.requisitionItem.create({
        data: {
          requisitionId: req.id,
          itemId: line.itemId,
          requestedQty: line.requestedQty,
          approvedQty: line.approvedQty,
          issuedQty: line.issuedQty,
          unitPrice: line.unitPrice,
        },
      });
    }
  }
  console.log(`✓ ${requisitions.length} requisitions with line items`);

  // ─── Stock Transactions ───
  // Each needs a userId; mock data's transactions all use "user-4" (Sandeep,
  // the seeded Inventory Manager), which matches what's actually in the array.
  for (const txn of stockTransactions) {
    await prisma.stockTransaction.upsert({
      where: { id: txn.id },
      update: {
        type: txn.type as StockTransactionType,
        itemId: txn.itemId,
        quantity: txn.quantity,
        unitPrice: txn.unitPrice,
        referenceNo: txn.referenceNo,
        date: new Date(txn.date),
        userId: txn.userId,
      },
      create: {
        id: txn.id,
        type: txn.type as StockTransactionType,
        itemId: txn.itemId,
        quantity: txn.quantity,
        unitPrice: txn.unitPrice,
        referenceNo: txn.referenceNo,
        date: new Date(txn.date),
        userId: txn.userId,
      },
    });
  }
  console.log(`✓ ${stockTransactions.length} stock transactions`);

  console.log("🌱 Seed complete. Demo accounts (password shown is the original, now bcrypt-hashed in the DB):");
  console.log("   Admin:          rahul@srims.com   / Admin@123");
  console.log("   Employee:       priya@srims.com   / User@123");
  console.log("   Approver:       amit@srims.com    / Approver@123");
  console.log("   Inventory Mgr:  sandeep@srims.com / Inventory@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
