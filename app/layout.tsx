import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Balance Compartido",
  description:
    "App para parejas que desean manejar ingresos, gastos, deudas y metas en un solo dashboard colaborativo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen overflow-x-hidden font-sans antialiased text-[hsl(var(--foreground))]`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
