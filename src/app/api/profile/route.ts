import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigured, getPrismaClient } from "@/lib/prisma";

/**
 * Self-service profile endpoint — available to ANY authenticated user.
 * Unlike /api/users/:id (which is admin-only), this endpoint is scoped
 * strictly to the currently-logged-in user's own record.
 *
 * GET  /api/profile       → return the caller's profile from DB
 * PATCH /api/profile      → update name, avatarUrl, and/or password
 *
 * When no database is configured the routes return 503 and the client
 * falls back gracefully to its Zustand / localStorage state.
 */

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

// ── GET /api/profile ─────────────────────────────────────────────────────────
export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "No database configured." },
      { status: 503 }
    );
  }

  try {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
        avatarUrl: true,
        department: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department.name,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl ?? null,
    });
  } catch (err) {
    console.error("[api/profile GET]", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// ── PATCH /api/profile ───────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "No database configured." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { name, avatarUrl, currentPassword, newPassword } = body as {
      name?: string;
      avatarUrl?: string | null;
      currentPassword?: string;
      newPassword?: string;
    };

    const prisma = getPrismaClient();

    // ── Password change: verify current password first ──────────────────────
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new one." },
          { status: 400 }
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters." },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const valid = await bcrypt.compare(currentPassword, existing.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }
    }

    // ── Build update payload ─────────────────────────────────────────────────
    const data: Record<string, unknown> = {};
    if (name !== undefined && name.trim().length > 0) data.name = name.trim();
    // avatarUrl can be a data-URL string OR null (to clear the avatar)
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 10);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: "Nothing to update" });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
        avatarUrl: true,
        department: { select: { name: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      departmentId: updated.departmentId,
      departmentName: updated.department.name,
      isActive: updated.isActive,
      avatarUrl: updated.avatarUrl ?? null,
    });
  } catch (err) {
    console.error("[api/profile PATCH]", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
