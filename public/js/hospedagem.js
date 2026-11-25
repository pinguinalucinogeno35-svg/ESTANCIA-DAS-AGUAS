// Calendário visual de hospedagem, direto na página. Lê /api/hospedagem/disponibilidade e preenche os campos de
// entrada e saída que a página usa para montar a mensagem. Se a rota falhar, os campos de data comuns continuam valendo.
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
  const meses = $('ho-meses'), resumo = $('ho-resumo'), livres = $('ho-livres');
  const campoEntrada = $('ho-entrada'), campoSaida = $('ho-saida'), campoAcomodacao = $('ho-acomodacao');
  const campoAdultos = $('ho-adultos'), campoCriancas = $('ho-criancas');
  const enviar = form.querySelector('[data-enviar]');
  const [antes, depois] = raiz.querySelectorAll('.cal-nav');
  const NOME_TIPO = { chale: 'Chalé', apartamento: 'Apartamento' };
  const DIAS = [['domingo', 'dom'], ['segunda', 'seg'], ['terça', 'ter'], ['quarta', 'qua'], ['quinta', 'qui'], ['sexta', 'sex'], ['sábado', 'sáb']];
  const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const fmtDia = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const fmtSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const data = (iso) => new Date(iso + 'T12:00:00Z');
  const largo = window.matchMedia('(min-width: 1100px)');

  const ultimoDia = cal.somarDias(dados.ate, -1);
  const mesMin = dados.hoje.slice(0, 7), mesMax = ultimoDia.slice(0, 7);
  const acs = dados.acomodacoes;
  let mes = mesMin, entrada = null, saida = null, escolhida = null;

  const quantos = () => (largo.matches ? 2 : 1);
  function somarMes(m, n) {
    const [ano, k] = m.split('-').map(Number);
    return new Date(Date.UTC(ano, k - 1 + n, 1)).toISOString().slice(0, 7);
  }
  function limite() {
    return entrada && !saida ? cal.ultimaSaida(acs, entrada, dados.ate) : null;
  }
  function pessoas() {
    return Math.max(1, parseInt(campoAdultos.value, 10) || 1) + Math.max(0, parseInt(campoCriancas.value, 10) || 0);
  }

  function desenhar(focar) {
    antes.disabled = mes <= mesMin;
    depois.disabled = somarMes(mes, quantos() - 1) >= mesMax;
    const ate = limite();
    meses.textContent = '';
    for (let i = 0; i < quantos(); i++) {
      const m = somarMes(mes, i);
      if (m > mesMax) break;
      const [ano, k] = m.split('-').map(Number);
      const bloco = document.createElement('div');
      bloco.className = 'cal-mes';
      const titulo = document.createElement('strong');
      const nome = fmtMes.format(new Date(Date.UTC(ano, k - 1, 1)));
      titulo.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
      titulo.id = 'ho-mes-' + m;
      const tabela = document.createElement('table');
      tabela.className = 'cal-grade';
      tabela.setAttribute('aria-labelledby', titulo.id);
      const cabeca = tabela.createTHead().insertRow();
      DIAS.forEach(([inteiro, curto]) => {
        const th = document.createElement('th');
        th.scope = 'col'; th.abbr = inteiro; th.textContent = curto;
        cabeca.appendChild(th);
      });
      const corpo = tabela.createTBody();
      cal.semanasDoMes(ano, k).forEach((semana) => {
        const tr = corpo.insertRow();
        semana.forEach((dia) => {
          const td = tr.insertCell();
          if (dia) td.appendChild(botaoDoDia(dia, ate));
        });
      });
      bloco.append(titulo, tabela);
      meses.appendChild(bloco);
    }
    if (focar) { const b = meses.querySelector('[data-dia="' + focar + '"]'); if (b) b.focus(); }
  }

  function botaoDoDia(dia, ate) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.dia = dia;
    b.textContent = String(Number(dia.slice(8)));
    const situacao = cal.situacaoDoDia(acs, dia, dados.hoje, dados.ate);
    let classe = situacao, clicavel = situacao === 'livre';
    let rotulo = situacao === 'livre' ? 'livre' : situacao === 'ocupado' ? 'reservado' : 'indisponível';

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

    b.className = 'cal-dia ' + classe;
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

  function listarLivres() {
    livres.querySelectorAll('.cal-opcao, .cal-aviso').forEach((el) => el.remove());
    if (!entrada || !saida) { livres.hidden = true; escolhida = null; return; }
    const n = pessoas();
    const noPeriodo = cal.livresNoPeriodo(acs, entrada, saida);
    const cabem = noPeriodo.filter((a) => a.capacidade >= n);
    if (!cabem.some((a) => a.id === escolhida)) escolhida = cabem[0] ? cabem[0].id : null;
    cabem.forEach((a) => {
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
    if (cabem.length === 0) {
      const aviso = document.createElement('p');
      aviso.className = 'cal-aviso';
      aviso.textContent = 'Nenhuma acomodação livre nessas datas comporta ' + n + (n === 1 ? ' pessoa' : ' pessoas') + ' sozinha. Envie o pedido assim mesmo e a equipe combina mais de uma acomodação.';
      livres.appendChild(aviso);
    }
    livres.hidden = false;
  }

  function gravar() {
    const a = acs.find((x) => x.id === escolhida);
    campoAcomodacao.value = a && entrada && saida ? a.nome : '';
    const pronto = !!(entrada && saida);
    if (pronto) enviar.removeAttribute('aria-disabled'); else enviar.setAttribute('aria-disabled', 'true');
    form.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function atualizar(focar) {
    desenhar(focar);
    campoEntrada.value = entrada || '';
    campoSaida.value = saida || '';
    if (!entrada) resumo.textContent = 'Toque no dia de entrada.';
    else if (!saida) resumo.textContent = 'Entrada em ' + fmtDia.format(data(entrada)) + '. Agora toque no dia de saída.';
    else {
      const n = cal.noites(entrada, saida);
      resumo.textContent = n + (n === 1 ? ' noite' : ' noites') + ' · de ' + fmtDia.format(data(entrada)) + ' a ' + fmtDia.format(data(saida));
    }
    listarLivres();
    gravar();
  }

  meses.addEventListener('click', (e) => {
    const b = e.target.closest('.cal-dia');
    if (b) escolher(b.dataset.dia, b);
  });
  // setas do teclado andam pelos dias; ao sair dos meses visíveis, o calendário acompanha
  meses.addEventListener('keydown', (e) => {
    const passo = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const b = e.target.closest('.cal-dia');
    if (!passo || !b) return;
    e.preventDefault();
    const alvo = cal.somarDias(b.dataset.dia, passo);
    if (alvo < dados.hoje || alvo > ultimoDia) return;
    if (!meses.querySelector('[data-dia="' + alvo + '"]')) mes = passo > 0 ? somarMes(alvo.slice(0, 7), 1 - quantos()) : alvo.slice(0, 7);
    desenhar(alvo);
  });
  livres.addEventListener('change', (e) => {
    if (e.target.name !== 'ho-opcao') return;
    escolhida = e.target.value;
    gravar();
  });
  [campoAdultos, campoCriancas].forEach((c) => c.addEventListener('input', () => { listarLivres(); gravar(); }));
  enviar.addEventListener('click', (e) => {
    if (enviar.getAttribute('aria-disabled') !== 'true') return;
    e.preventDefault();
    raiz.scrollIntoView({ block: 'center', behavior: 'auto' });
    const primeiro = meses.querySelector('.cal-dia.livre');
    if (primeiro) primeiro.focus({ preventScroll: true });
  });
  function mudarMes(passo) {
    const novo = somarMes(mes, passo);
    if (novo < mesMin || novo > mesMax) return;
    mes = novo;
    desenhar();
  }
  antes.addEventListener('click', () => mudarMes(-1));
  depois.addEventListener('click', () => mudarMes(1));
  largo.addEventListener('change', () => desenhar());

  // troca os campos de data comuns pelo calendário
  form.querySelectorAll('[data-datas-nativas]').forEach((el) => { el.hidden = true; });
  raiz.hidden = false;
  atualizar();
}
