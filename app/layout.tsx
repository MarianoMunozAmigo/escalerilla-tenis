import type { Metadata, Viewport } from "next";
import "./globals.css";
import MainNav from "../components/MainNav";

export const metadata: Metadata = {
  title: "Escalerilla de Tenis - 3° Edición",
  description: "Plataforma web para gestionar jugadores, partidos y tabla de posiciones.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <MainNav />
        {children}
      </body>
    </html>
  );
}