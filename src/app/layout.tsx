import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import QueryProviders from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { CartProvider } from "@/providers/CartProvider";
import { WishlistProvider } from "@/providers/WishlistProvider";
import { Toaster } from "@/components/ui/sonner";
import FloatingChatbot from "@/components/modules/Chatbot/FloatingChatbot";
import SmoothScroll from "@/components/shared/SmoothScroll";
import Preloader from "@/components/shared/Preloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Browser UI (mobile address bar) in the brand colours
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#013a71" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1626" },
  ],
};

export const metadata: Metadata = {
  title: "AB TRIMS - Your Reliable Partner For Garment Compliance, Testing Solutions & Services in Bangladesh.",
  description: "Your one-stop solution for all your Garment Compliance, Testing Solutions & Services needs in Bangladesh.",
  icons: {
    icon: "/favicon.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Preloader />
          <QueryProviders>
            <CartProvider>
              <WishlistProvider>
                <SmoothScroll>
                  {children}
                  <FloatingChatbot />
                  <Toaster richColors position="top-right" />
                </SmoothScroll>
              </WishlistProvider>
            </CartProvider>
          </QueryProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}

