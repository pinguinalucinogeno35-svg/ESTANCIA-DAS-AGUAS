import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Renova a sessão do administrador e barra quem não está logado antes de chegar às páginas de /admin.
export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([chave, valor]) => resposta.headers.set(chave, valor));
      },
    },
  });

  // Não coloque código entre a criação do cliente e getClaims(): é isso que renova o token.
  const { data } = await supabase.auth.getClaims();
  const logado = !!data?.claims?.sub;
  const caminho = request.nextUrl.pathname;
  const naEntrada = caminho === '/admin/login';

  if (!logado && !naEntrada) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    const redireciona = NextResponse.redirect(url);
    resposta.cookies.getAll().forEach((c) => redireciona.cookies.set(c));
    return redireciona;
  }
  return resposta;
}
