import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans-var",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SawerSui — Web3 Donation Platform",
  description:
    "Dukung kreator favoritmu dengan crypto di Sui Network. Low fees, instant overlay, easy login.",
  icons: {
    icon: "/logo2.webp",
    apple: "/logo2.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans-var)",
            },
          }}
        />
      </body>
    </html>
  );
}
