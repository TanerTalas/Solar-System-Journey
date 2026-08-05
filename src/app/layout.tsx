import type { Metadata, Viewport } from "next";
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

const title = "Solar System Journey";
const description =
  "Fly the Sun to the last planet at true spacing, then meet each world up close: what it is, how big, how far, and the pictures we have of it.";

export const metadata: Metadata = {
  // share cards need absolute URLs; set the deploy host here
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: title, template: "%s" },
  description,
  applicationName: title,
  // icon, apple-icon, opengraph-image and twitter-image are picked up from
  // the files next to this one
  openGraph: { title, description, siteName: title, type: "website", locale: "en" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#05060c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
