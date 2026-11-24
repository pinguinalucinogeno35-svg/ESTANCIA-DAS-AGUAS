'use client';

import { useActionState } from 'react';
import { entrar, type EstadoEntrada } from '../acoes';
import { Icone } from '@/componentes/Icones';

const inicial: EstadoEntrada = { erro: null };

export function FormularioEntrada({ aviso }: { aviso: string | null }) {
  const [estado, acao, enviando] = useActionState(entrar, inicial);
  const mensagem = estado.erro ?? aviso;
  return (
    <form action={acao} className="cartao-claro" noValidate>
      <div>
        <h1>Entrar</h1>
        <p className="sub">Área restrita da equipe da Estância.</p>
      </div>
      {mensagem ? (
        <p className="erro" role="alert">
          <Icone id="a-alerta" />
          <span>{mensagem}</span>
        </p>
      ) : null}
      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" required />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn btn-sol" type="submit" disabled={enviando}>
        {enviando ? 'Entrando' : 'Entrar'}
      </button>
      <p className="letra-miuda">Esqueceu a senha? Peça a um dos donos para redefinir.</p>
    </form>
  );
}
