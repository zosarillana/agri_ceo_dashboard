// components/SignInModal.tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import { getDashboardRouteByRole } from "@/lib/auth.guard";
import { toast } from "sonner";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);

      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error("User not found after login");
      }

      onOpenChange(false);

      navigate({
        to: getDashboardRouteByRole(user.role),
      });

      // 👇 fire AFTER navigation so Toaster is still mounted on the new page
      setTimeout(() => {
        toast.success(`Welcome back, ${user.name}! 👋`, {
          description: "You have successfully signed in.",
          duration: 4000,
        });
      }, 100);
    } catch (err: any) {
      console.error(err);
      toast.error("Login failed", {
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Please check your credentials and try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a9e6e] to-[#1a9e6e]/40" />

            <div className="p-6">
              <DialogHeader className="mb-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#1a9e6e] to-[#1a9e6e]/70 bg-clip-text text-transparent">
                    Welcome back
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-2">
                    Sign in to your Agri Exim Global Inc. - CEO Daily Operations
                    Dashboard account
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all focus:ring-[#1a9e6e]"
                  />
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all focus:ring-[#1a9e6e]"
                  />
                </motion.div>

                {/* Options */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between text-sm"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
          
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-[#1a9e6e] hover:bg-[#1a9e6e]/90 text-white"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </motion.div>

                {/* Footer */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex text-center text-sm text-muted-foreground mt-4"
                >
                  Don't have an account? {" "}
                  <span                  
                    className="ml-1 text-[#1a9e6e] font-medium"
                  >
                    Contact Admin.
                  </span>
                </motion.p>
              </form>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
