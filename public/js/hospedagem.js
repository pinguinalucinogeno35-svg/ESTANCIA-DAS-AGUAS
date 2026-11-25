// Calendário visual de hospedagem. Lê /api/hospedagem/disponibilidade e preenche os campos de entrada e saída
// que a página já usa para montar a mensagem. Se a rota falhar, os campos de data comuns continuam valendo.
import * as cal from './calendario-logica.js';

const raiz = document.getElementById('ho-calendario');
const form = raiz && raiz.closest('form');
if (raiz && form) iniciar().catch(() => {});

async function iniciar() {
  const resposta = await fetch('/api/hospedagem/disponibilidade', { headers: { accept: 'application/json' } });
  if (!resposta.ok) return;
  const dados = await resposta.json();
  if (!dados || !Array.isArray(dados.acomodacoes) || dados.acomodacoes.length === 0) return;

  const $ = (id) => document.getElementById(id);
  const filtro = $('ho-filtro'), corpo = $('ho-dias'), titulo = $('ho-mes'), resumo = $('ho-resumo');
  const livres = $('ho-livres'), campoEntrada = $('ho-entrada'), campoSaida = $('ho-saida'), campoAcomodacao = $('ho-acomodacao');
  const [antes, depois] = raiz.querySelectorAll('.cal-nav');
  const NOME_TIPO = { chale: 'Chalé', apartamento: 'Apartamento' };
  const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const fmtDia = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const fmtSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const data = (iso) => new Date(iso + 'T12:00:00Z');

  const ultimoDia = cal.somarDias(dados.ate, -1);
  const mesMin = dados.hoje.slice(0, 7), mesMax = ultimoDia.slice(0, 7);
  let mes = mesMin, entrada = null, saida = null, escolhida = null;

  dados.acomodacoes.forEach((a) => {
    const o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.nome + ' (até ' + a.capacidade + (a.capacidade === 1 ? ' pessoa)' : ' pessoas)');
    filtro.appendChild(o);
  });

  function lista() {
    return filtro.value ? dados.acomodacoes.filter((a) => a.id === filtro.value) : dados.acomodacoes;
  }
  function limite() {
    return entrada && !saida ? cal.ultimaSaida(lista(), entrada, dados.ate) : null;
  }

  function desenhar(focar) {
    const [ano, m] = mes.split('-').map(Number);
    const nomeMes = fmtMes.format(new Date(Date.UTC(ano, m - 1, 1)));
    titulo.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    antes.disabled = mes <= mesMin;
    depois.disabled = mes >= mesMax;
    const ate = limite();
    const acs = lista();
    corpo.textContent = '';
    cal.semanasDoMes(ano, m).forEach((semana) => {
      const tr = document.createElement('tr');
      semana.forEach((dia) => {
        const td = document.createElement('td');
        if (dia) td.appendChild(botaoDoDia(dia, acs, ate));
        tr.appendChild(td);
      });
      corpo.appendChild(tr);
    });
    if (focar) { const b = corpo.querySelector('[data-dia="' + focar + '"]'); if (b) b.focus(); }
  }

  function botaoDoDia(dia, acs, ate) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal-dia';
    b.dataset.dia = dia;
    b.textContent = String(Number(dia.slice(8)));
    const situacao = cal.situacaoDoDia(acs, dia, dados.hoje, dados.ate);
    let classe = situacao, clicavel = situacao === 'livre', rotulo = situacao === 'livre' ? 'livre' : situacao === 'ocupado' ? 'reservado' : 'indisponível';

    if (entrada && !saida) {
      // escolhendo a saída: vale qualquer dia depois da entrada até o limite, mesmo que a noite dele esteja reservada
      if (dia > entrada && ate && dia <= ate) {
        clicavel = true;
        if (situacao !== 'livre') { classe = 'so-saida'; rotulo = 'livre só para saída'; }
        else rotulo = 'livre, toque para sair neste dia';
      } else if (dia > entrada) {
        classe += ' fora'; clicavel = false; rotulo = 'indisponível para esta entrada';
      }
    }
    if (dia === entrada) { classe = 'livre ponta'; rotulo = 'dia de entrada'; clicavel = true; }
    else if (dia === saida) { classe = 'livre ponta'; rotulo = 'dia de saída'; clicavel = true; }
    else if (entrada && saida && dia > entrada && dia < saida) { classe = 'livre entre'; rotulo = 'dentro da sua estadia'; }
    if (dia === dados.hoje) classe += ' hoje';

    b.className += ' ' + classe;
    b.setAttribute('aria-label', fmtSemana.format(data(dia)) + ', ' + rotulo);
    if (dia === entrada || dia === saida) b.setAttribute('aria-pressed', 'true');
    if (!clicavel) { b.setAttribute('aria-disabled', 'true'); b.tabIndex = -1; }
    return b;
  }

  function escolher(dia, botao) {
    if (botao.getAttribute('aria-disabled') === 'true') return;
    const ate = limite();
    if (entrada && !saida && dia > entrada && ate && dia <= ate) saida = dia;
    else { entrada = dia; saida = null; escolhida = null; }
    atualizar(dia);
  }

  function atualizar(focar) {
    desenhar(focar);
    campoEntrada.value = entrada || '';
    campoSaida.value = saida || '';
    livres.querySelectorAll('.cal-opcao, .cal-aviso').forEach((el) => el.remove());

    if (!entrada) {
      resumo.textContent = 'Toque no dia de entrada.';
      livres.hidden = true;
    } else if (!saida) {
      resumo.textContent = 'Entrada em ' + fmtDia.format(data(entrada)) + '. Agora toque no dia de saída.';
      livres.hidden = true;
    } else {
      const n = cal.noites(entrada, saida);
      resumo.textContent = n + (n === 1 ? ' noite' : ' noites') + ' · de ' + fmtDia.format(data(entrada)) + ' a ' + fmtDia.format(data(saida));
      const opcoes = cal.livresNoPeriodo(lista(), entrada, saida);
      if (!opcoes.some((a) => a.id === escolhida)) escolhida = opcoes[0] ? opcoes[0].id : null;
      opcoes.forEach((a) => {
        const rotulo = document.createElement('label');
        rotulo.className = 'cal-opcao';
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'ho-opcao'; radio.value = a.id; radio.checked = a.id === escolhida;
        const texto = document.createElement('span');
        const nome = document.createElement('b'); nome.textContent = a.nome;
        const detalhe = document.createElement('small');
        detalhe.textContent = (NOME_TIPO[a.tipo] || 'Acomodação') + ' · até ' + a.capacidade + (a.capacidade === 1 ? ' pessoa' : ' pessoas') + ' · café da manhã incluso';
        texto.append(nome, detalhe);
        rotulo.append(radio, texto);
        livres.appendChild(rotulo);
      });
      livres.hidden = opcoes.length === 0;
    }
    const a = dados.acomodacoes.find((x) => x.id === escolhida);
    campoAcomodacao.value = a && entrada && saida ? a.nome : '';
    form.dispatchEvent(new Event('input', { bubbles: true }));
  }

  corpo.addEventListener('click', (e) => {
    const b = e.target.closest('.cal-dia');
    if (b) escolher(b.dataset.dia, b);
  });
  // setas do teclado andam pelos dias; ao sair do mês, o calendário acompanha
  corpo.addEventListener('keydown', (e) => {
    const passo = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const b = e.target.closest('.cal-dia');
    if (!passo || !b) return;
    e.preventDefault();
    const alvo = cal.somarDias(b.dataset.dia, passo);
    if (alvo < dados.hoje || alvo > ultimoDia) return;
    if (alvo.slice(0, 7) !== mes) mes = alvo.slice(0, 7);
    desenhar(alvo);
  });
  livres.addEventListener('change', (e) => {
    if (e.target.name !== 'ho-opcao') return;
    escolhida = e.target.value;
    const a = dados.acomodacoes.find((x) => x.id === escolhida);
    campoAcomodacao.value = a ? a.nome : '';
  });
  filtro.addEventListener('change', () => { entrada = null; saida = null; escolhida = null; atualizar(); });
  function mudarMes(passo) {
    const [ano, m] = mes.split('-').map(Number);
    const d = new Date(Date.UTC(ano, m - 1 + passo, 1));
    const novo = d.toISOString().slice(0, 7);
    if (novo < mesMin || novo > mesMax) return;
    mes = novo;
    desenhar();
  }
  antes.addEventListener('click', () => mudarMes(-1));
  depois.addEventListener('click', () => mudarMes(1));

  // troca os campos de data comuns pelo calendário
  form.querySelectorAll('[data-datas-nativas]').forEach((el) => { el.hidden = true; });
  raiz.hidden = false;
  atualizar();
}
