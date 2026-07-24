import TennisBallScene from "@/components/TennisBallScene";
import WaitlistForm from "@/components/WaitlistForm";

const stats = [
  { value: "840+", label: "Players Waiting" },
  { value: "124", label: "Courts Indexed", glow: true },
  { value: "12", label: "Cities Supported" },
];

const navLinks = ["Experience", "Benefits", "The Court"];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="center-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="center-line" aria-hidden="true" />
      <TennisBallScene />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight text-white">PlayTennis.it</span>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(" ", "-")}`}
              className="text-sm text-white/90 transition-colors hover:text-white"
            >
              {link}
            </a>
          ))}
        </nav>
        <a
          href="#waitlist"
          className="btn-glow rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-[#d4ff33]"
        >
          Join Waitlist
        </a>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pb-8">
        <section className="flex max-w-3xl flex-col items-center pt-12 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
              Launching Q4 2024
            </span>
          </div>

          <h1 className="text-4xl leading-tight font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Something exciting is coming to{" "}
            <span className="text-accent">Lithuanian tennis.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            A smarter way to find tennis partners, organize matches, track results, and discover
            courts—all in one place.
          </p>
        </section>

        <section id="waitlist" className="mt-14 flex w-full justify-center">
          <WaitlistForm />
        </section>

        <section className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-4 sm:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="relative flex flex-col items-center py-4">
              {stat.glow && (
                <div
                  className="stat-glow absolute inset-0 -z-10 rounded-full"
                  aria-hidden="true"
                />
              )}
              <span className="text-3xl font-bold text-accent sm:text-4xl">{stat.value}</span>
              <span className="mt-1 text-[10px] font-medium tracking-widest text-white/80 uppercase sm:text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </section>

        <p className="mt-16 text-sm text-slate-500 italic">Tidying up the racket strings...</p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <span className="font-mono text-xs text-slate-400">⌨</span>
          <span className="font-mono text-xs text-slate-400">
            Pro Tip: Press{" "}
            <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-white">
              T
            </kbd>{" "}
            to launch tennis balls into the 3D scene.
          </span>
        </div>
      </main>

      <footer className="relative z-10 mt-20 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <span className="text-sm font-bold text-white">PlayTennis.it</span>
          <p className="font-mono text-xs text-slate-500">
            © 2024 PlayTennis.lt. Precision in every serve.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-slate-500 transition-colors hover:text-slate-300"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
