import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Header from "@/components/layout/Header";
import QueryProvider from "@/components/providers/QueryProvider";

// @ts-expect-error: allow global CSS side-effect import without module declarations
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskiSpace - Organize your tasks, manage your workspaces",
  description: "A powerful todo list application with workspace management. Stay organized and boost your productivity with TaskiSpace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <div className="header-container">
            <Header />
          </div>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
