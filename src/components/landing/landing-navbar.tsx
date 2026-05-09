import { useState } from "react";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { motion } from "framer-motion";
import { SignInModal } from "@/components/authentication/sign-in";
import Logo from "@/assets/suminter-logo-nbg.svg?react";

export function LandingNavbar() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const heroSection = document.getElementById("hero-section");
    if (heroSection) {
      const offset = 180;
      const elementPosition = heroSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleSignInClick = () => {
    setIsSignInOpen(true);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="flex items-center justify-between px-10 py-4 border-b border-border sticky top-0 bg-background z-50"
      >
        <a
          href="#about-section"
          onClick={handleLogoClick}
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

        <div className="flex items-center gap-6">
          {/* <a
            href="#about-section"
            onClick={handleAboutClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </a>
          <a
            href="#features"
            onClick={handleFeaturesClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a> */}
          <ModeToggle />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignInClick}
            className="bg-foreground text-background text-sm font-medium px-4 py-2 rounded-md hover:opacity-80 transition-opacity"
          >
            Sign in
          </motion.button>
        </div>
      </motion.nav>

      <SignInModal open={isSignInOpen} onOpenChange={setIsSignInOpen} />
    </>
  );
}
