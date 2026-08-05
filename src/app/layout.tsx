import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/index.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Solar System Journey",
  description:
    "Fly the Sun to the last planet at true spacing, then meet each world up close: what it is, how big, how far, and the pictures we have of it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
