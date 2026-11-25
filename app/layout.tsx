import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Estância das Águas',
  robots: { index: false },
};
export const viewport: Viewport = { themeColor: '#2E3568', width: 'device-width', initialScale: 1 };

// Envolve só as telas novas (reserva e administrador). A página inicial é o arquivo estático public/index.html.
export default function Raiz({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preload" href="/fontes/plus-jakarta-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="stylesheet" href="/css/tokens.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
