import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { updateUser } from "@/services/user.service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { User, Mail, Building2, Lock, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner"; // or your preferred toast lib

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Settings() {
  const { user, setUser } = useAuthStore();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    department: user?.department ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!user) return null;

  // ── PROFILE UPDATE ──────────────────────────────────────────────
  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const res = await updateUser({
        name: profileForm.name,
        email: profileForm.email,
        department: profileForm.department,
      });
      setUser(res.user);
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to update profile.";
      toast.error(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  // ── PASSWORD UPDATE ─────────────────────────────────────────────
  const handlePasswordSave = async () => {
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordForm.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      await updateUser({
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      });
      setPasswordForm({ password: "", password_confirmation: "" });
      toast.success("Password changed successfully.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to change password.";
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-6">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-[#1a9e6e] to-[#1a9e6e]/40 -mt-4" />
          <CardContent className="pt-0 pb-6 px-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                <AvatarFallback className="bg-[#1a9e6e] text-white text-2xl font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="mb-1">
                <h2 className="text-xl font-bold leading-tight">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="capitalize text-xs font-medium">
              {user.role}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── PROFILE INFO ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
            <CardDescription className="text-xs">
              Update your name, email address, and department.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Full Name
              </Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>

            <Separator />

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>

            <Separator />

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="department" className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Department
              </Label>
              <Input
                disabled
                id="department"
                value={profileForm.department}
                onChange={(e) => setProfileForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="e.g. Engineering"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleProfileSave}
                disabled={profileLoading}
                className="bg-[#1a9e6e] hover:bg-[#158a5e] text-white gap-2"
              >
                {profileLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Save className="h-4 w-4" />
                }
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── CHANGE PASSWORD ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Change Password</CardTitle>
            <CardDescription className="text-xs">
              Choose a strong password with at least 6 characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Separator />

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation" className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  type={showConfirm ? "text" : "password"}
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, password_confirmation: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Match indicator */}
            {passwordForm.password_confirmation && (
              <p className={`text-xs ${
                passwordForm.password === passwordForm.password_confirmation
                  ? "text-emerald-500"
                  : "text-destructive"
              }`}>
                {passwordForm.password === passwordForm.password_confirmation
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handlePasswordSave}
                disabled={passwordLoading || !passwordForm.password}
                className="bg-[#1a9e6e] hover:bg-[#158a5e] text-white gap-2"
              >
                {passwordLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Save className="h-4 w-4" />
                }
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}