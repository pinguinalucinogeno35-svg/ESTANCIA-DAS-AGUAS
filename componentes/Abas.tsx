'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from './Icones';

export function Abas({ telas, className }: { telas: ReadonlyArray<{ id: string; rotulo: string; icone: string }>; className: string }) {
  const caminho = usePathname();
  return (
    <nav className={'abas ' + className} aria-label="Telas do aplicativo">
      {telas.map((t) => {
        const href = '/admin/' + t.id;
        const atual = caminho === href || caminho.startsWith(href + '/');
        return (
          <Link key={t.id} href={href} aria-current={atual ? 'page' : undefined}>
            <Icone id={t.icone} />
            <span>{t.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
