import type { Metadata } from "next";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

// Flower icon as favicon
const flowerIconUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/2d798a37-c66d-4915-a56f-7cda10a6f3cd/generated_images/simple-minimalist-flower-icon-with-8-pet-a2755c74-20251202154253.jpg"

export const metadata: Metadata = {
  title: "PetalMind - Advanced AI Chat Interface",
  description: "Experience the next generation of AI with PetalMind. Fast, secure, and intelligent chat with custom AI modes, PWA support, and advanced privacy features.",
  keywords: ["AI", "Chatbot", "Artificial Intelligence", "Next.js", "PWA", "PetalMind", "Secure AI"],
  authors: [{ name: "PetalMind Team" }],
  creator: "PetalMind",
  publisher: "PetalMind",
  applicationName: "PetalMind",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PetalMind",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: flowerIconUrl },
    { rel: "icon", type: "image/png", sizes: "32x32", url: flowerIconUrl },
    { rel: "icon", type: "image/png", sizes: "192x192", url: flowerIconUrl },
    { rel: "icon", type: "image/png", sizes: "512x512", url: flowerIconUrl },
    { rel: "apple-touch-icon", sizes: "180x180", url: flowerIconUrl },
    { rel: "shortcut icon", url: flowerIconUrl },
  ],
  openGraph: {
    images: [flowerIconUrl],
  },
  twitter: {
    images: [flowerIconUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="c1fd0b23-575e-44d8-89c6-02a48bb959f2"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}