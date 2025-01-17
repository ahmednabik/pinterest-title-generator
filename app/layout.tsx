import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className}`}>
        {children}
        <Toaster
          expand={true}
          position="top-center"
          richColors
          duration={6000}
          visibleToasts={3} // Limit the number of visible toasts at a time
        />
      </body>
    </html>
  );
}
