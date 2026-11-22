import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trilho",
  description: "Shared job-application tracker for FEUP master's students",
};

// Runs before first paint (no flash of the wrong theme): the saved choice, else the system setting.
// Keep the storage key in sync with THEME_STORAGE_KEY in components/theme-toggle.tsx.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-fg">
        <header className="border-b border-border-subtle bg-surface-header">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <Link
              href="/"
              className="rounded font-serif text-2xl font-semibold text-brand focus:outline-2 focus:outline-offset-2 focus:outline-focus"
            >
              Trilho
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <Suspense fallback={null}>
                <Nav />
              </Suspense>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
