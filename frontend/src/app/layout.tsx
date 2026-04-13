import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Control Tower | Volunteer Coordination",
  description: "Intelligent volunteer coordination and logistics dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${GeistSans.variable} ${dmSans.variable}`}>
      <body className="h-full flex font-sans bg-slate-50">
        <NavBar />
        <div className="flex-1 flex flex-col min-h-screen overflow-auto">{children}</div>
      </body>
    </html>
  );
}
