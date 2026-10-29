import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brain Training Quiz",
  description: "Five-question mind workouts with private synced progress.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
