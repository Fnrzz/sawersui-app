import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
  display: "swap",
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-pixel-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SawerSui",
  description: "Web3 Donation Platform on Sui",
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
      <body
        className={`${pressStart.variable} ${vt323.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster 
          position="top-center" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-pixel-body)',
            },
          }}
        />
      </body>
    </html>
  );
}
