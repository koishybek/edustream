import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduStream Admin",
  description: "EduStream — course & content administration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Golos Text (display) + Manrope (body): both cover Cyrillic incl.
            Kazakh, shared with the mobile PWA. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
