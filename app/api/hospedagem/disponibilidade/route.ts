import { NextResponse } from 'next/server';
import { lerDisponibilidade } from '@/lib/hospedagem/disponibilidade';

export const dynamic = 'force-dynamic';

// Rota pública, só de leitura, sem parâmetros: acomodações ativas e períodos ocupados.
export async function GET() {
  try {
    const dados = await lerDisponibilidade();
    return NextResponse.json(dados, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120' } });
  } catch {
    return NextResponse.json({ erro: 'Calendário indisponível no momento.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
