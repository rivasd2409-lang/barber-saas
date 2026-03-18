import type { Metadata } from "next";
import { AppSidebar } from "@/app/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barber SaaS",
  description: "SaaS para barberias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-100 text-slate-950 antialiased">
        <div className="min-h-screen bg-slate-100">
          <AppSidebar />
          <main className="min-h-screen bg-slate-100 pt-20 lg:ml-64 lg:pt-0">
            <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 md:px-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
