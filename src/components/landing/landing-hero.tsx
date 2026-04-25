import { useNavigate } from "@tanstack/react-router";

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section
      id="hero-section"
      className="flex flex-col items-center text-center px-8 pt-16 pb-24 max-w-3xl mx-auto"
    >
      <div className="inline-flex items-center gap-2 bg-muted border border-border rounded-full px-4 py-1 text-xs text-muted-foreground mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1a9e6e]" />
        Built for agriculture leaders
      </div>

      <h1 className="text-5xl font-medium leading-tight tracking-tight text-foreground mb-5">
        Your farm.
        <br />
        Your data.
        <br />
        <span className="text-[#1a9e6e]">Your decisions.</span>
      </h1>

      <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mb-8">
        A modern CEO dashboard for agricultural operations. Track yields, manage
        resources, and make smarter decisions — all in one place.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/" })}
          className="bg-foreground text-background text-sm font-medium px-6 py-2.5 rounded-md hover:opacity-80 transition-opacity"
        >
          Get started
        </button>
        <button className="text-sm text-muted-foreground px-5 py-2.5 rounded-md hover:bg-muted hover:text-foreground transition-all">
          See how it works →
        </button>
      </div>
    </section>
  );
}
