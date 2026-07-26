import { EyeIcon } from "@/components/EyeWatchingIllustration";

interface WatchingSuccessProps {
  title: string;
  subtitle: string;
}

export default function WatchingSuccess({ title, subtitle }: WatchingSuccessProps) {
  return (
    <div className="card-glow success-pop glass-card w-full rounded-3xl border border-accent/30 bg-card/95 p-8 text-center backdrop-blur-md">
      <div className="flex justify-center">
        <EyeIcon className="watching-pulse h-14 w-14 text-accent" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}
