import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production" || !gaId) {
    return null;
  }

  return <NextGoogleAnalytics gaId={gaId} />;
}
