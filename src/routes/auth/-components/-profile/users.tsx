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
} from "lucide-react";

import { toast } from "sonner";
import { registerUser } from "@/services/auth.service";
import {
  AdminUser,
  getUsers,
  adminUpdateUser,
  adminDeleteUser,
} from "@/services/adminuser.service";

const DEPARTMENTS = [
  { id: "production", label: "Production" },
  { id: "procurement", label: "Procurement" },
  { id: "sales", label: "Sales" },
  { id: "accounts", label: "Accounts" },
  { id: "trading", label: "Trading" },
  { id: "qc", label: "Quality Control" },
  { id: "workforce", label: "Workforce" },
  { id: "maintenance", label: "Maintenance" },
  { id: "energy", label: "Energy" },
];

const getDeptLabel = (id: string | null) =>
  DEPARTMENTS.find((d) => d.id === id)?.label ?? id ?? "—";

export function Users() {
  // ─── Register form ─────────────────────────────────────────
  const [regLoading, setRegLoading] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  // ─── Table ─────────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ─── Edit dialog ───────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    name: "",
    email: "",
    department: "",
    password: "",
    password_confirmation: "",
  });

  // ─── Delete dialog ─────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // ─── Fetch users on mount ──────────────────────────────────
  const fetchUsers = async () => {
    setTableLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to load users.");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ─── Register ──────────────────────────────────────────────
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
      setRegForm({ name: "", email: "", password: "", department: "" });
      // Refresh table so new user appears
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to register user.");
    } finally {
      setRegLoading(false);
    }
  };

  // ─── Open edit ─────────────────────────────────────────────
  const openEdit = (user: AdminUser) => {
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department ?? "",
      password: "",
      password_confirmation: "",
    });
    setEditOpen(true);
  };

  // ─── Submit edit ───────────────────────────────────────────
  const handleEdit = async () => {
    if (!editForm.name || !editForm.email) {
      toast.error("Name and email are required.");
      return;
    }
    if (
      editForm.password &&
      editForm.password !== editForm.password_confirmation
    ) {
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
        department: editForm.department,
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

  // ─── Open delete ───────────────────────────────────────────
  const openDelete = (user: AdminUser) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  // ─── Confirm delete ────────────────────────────────────────
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

  // ─── Filter ────────────────────────────────────────────────
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Render ────────────────────────────────────────────────
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
              onChange={(e) =>
                setRegForm((p) => ({ ...p, name: e.target.value }))
              }
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
              onChange={(e) =>
                setRegForm((p) => ({ ...p, email: e.target.value }))
              }
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
              onChange={(e) =>
                setRegForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5 w-full">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Department
            </Label>

            <Select
              value={regForm.department}
              onValueChange={(v) =>
                setRegForm((p) => ({ ...p, department: v }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>

              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
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
              {/* Search */}
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="pl-8"
                />
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="icon"
                onClick={fetchUsers}
                disabled={tableLoading}
                title="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${tableLoading ? "animate-spin" : ""}`}
                />
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
                  <TableHead>Department</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right w-[90px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tableLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-10 text-sm"
                    >
                      {users.length === 0
                        ? "No users found."
                        : "No users match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>{getDeptLabel(user.department)}</TableCell>
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
              {filtered.length} of {users.length} user
              {users.length !== 1 ? "s" : ""}
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
              <span className="font-medium text-foreground">
                {editForm.name}
              </span>
              . Leave password blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Full Name
              </Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Department
              </Label>
              <Select
                value={editForm.department}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, department: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> New Password
                <span className="ml-1 text-muted-foreground/60">
                  (optional)
                </span>
              </Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, password: e.target.value }))
                }
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
                    setEditForm((p) => ({
                      ...p,
                      password_confirmation: e.target.value,
                    }))
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

      {/* ── Delete Confirmation Dialog ─────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
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
