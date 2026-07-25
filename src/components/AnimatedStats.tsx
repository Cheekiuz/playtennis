interface AnimatedStatsProps {
  tagline: string;
}

export default function AnimatedStats({ tagline }: AnimatedStatsProps) {
  return (
    <section className="mt-16 w-full max-w-2xl text-center">
      <p className="text-lg font-semibold leading-relaxed text-foreground/90 sm:text-xl [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
        {tagline}
      </p>
    </section>
  );
}
