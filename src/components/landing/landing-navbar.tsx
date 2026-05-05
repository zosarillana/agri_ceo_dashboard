import { useState } from "react";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { motion } from "framer-motion";
import { SignInModal } from "@/components/authentication/sign-in";

export function LandingNavbar() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const handleFeaturesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAboutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const aboutSection = document.getElementById("about-section");
    if (aboutSection) {
      const offset = 180;
      const elementPosition = aboutSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

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
            className="w-7 h-7 bg-[#1a9e6e] rounded-md flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2C5.5 2 3.5 4 3.5 6.5C3.5 9 5.5 11 8 11C10.5 11 12.5 9 12.5 6.5C12.5 4 10.5 2 8 2Z"
                fill="white"
                opacity="0.9"
              />
              <path
                d="M8 11V14M5 14H11"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          <span className="text-sm font-medium">Agriexim Global Inc</span>
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