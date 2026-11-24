import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SpriteAdmin } from '@/componentes/Icones';
import './admin.css';

export const metadata: Metadata = { title: 'Administrador · Estância das Águas', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SpriteAdmin />
      {children}
    </>
  );
}
