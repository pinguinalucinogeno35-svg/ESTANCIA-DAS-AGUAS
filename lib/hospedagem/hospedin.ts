import 'server-only';

// Ponto de encaixe da integração com o Hospedin (API v3, credencial Client ID + Secret).
//
// AINDA NÃO IMPLEMENTADO DE PROPÓSITO: as chamadas só serão escritas com a documentação oficial
// do Hospedin em mãos, e não de memória. O restante do sistema já está pronto para recebê-la:
//
//   1. chales.hospedin_id liga cada acomodação do site à do Hospedin.
//   2. sincronizarOcupacoes() copia para chale_ocupacoes (origem 'hospedin', ref_externa = id da reserva)
//      os períodos ocupados no Hospedin. O calendário do site lê só essa tabela.
//      Pelo que foi apurado, o Hospedin não envia avisos (webhooks), então isto roda agendado.
//   3. enviarReserva() cria no Hospedin a reserva de um pedido com sinal pago e grava
//      hospedagem_pedidos.hospedin_reserva_id; cancelarReserva() desfaz.
//   4. configuracoes.hospedagem_fonte = 'hospedin' liga a integração.

export type OcupacaoExterna = { hospedinId: string; refExterna: string; inicio: string; fim: string };
export type ResultadoSincronizacao = { lidas: number; gravadas: number; removidas: number };

export function hospedinConfigurado(): boolean {
  return !!process.env.HOSPEDIN_CLIENT_ID && !!process.env.HOSPEDIN_CLIENT_SECRET && !!process.env.HOSPEDIN_ACCOUNT_ID;
}

class HospedinNaoImplementado extends Error {
  constructor() {
    super('Integração com o Hospedin ainda não implementada: falta a documentação oficial da API.');
  }
}

export async function sincronizarOcupacoes(): Promise<ResultadoSincronizacao> {
  throw new HospedinNaoImplementado();
}

export async function enviarReserva(_pedidoId: string): Promise<{ hospedinReservaId: string }> {
  throw new HospedinNaoImplementado();
}

export async function cancelarReserva(_hospedinReservaId: string): Promise<void> {
  throw new HospedinNaoImplementado();
}
