const features = [
  {
    title: "Find Players",
    description: "Connect with tennis partners at your skill level, nearby and ready to play.",
  },
  {
    title: "Book Courts",
    description: "Discover and reserve courts at local clubs and public facilities.",
  },
  {
    title: "Track Scores",
    description: "Log match results and watch your stats improve over time.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-emerald-700">PlayTennis</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Coming soon
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Find your next tennis match
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
            PlayTennis helps you find partners, book courts, and track your game — all in one
            place.
          </p>
          <button
            type="button"
            className="mt-10 rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Get notified at launch
          </button>
        </section>

        <section className="border-t border-zinc-200 bg-zinc-50 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-semibold text-zinc-900">
              Everything you need to play more tennis
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="relative rounded-2xl border border-zinc-200 bg-white p-6 opacity-75"
                >
                  <span className="absolute right-4 top-4 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                    Coming soon
                  </span>
                  <h3 className="text-lg font-semibold text-zinc-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="text-sm font-semibold text-emerald-700">PlayTennis</span>
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} PlayTennis. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
