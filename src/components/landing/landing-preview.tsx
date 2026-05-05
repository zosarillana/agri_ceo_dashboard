import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function LandingPreview() {
  const bars = [40, 65, 50, 80, 60, 90, 70];
  const aboutRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(aboutRef, { once: true, amount: 0.3 });

  return (
    <div className="flex items-stretch gap-0 max-w-6xl mx-auto">
      {/* Main Card */}
      <div className="flex-1 border border-border rounded-xl overflow-hidden bg-muted shadow-lg">
        {/* Browser bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-background">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-xs text-muted-foreground font-medium">
            Agri Exim Global Inc. - CEO Daily Operations Dashboard
          </span>
        </div>

        {/* Skeleton Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Stat cards */}
            <div className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="h-2.5 w-1/2 bg-border rounded mb-3 animate-pulse" />
              <div className="h-6 w-2/3 bg-[#1a9e6e33] rounded mb-2" />
              <div className="h-2 w-2/5 bg-border rounded" />
            </div>
            
            <div className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="h-2.5 w-1/2 bg-border rounded mb-3 animate-pulse" />
              <div className="h-6 w-2/3 bg-border rounded mb-2" />
              <div className="h-2 w-2/5 bg-border rounded" />
            </div>

            {/* Chart skeleton */}
            <div className="col-span-2 bg-background border border-border rounded-lg p-4">
              <div className="h-2.5 w-1/4 bg-border rounded mb-5 animate-pulse" />
              <div className="flex items-end gap-2 h-20">
                {bars.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex-1 rounded-sm"
                    style={{
                      background: `rgba(26,158,110,${0.3 + (h / 90) * 0.5})`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div
        id="about-section"
        ref={aboutRef}
        className="w-[35%] ml-2 bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border overflow-hidden shadow-lg scroll-mt-20"
      >
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Decorative line */}
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: 48 } : { width: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-1 bg-[#1a9e6e] rounded-full mb-6"
            />
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#1a9e6e] to-[#1a9e6e]/60 bg-clip-text text-transparent"
            >
              About Agriexim Global Inc
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                Agriexim Global Inc is a pioneering force in agricultural trade technology,
                dedicated to streamlining global food supply chains. Our platform
                combines cutting-edge analytics with real-time market insights to
                empower growers, distributors, and buyers worldwide.
              </p>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                With a focus on transparency and efficiency, we're building the
                infrastructure that makes international agricultural trade faster,
                smarter, and more sustainable for everyone involved.
              </p>
            </motion.div>

            {/* Optional subtle CTA */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ x: 5 }}
              className="mt-6 text-sm font-medium text-[#1a9e6e] hover:text-[#1a9e6e]/80 transition-colors inline-flex items-center gap-1"
            >
              Learn more
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}