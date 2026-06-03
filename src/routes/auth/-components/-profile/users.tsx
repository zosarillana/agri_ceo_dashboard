import { useState, useEffect } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Loader2,
  Save,
  User,
  Mail,
  Lock,
  Building2,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { toast } from "sonner";
import { registerUser } from "@/services/auth.service";
import {
  AdminUser,
  AdminUserDepartment,
  adminUpdateUser,
  adminDeleteUser,
} from "@/services/adminuser.service";
import { useDepartmentStore } from "@/store/department.store";
import { useUserStore } from "@/store/user.store";

// ─── Helpers ───────────────────────────────────────────────────────────────

const ROLES = [
  { id: "superadmin", label: "Super Admin" },
  { id: "admin",      label: "Admin" },
  { id: "user",       label: "User" },
];

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-700 border-purple-200",
  admin:      "bg-blue-100 text-blue-700 border-blue-200",
  user:       "bg-gray-100 text-gray-600 border-gray-200",
};

function RoleBadge({ role }: { role: string | null }) {
  const r = role ?? "user";
  const label = ROLES.find((x) => x.id === r)?.label ?? r;
  const cls = ROLE_BADGE[r] ?? ROLE_BADGE.user;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function deptNames(departments: AdminUserDepartment[] | undefined): string {
  if (!departments?.length) return "—";
  return departments.map((d) => d.name).join(", ");
}

// ─── Department multi-checkbox picker ──────────────────────────────────────

function DepartmentPicker({
  departments,
  selected,
  onChange,
}: {
  departments: AdminUserDepartment[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const toggle = (id: number) => {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  };

  if (!departments.length) {
    return (
      <p className="text-xs text-muted-foreground">No departments available.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
      {departments.map((d) => (
        <label
          key={d.id}
          className="flex items-center gap-2 text-sm cursor-pointer select-none"
        >
          <Checkbox
            checked={selected.includes(d.id)}
            onCheckedChange={() => toggle(d.id)}
          />
          {d.name}
        </label>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function Users() {

  // ── Departments from store ──────────────────────────────────────────────
  const { departments, fetchDepartments } = useDepartmentStore();

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // ── Register form ───────────────────────────────────────────────────────
  const [regLoading, setRegLoading] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    department_ids: [] as number[],
    role: "user",
  });

  // ── Table ───────────────────────────────────────────────────────────────
  const { users, loading: tableLoading, fetchUsers, setUsers } = useUserStore();
  const [search, setSearch] = useState("");

  // ── Edit dialog ─────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    name: "",
    email: "",
    department_ids: [] as number[],
    role: "user",
    password: "",
    password_confirmation: "",
  });

  // ── Delete dialog ───────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // ── Fetch users ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Register ────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!regForm.name || !regForm.email || !regForm.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (regForm.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setRegLoading(true);
    try {
      await registerUser(regForm);
      toast.success("User registered successfully.");
      setRegForm({ name: "", email: "", password: "", department_ids: [], role: "user" });
      await fetchUsers(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to register user.");
    } finally {
      setRegLoading(false);
    }
  };

  // ── Open edit ───────────────────────────────────────────────────────────
  const openEdit = (user: AdminUser) => {
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      department_ids: (user.departments ?? []).map((d) => d.id),
      role: user.role ?? "user",
      password: "",
      password_confirmation: "",
    });
    setEditOpen(true);
  };

  // ── Submit edit ─────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editForm.name || !editForm.email) {
      toast.error("Name and email are required.");
      return;
    }
    if (editForm.password && editForm.password !== editForm.password_confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setEditLoading(true);
    try {
      const payload = {
        id: editForm.id,
        name: editForm.name,
        email: editForm.email,
        department_ids: editForm.department_ids,
        role: editForm.role,
        ...(editForm.password
          ? {
              password: editForm.password,
              password_confirmation: editForm.password_confirmation,
            }
          : {}),
      };

      const updated = await adminUpdateUser(payload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success("User updated successfully.");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update user.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Open / confirm delete ───────────────────────────────────────────────
  const openDelete = (user: AdminUser) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDeleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success("User deleted.");
      setDeleteOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to delete user.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.departments ?? [])
        .map((d) => d.name.toLowerCase())
        .some((n) => n.includes(search.toLowerCase()))
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Registration Form ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>Register a new user account.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Full Name
            </Label>
            <Input
              value={regForm.name}
              onChange={(e) => setRegForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </Label>
            <Input
              type="email"
              value={regForm.email}
              onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Password
            </Label>
            <Input
              type="password"
              value={regForm.password}
              onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Departments
            </Label>
            <DepartmentPicker
              departments={departments}
              selected={regForm.department_ids}
              onChange={(ids) => setRegForm((p) => ({ ...p, department_ids: ids }))}
            />
          </div>

          <div className="space-y-1.5 w-full">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Role
            </Label>
            <Select
              value={regForm.role}
              onValueChange={(v) => setRegForm((p) => ({ ...p, role: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleRegister}
              disabled={regLoading}
              className="bg-[#1a9e6e] hover:bg-[#158a5e] text-white gap-2"
            >
              {regLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Register User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Users Table ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage all user accounts.</CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
            onClick={() => fetchUsers(true)}
                disabled={tableLoading}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${tableLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Departments</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right w-[90px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tableLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-10 text-sm"
                    >
                      {users.length === 0 ? "No users found." : "No users match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm">{deptNames(user.departments)}</TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(user)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDelete(user)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!tableLoading && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Dialog ───────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update details for{" "}
              <span className="font-medium text-foreground">{editForm.name}</span>.
              Leave password blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Full Name
              </Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Departments
              </Label>
              <DepartmentPicker
                departments={departments}
                selected={editForm.department_ids}
                onChange={(ids) => setEditForm((p) => ({ ...p, department_ids: ids }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Role
              </Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> New Password
                <span className="ml-1 text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            {editForm.password && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Confirm Password
                </Label>
                <Input
                  type="password"
                  value={editForm.password_confirmation}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, password_confirmation: e.target.value }))
                  }
                  placeholder="••••••••"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editLoading}
              className="bg-[#1a9e6e] hover:bg-[#158a5e] text-white gap-2"
            >
              {editLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="gap-2"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}