
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { LanguageProvider } from "@/context/LanguageProvider";
import { AsistenteVoz } from "@/components/voz/asistente-voz";
import { RegistrarSW } from "@/components/pwa/registrar-sw";

export const metadata: Metadata = {
  title: 'AgroTech - Hidalgo',
  description: 'Sistema inteligente de monitoreo y diagnóstico agrícola para la región de Hidalgo.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'AgroTech', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `lang` lo mantiene sincronizado LanguageProvider al cambiar de idioma.
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <LanguageProvider>
          <FirebaseClientProvider>
            {children}
            <AsistenteVoz />
            <Toaster />
            <RegistrarSW />
          </FirebaseClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
