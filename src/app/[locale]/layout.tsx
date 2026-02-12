import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../providers";
import { Toaster } from "sonner";
import "../globals.css";

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

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
