"use client";

import React, { useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ToggleSwitch from "@/components/shared/ToggleSwitch";
import { useAppStore } from "@/stores/app-store";
import { UserRole } from "@/types";
import {
  Building2, Plus, Pencil, Trash2, X, Users,
  ChevronRight, UserPlus, ArrowRightLeft, Search,
} from "lucide-react";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  USER: "Employee",
  APPROVER: "Approver",
  INVENTORY_MGR: "Inventory Manager",
};
const roleBadgeColors: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  USER: "bg-blue-100 text-blue-700",
  APPROVER: "bg-green-100 text-green-700",
  INVENTORY_MGR: "bg-amber-100 text-amber-700",
};

export default function DepartmentsPage() {
  const {
    departments, allUsers,
    addDepartment, updateDepartment, deleteDepartment,
    updateUser, toggleUserActive, currentUser,
  } = useAppStore();

  const canManage = currentUser.role === "ADMIN";

  // Department modal
  const [showDeptModal, setShowDeptModal]     = useState(false);
  const [editingDeptId, setEditingDeptId]     = useState<string | null>(null);
  const [deptName, setDeptName]               = useState("");
  const [deptError, setDeptError]             = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Selected department for the right panel
  const [selectedDeptId, setSelectedDeptId]   = useState<string | null>(null);
  const [userSearch, setUserSearch]           = useState("");

  // Move user modal
  const [showMoveModal, setShowMoveModal]     = useState(false);
  const [movingUserId, setMovingUserId]       = useState<string | null>(null);
  const [moveTargetDeptId, setMoveTargetDeptId] = useState("");

  // Add user to dept modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserSearch, setAddUserSearch]       = useState("");

  const selectedDept = departments.find((d) => d.id === selectedDeptId);
  const usersInSelectedDept = useMemo(
    () => allUsers.filter((u) => u.departmentId === selectedDeptId),
    [allUsers, selectedDeptId]
  );
  const usersNotInSelectedDept = useMemo(
    () => allUsers.filter((u) => u.departmentId !== selectedDeptId),
    [allUsers, selectedDeptId]
  );

  const filteredUsers = useMemo(() => {
    if (!userSearch) return usersInSelectedDept;
    const q = userSearch.toLowerCase();
    return usersInSelectedDept.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [usersInSelectedDept, userSearch]);

  const filteredAddUsers = useMemo(() => {
    if (!addUserSearch) return usersNotInSelectedDept;
    const q = addUserSearch.toLowerCase();
    return usersNotInSelectedDept.filter(
      (u) => u.name.toLowerCase().includes(q) || roleLabels[u.role].toLowerCase().includes(q)
    );
  }, [usersNotInSelectedDept, addUserSearch]);

  // ─── Department CRUD ─────────────────────────────────────────────────────

  const openAddDept = () => {
    setEditingDeptId(null); setDeptName(""); setDeptError(""); setShowDeptModal(true);
  };
  const openEditDept = (id: string) => {
    const d = departments.find((x) => x.id === id);
    if (!d) return;
    setEditingDeptId(id); setDeptName(d.name); setDeptError(""); setShowDeptModal(true);
  };
  const handleSaveDept = () => {
    const trimmed = deptName.trim();
    if (!trimmed) { setDeptError("Name is required."); return; }
    if (departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase() && d.id !== editingDeptId)) {
      setDeptError("A department with this name already exists."); return;
    }
    if (editingDeptId) { updateDepartment(editingDeptId, trimmed); }
    else { addDepartment(trimmed); }
    setShowDeptModal(false);
  };
  const handleDeleteDept = (id: string) => {
    const count = allUsers.filter((u) => u.departmentId === id).length;
    if (count > 0) {
      alert(`Cannot delete — ${count} user(s) are still assigned here. Reassign them first.`);
      setDeleteConfirmId(null); return;
    }
    deleteDepartment(id);
    if (selectedDeptId === id) setSelectedDeptId(null);
    setDeleteConfirmId(null);
  };

  // ─── User assignment actions ──────────────────────────────────────────────

  const handleMoveUser = () => {
    if (!movingUserId || !moveTargetDeptId) return;
    const targetDept = departments.find((d) => d.id === moveTargetDeptId);
    if (!targetDept) return;
    updateUser(movingUserId, { departmentId: moveTargetDeptId, departmentName: targetDept.name });
    setShowMoveModal(false); setMovingUserId(null); setMoveTargetDeptId("");
  };

  const handleAddUserToDept = (userId: string) => {
    if (!selectedDept) return;
    updateUser(userId, { departmentId: selectedDept.id, departmentName: selectedDept.name });
    setShowAddUserModal(false); setAddUserSearch("");
  };

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Departments" subtitle="Manage company departments and user assignments" />
        <div className="rounded-card border border-border bg-surface-card p-8 text-center">
          <Building2 size={36} className="mx-auto mb-3 text-text-muted" />
          <p className="text-[13px] text-text-secondary">Only Administrators can manage departments.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} departments · ${allUsers.length} total users`}
        actions={
          <button onClick={openAddDept}
            className="flex items-center gap-1.5 rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover">
            <Plus size={16} />
            Add Department
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ─── Left: Department list ─────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="rounded-card border border-border bg-surface-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                All Departments
              </p>
            </div>
            <div className="divide-y divide-border">
              {departments.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-text-muted">
                  No departments yet
                </div>
              ) : (
                departments.map((dept) => {
                  const count = allUsers.filter((u) => u.departmentId === dept.id).length;
                  const isSelected = selectedDeptId === dept.id;
                  return (
                    <div
                      key={dept.id}
                      onClick={() => { setSelectedDeptId(dept.id); setUserSearch(""); }}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                        isSelected ? "bg-brand-primary/8 border-l-2 border-brand-primary" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? "bg-brand-primary/10" : "bg-gray-100"
                      }`}>
                        <Building2 size={16} className={isSelected ? "text-brand-primary" : "text-text-secondary"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium ${isSelected ? "text-brand-primary" : "text-text-primary"}`}>
                          {dept.name}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {count} user{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditDept(dept.id); }}
                          className="rounded p-1 text-text-muted hover:bg-gray-100 hover:text-brand-primary"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(dept.id); }}
                          className="rounded p-1 text-text-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={14} className={isSelected ? "text-brand-primary" : "text-text-muted"} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ─── Right: Users in selected department ──────────────────────── */}
        <div className="lg:col-span-2">
          {!selectedDept ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-card border border-dashed border-border bg-surface-card">
              <div className="text-center">
                <Users size={32} className="mx-auto mb-3 text-text-muted" />
                <p className="text-[14px] font-medium text-text-primary">Select a department</p>
                <p className="text-[12px] text-text-secondary">
                  Click any department on the left to view and manage its users
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-card border border-border bg-surface-card overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-text-primary">{selectedDept.name}</h3>
                  <p className="text-[12px] text-text-muted">
                    {usersInSelectedDept.length} user{usersInSelectedDept.length !== 1 ? "s" : ""} assigned
                  </p>
                </div>
                <button
                  onClick={() => { setShowAddUserModal(true); setAddUserSearch(""); }}
                  className="flex items-center gap-1.5 rounded-button border border-brand-primary px-3 py-1.5 text-[12px] font-medium text-brand-primary hover:bg-tint-blue-bg"
                >
                  <UserPlus size={14} />
                  Add User Here
                </button>
              </div>

              {/* Search */}
              {usersInSelectedDept.length > 3 && (
                <div className="border-b border-border px-4 py-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search users in this department..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full rounded-button border border-border py-1.5 pl-8 pr-3 text-[12px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* User list */}
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-10 text-center text-[13px] text-text-muted">
                  {usersInSelectedDept.length === 0
                    ? "No users in this department yet. Use 'Add User Here' to assign someone."
                    : "No users match your search."}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Avatar */}
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-[13px] font-bold text-white">
                        {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-text-primary">{user.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadgeColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                          {!user.isActive && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-text-muted">{user.email}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <ToggleSwitch
                          checked={user.isActive}
                          onChange={() => toggleUserActive(user.id)}
                          disabled={user.id === currentUser.id}
                          disabledReason="You cannot deactivate yourself"
                          showLabel={false}
                          size="sm"
                        />
                        <button
                          onClick={() => {
                            setMovingUserId(user.id);
                            setMoveTargetDeptId("");
                            setShowMoveModal(true);
                          }}
                          className="flex items-center gap-1 rounded-button border border-border px-2 py-1 text-[11px] font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary"
                          title="Move to another department"
                        >
                          <ArrowRightLeft size={12} />
                          Move
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Add / Edit Department Modal ─────────────────────────────────── */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-card bg-surface-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-text-primary">
                {editingDeptId ? "Edit Department" : "Add Department"}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Department Name *</label>
            <input
              type="text"
              value={deptName}
              onChange={(e) => { setDeptName(e.target.value); setDeptError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSaveDept()}
              placeholder="e.g. Sales & Marketing"
              className="w-full rounded-button border border-border px-3 py-2 text-[14px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
            {deptError && <p className="mt-1 text-[11px] text-red-600">{deptError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowDeptModal(false)}
                className="rounded-button border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSaveDept} disabled={!deptName.trim()}
                className="rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-40">
                {editingDeptId ? "Save" : "Add Department"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ───────────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-card bg-surface-card p-6 shadow-lg">
            <h3 className="mb-2 text-[15px] font-semibold text-text-primary">Delete department?</h3>
            <p className="mb-4 text-[13px] text-text-secondary">
              Departments with assigned users cannot be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmId(null)}
                className="rounded-button border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDeleteDept(deleteConfirmId)}
                className="rounded-button bg-red-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Move User to Another Department ─────────────────────────────── */}
      {showMoveModal && movingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-card bg-surface-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-text-primary">Move User</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-[13px] text-text-secondary">
              Moving <strong>{allUsers.find((u) => u.id === movingUserId)?.name}</strong> from{" "}
              <strong>{selectedDept?.name}</strong> to:
            </p>
            <select
              value={moveTargetDeptId}
              onChange={(e) => setMoveTargetDeptId(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none"
            >
              <option value="">Select destination department...</option>
              {departments
                .filter((d) => d.id !== selectedDeptId)
                .map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowMoveModal(false)}
                className="rounded-button border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleMoveUser} disabled={!moveTargetDeptId}
                className="flex items-center gap-2 rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-40">
                <ArrowRightLeft size={14} />
                Move User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add User to Department ───────────────────────────────────────── */}
      {showAddUserModal && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-card bg-surface-card shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-[16px] font-semibold text-text-primary">Add User to {selectedDept.name}</h3>
                <p className="text-[12px] text-text-muted">
                  Moving a user here reassigns them from their current department.
                </p>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="border-b border-border px-4 py-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by name or role..."
                  value={addUserSearch}
                  onChange={(e) => setAddUserSearch(e.target.value)}
                  className="w-full rounded-button border border-border py-1.5 pl-8 pr-3 text-[12px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {filteredAddUsers.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-text-muted">
                  {usersNotInSelectedDept.length === 0
                    ? "All users are already in this department."
                    : "No users match your search."}
                </div>
              ) : (
                filteredAddUsers.map((user) => {
                  const currentDept = departments.find((d) => d.id === user.departmentId);
                  return (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-[12px] font-bold text-white">
                        {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-text-primary">{user.name}</p>
                        <p className="text-[11px] text-text-muted">
                          {roleLabels[user.role]}
                          {currentDept ? ` · currently in ${currentDept.name}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddUserToDept(user.id)}
                        className="flex items-center gap-1 rounded-button bg-brand-primary px-3 py-1 text-[12px] font-medium text-white hover:bg-brand-primary-hover"
                      >
                        <UserPlus size={12} />
                        Add
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t border-border px-4 py-3 text-right">
              <button onClick={() => setShowAddUserModal(false)}
                className="rounded-button border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-gray-50">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
