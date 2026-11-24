// Ícones próprios, no mesmo traço do sprite da página inicial (24 x 24, contorno arredondado).
export function SpriteAdmin() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="a-hoje" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></symbol>
      <symbol id="a-agenda" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></symbol>
      <symbol id="a-pedidos" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></symbol>
      <symbol id="a-portaria" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><path d="M14 14h2.5v2.5M20 14v.01M20 17.5V20h-2.5M14 20v.01" /></symbol>
      <symbol id="a-ajustes" viewBox="0 0 24 24"><path d="M4 7h8.5M17.5 7H20M4 17h2.5M11.5 17H20" /><circle cx="15" cy="7" r="2.5" /><circle cx="9" cy="17" r="2.5" /></symbol>
      <symbol id="a-sair" viewBox="0 0 24 24"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4M6 12h9" /></symbol>
      <symbol id="a-alerta" viewBox="0 0 24 24"><path d="M12 4l9 15.5H3L12 4z" /><path d="M12 10v4.5M12 17.2v.01" /></symbol>
    </svg>
  );
}

export function Icone({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={'icone' + (className ? ' ' + className : '')} aria-hidden="true">
      <use href={'#' + id} />
    </svg>
  );
}
