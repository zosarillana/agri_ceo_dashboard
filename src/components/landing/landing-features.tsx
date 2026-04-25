const features = [
  {
    icon: '🌾',
    title: 'Yield tracking',
    description: 'Monitor crop performance across all your fields in real time.',
  },
  {
    icon: '📊',
    title: 'Financial overview',
    description: 'Revenue, costs, and margins at a glance — no spreadsheets needed.',
  },
  {
    icon: '🌦',
    title: 'Weather insights',
    description: 'Integrated forecasts tied directly to your farm locations.',
  },
  {
    icon: '👥',
    title: 'Team management',
    description: 'Assign tasks, track labor, and manage your workforce efficiently.',
  },
  {
    icon: '📦',
    title: 'Inventory control',
    description: 'Seeds, fertilizers, equipment — always know what you have.',
  },
  {
    icon: '📈',
    title: 'Reports & exports',
    description: 'Generate reports for stakeholders with one click.',
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="px-10 py-24 max-w-5xl mx-auto">
      <p className="text-xs font-medium tracking-widest uppercase text-[#1a9e6e] mb-1">
        Features
      </p>
      <h2 className="text-3xl font-medium text-foreground tracking-tight mb-1">
        Everything a farm CEO needs
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        Designed for clarity. Built for scale.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-background border border-border rounded-xl p-5 hover:border-foreground/20 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1a9e6e18] flex items-center justify-center text-base mb-3">
              {f.icon}
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1.5">
              {f.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}