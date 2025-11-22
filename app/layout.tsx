import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Header from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import QueryProvider from "@/components/providers/QueryProvider";

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
          <SidebarProvider>
            <AppSidebar />
            <div className="flex-1 flex flex-col w-full">
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </SidebarProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
