/**
 * Server-side runtime user-status registry.
 *
 * Problem: NextAuth's authorize() runs server-side and imports the static
 * `users` array from mock-data.ts. When an Admin deactivates a user via
 * Masters → Users (which mutates Zustand client-side state), the server-side
 * auth check still sees the original `isActive: true` from the static import
 * and lets the user log in anyway.
 *
 * Solution: this module maintains a Node.js module-level Set of deactivated
 * user IDs. The toggleUserActive store action calls PATCH /api/users/[id] 
 * which already exists — we extend that route to also update this Set.
 * auth.ts then checks this Set in addition to the static `isActive` field.
 *
 * Limitations:
 * - Resets on server restart (same as Zustand state in a database-less setup)
 * - In Next.js dev mode with hot-reload, the module may be re-instantiated;
 *   for `npm run dev` on localhost this is acceptable behaviour
 * - For true persistence across restarts, connect a real database (see README)
 */
const deactivatedUserIds = new Set<string>();

export function serverDeactivateUser(id: string): void {
  deactivatedUserIds.add(id);
}

export function serverActivateUser(id: string): void {
  deactivatedUserIds.delete(id);
}

export function isServerDeactivated(id: string): boolean {
  return deactivatedUserIds.has(id);
}
