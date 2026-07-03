import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigured, getPrismaClient } from "@/lib/prisma";
import { RequisitionStatus, Priority } from "@prisma/client";

const AUTO_APPROVAL_ENABLED = true;
const AUTO_APPROVAL_PRIORITIES = ["LOW"];
const AUTO_APPROVAL_ACTOR_ID = "system-auto-approval";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = getPrismaClient();
    const body = await req.json();

    const {
      status,
      approvedQty,
      rejectedReason,
      purpose,
      remarks,
      requiredDate,
      totalAmount,
      priority,
      items,
    } = body;

    const requisitionId = params.id;

    const existingReq = await prisma.requisition.findUnique({
      where: { id: requisitionId },
      include: { items: true },
    });

    if (!existingReq) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalStatus =
        (status as RequisitionStatus) || existingReq.status;

      let approvedById = existingReq.approvedById;
      let approvedAt = existingReq.approvedAt;
      let isAutoApproved = false;

      const reqPriority = priority || existingReq.priority;

      if (
        finalStatus === "PENDING" &&
        existingReq.status === "DRAFT" &&
        AUTO_APPROVAL_ENABLED &&
        AUTO_APPROVAL_PRIORITIES.includes(reqPriority)
      ) {
        finalStatus = "APPROVED";
        approvedById = AUTO_APPROVAL_ACTOR_ID;
        approvedAt = new Date();
        isAutoApproved = true;
      }

      const data: Record<string, unknown> = {};

      if (status !== undefined) data.status = finalStatus;
      if (purpose !== undefined) data.purpose = purpose;
      if (remarks !== undefined) data.remarks = remarks;
      if (requiredDate !== undefined) {
        data.requiredDate = requiredDate ? new Date(requiredDate) : null;
      }
      if (totalAmount !== undefined) data.totalAmount = totalAmount;
      if (priority !== undefined) data.priority = priority as Priority;
      if (rejectedReason !== undefined) {
        data.rejectedReason = rejectedReason || null;
      }

      if (status === "APPROVED" && !isAutoApproved) {
        data.approvedById = session.user.id;
        data.approvedAt = new Date();
      } else if (isAutoApproved) {
        data.approvedById = approvedById;
        data.approvedAt = approvedAt;
      }

      const updatedReq = await tx.requisition.update({
        where: { id: requisitionId },
        data,
      });

      // Update requisition items
      if (items && Array.isArray(items)) {
        await tx.requisitionItem.deleteMany({
          where: { requisitionId },
        });

        for (const item of items) {
          await tx.requisitionItem.create({
            data: {
              requisitionId,
              itemId: item.itemId,
              requestedQty: item.quantity || item.requestedQty,
              approvedQty:
                finalStatus === "APPROVED"
                  ? item.quantity || item.requestedQty
                  : 0,
              issuedQty: 0,
              unitPrice: item.unitPrice,
            },
          });
        }
      } else if (approvedQty && typeof approvedQty === "object") {
        for (const lineItem of existingReq.items) {
          const customQty = approvedQty[lineItem.itemId];

          await tx.requisitionItem.update({
            where: { id: lineItem.id },
            data: {
              approvedQty:
                customQty !== undefined
                  ? customQty
                  : lineItem.requestedQty,
            },
          });
        }
      } else if (
        finalStatus === "APPROVED" &&
        existingReq.status !== "APPROVED"
      ) {
        for (const lineItem of existingReq.items) {
          await tx.requisitionItem.update({
            where: { id: lineItem.id },
            data: {
              approvedQty: lineItem.requestedQty,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: isAutoApproved ? "AUTO_APPROVE" : status || "UPDATE",
          entity: "Requisition",
          entityId: requisitionId,
          after: JSON.stringify({
            id: requisitionId,
            status: finalStatus,
            rejectedReason,
          }),
        },
      });

      if (
        finalStatus === "APPROVED" &&
        existingReq.status !== "APPROVED"
      ) {
        await tx.notification.create({
          data: {
            userId: existingReq.userId,
            type: "REQUISITION_APPROVED",
            message: `Your requisition ${requisitionId} has been approved.`,
            link: "/requisitions/my",
          },
        });
      } else if (
        finalStatus === "REJECTED" &&
        existingReq.status !== "REJECTED"
      ) {
        await tx.notification.create({
          data: {
            userId: existingReq.userId,
            type: "REQUISITION_REJECTED",
            message: `Your requisition ${requisitionId} was rejected: "${rejectedReason || "No details provided"}".`,
            link: "/requisitions/my",
          },
        });
      }

      return updatedReq;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/requisitions/:id PATCH]", err);
    return NextResponse.json(
      { error: "Failed to update requisition" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = getPrismaClient();
    const requisitionId = params.id;

    const existingReq = await prisma.requisition.findUnique({
      where: { id: requisitionId },
    });

    if (!existingReq) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
    }

    if (existingReq.status !== "DRAFT") {
      return NextResponse.json({ error: "Only draft requisitions can be deleted" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // RequisitionItem will cascade delete due to schema mapping
      await tx.requisition.delete({ where: { id: requisitionId } });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "DELETE",
          entity: "Requisition",
          entityId: requisitionId,
          after: `Deleted draft requisition ${requisitionId}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/requisitions/:id DELETE]", err);
    return NextResponse.json({ error: "Failed to delete requisition" }, { status: 500 });
  }
}
