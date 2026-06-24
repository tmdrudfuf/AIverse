import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI City",
  description: "A visual workspace for an AI-native company",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
