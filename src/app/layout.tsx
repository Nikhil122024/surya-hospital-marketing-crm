import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = { title: "Surya Hospital Marketing CRM", description: "Internal Marketing Operations Portal - Surya Hospital", manifest: "/manifest.json", icons: { icon: "/images/surya.jpg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }
