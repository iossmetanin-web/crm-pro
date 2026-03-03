"use client";

import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppLayout } from "@/components/layout/app-layout";

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppLayout>{children}</AppLayout>
      </ThemeProvider>
    </SessionProvider>
  );
}
