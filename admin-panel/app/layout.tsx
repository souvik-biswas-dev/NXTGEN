import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NxtGenProperties Admin",
  description: "Admin panel for NxtGenProperties real estate platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0a0f] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
