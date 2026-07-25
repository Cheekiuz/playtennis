import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ThemeScript } from "@/components/ThemeScript";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";
import { defaultLocale, getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { BALL_IMAGE_SRC, BALL_OG_IMAGE_SRC } from "@/lib/tennis-ball-assets";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

async function getLocale(): Promise<Locale> {
  const headersList = await headers();
  const locale = headersList.get("x-locale") ?? defaultLocale;
  return isValidLocale(locale) ? locale : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = getMessages(locale);
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: {
      title: m.meta.title,
      description: m.meta.description,
      images: [{ url: BALL_OG_IMAGE_SRC, width: 512, height: 512, alt: "Tennis ball" }],
    },
    twitter: {
      card: "summary",
      title: m.meta.title,
      description: m.meta.description,
      images: [BALL_OG_IMAGE_SRC],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preload" href={BALL_IMAGE_SRC} as="image" type="image/webp" />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
