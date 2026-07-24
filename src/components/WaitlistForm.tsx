"use client";

export default function WaitlistForm() {
  return (
    <form
      className="card-glow w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-md"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2 className="text-xl font-semibold text-white">Reserve your court position</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Be among the first players invited to our exclusive beta launch.
      </p>

      <div className="mt-6 space-y-3">
        <input
          type="email"
          placeholder="Enter your email address"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
          required
        />
        <button
          type="submit"
          className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-black transition-all hover:bg-[#d4ff33]"
        >
          <span>🎾</span>
          Join the Waitlist
          <span>→</span>
        </button>
      </div>

      <p className="mt-4 text-center text-[10px] font-medium tracking-widest text-slate-500 uppercase">
        No spam. Just straight sets to your inbox.
      </p>
    </form>
  );
}
