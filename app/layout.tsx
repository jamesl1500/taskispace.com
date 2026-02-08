"use client";

import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Header from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import QueryProvider from "@/components/providers/QueryProvider";
import Toolbox from "@/components/layout/Toolbox";

import { useAuthWithProfile } from '@/hooks/useAuth'

import "./globals.css";

// Global Styles
import "@/styles/styles.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile, loading } = useAuthWithProfile()

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <div className="flex-1 flex flex-col w-full">
              <Header />
              <main className="flex-1 pt-[70px]">
                {children}

                {user && profile && !loading && (
                  <Toolbox />
                )}
              </main>
            </div>
          </SidebarProvider>
        </QueryProvider>
      </body>
    </html>
  );
}