import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Curis — Smart Telehealth Platform",
  icons: { icon: "/favicon.svg" },
  description:
    "Curis connects patients with the right doctors using AI-powered symptom analysis. Get personalised doctor recommendations instantly.",
  keywords: ["telehealth", "doctor", "AI", "health", "recommendations"],
  openGraph: {
    title: "Curis — Smart Telehealth Platform",
    description: "AI-powered doctor recommendations at your fingertips.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
