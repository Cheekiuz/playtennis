import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import TennisBallPreload from "@/components/TennisBallPreload";
import { ThemeScript } from "@/components/ThemeScript";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";
import { defaultLocale, getMessages, isValidLocale, type Locale } from "@/lib/i18n";

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
      images: [{ url: "/tennis-ball-sprite.png", width: 512, height: 512, alt: "Tennis ball" }],
    },
    twitter: {
      card: "summary",
      title: m.meta.title,
      description: m.meta.description,
      images: ["/tennis-ball-sprite.png"],
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
        <link rel="preload" href="/tennis-ball-sprite.png" as="image" />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <ThemeProvider>
          <TennisBallPreload />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
