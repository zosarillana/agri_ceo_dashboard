// components/global/Navbar.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Moon, Sun, type LucideProps } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import Logo from "@/assets/suminter-logo-nbg.svg?react";
import { useAuthStore } from "@/store/auth.store";

// Define types for navigation items
type LandingNavItem = {
  label: string;
  sectionId: string;
};

type DashboardNavItem = {
  label: string;
  path: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
};

type NavItem = LandingNavItem | DashboardNavItem;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function GlobalNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();

  // remove the hardcoded defaults, use store values:
  const userName = user?.name ?? "Guest";
  const userEmail = user?.email ?? "";
  const userAvatar = user?.avatar ?? undefined;

  const handleSignOut = async () => {
    try {
      await logout();

      // optional: clear any local auth state
      // e.g. zustand / redux / context
      // authStore.setState({ user: null, isAuthenticated: false });

      navigate({ to: "/" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate({ to: path as any });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isDashboardPage = location.pathname.startsWith("/dashboard");

  const handleScrollToSection = (sectionId: string, offset: number = 180) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsMobileMenuOpen(false);
  };

  const landingNavItems: LandingNavItem[] = [
    // { label: "About", sectionId: "about-section" },
    // { label: "Features", sectionId: "features" },
  ];

  const dashboardNavItems: DashboardNavItem[] = [
    {
      label: "Dashboard",
      path: "/auth/admin/dashboard",
      icon: LayoutDashboard,
    },
  ];

  const navItems: NavItem[] = isDashboardPage
    ? dashboardNavItems
    : landingNavItems;

  // Type guard functions
  const isDashboardNavItem = (item: NavItem): item is DashboardNavItem => {
    return "path" in item;
  };

  const isLandingNavItem = (item: NavItem): item is LandingNavItem => {
    return "sectionId" in item;
  };

  return (
    <>
      <motion.nav
        // initial={{ y: -100 }}
        // animate={{ y: 0 }}
        // transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
        className="flex items-center justify-between px-4 md:px-10 py-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <a
            href="#about-section"
            className="flex items-center gap-2 cursor-pointer"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 bg-[#1a9e6e] rounded-md flex items-center justify-center"
            >
              <Logo className="h-6 w-auto text-foreground" />
            </motion.div>
            <span className="text-md font-medium">
              Agri Exim Global Inc. - CEO Daily Operations Dashboard
            </span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.label}>
                  {isDashboardNavItem(item) ? (
                    <NavigationMenuLink
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${
                        location.pathname === item.path
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => handleNavigate(item.path)}
                    >
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      {item.label}
                    </NavigationMenuLink>
                  ) : (
                    isLandingNavItem(item) && (
                      <NavigationMenuLink
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        onClick={() => handleScrollToSection(item.sectionId)}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    )
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side - Theme toggle and Profile/Auth buttons */}
        <div className="flex items-center gap-3">
          <ModeToggle />

          {isAuthenticated ? (
            <>
              {/* Desktop Profile Dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-auto gap-2 px-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback className="bg-[#1a9e6e] text-white text-xs">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline-flex text-sm font-medium">
                        {userName}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {userName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleNavigate("/auth/admin/profile/")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleNavigate("/auth/admin/profile/settings/")
                      }
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Avatar */}
              <div className="md:hidden">
                <Avatar
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => handleNavigate("/dashboard/profile")}
                >
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-[#1a9e6e] text-white text-xs">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </>
          ) : (
            <Button
              onClick={() => handleNavigate("/signin")}
              className="bg-foreground text-background hover:opacity-80 transition-opacity"
            >
              Sign in
            </Button>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </motion.nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden fixed top-[57px] left-0 right-0 bg-background border-b border-border z-40 py-4 px-6"
        >
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="cursor-pointer"
                onClick={() => {
                  if (isDashboardNavItem(item)) {
                    handleNavigate(item.path);
                  } else if (isLandingNavItem(item)) {
                    handleScrollToSection(item.sectionId);
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                <span
                  className={`text-sm font-medium ${
                    isDashboardNavItem(item) && location.pathname === item.path
                      ? "text-[#1a9e6e]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
            {isAuthenticated && (
              <>
                <div className="pt-2 border-t border-border">
                  <div
                    className="cursor-pointer py-2"
                    onClick={() => {
                      handleNavigate("/dashboard/profile");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="text-sm text-muted-foreground">
                      Profile
                    </span>
                  </div>
                  <div
                    className="cursor-pointer py-2"
                    onClick={() => {
                      handleNavigate("/dashboard/settings");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="text-sm text-muted-foreground">
                      Settings
                    </span>
                  </div>
                  <div
                    className="cursor-pointer py-2"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="text-sm text-red-600">Sign out</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
