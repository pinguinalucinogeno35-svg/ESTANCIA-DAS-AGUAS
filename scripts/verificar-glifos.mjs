// Busca emojis e caracteres Unicode usados como ícone ou seta em todo o código e em todos os textos.
// Sinais de texto corrido permitidos pelo projeto: · — ° (e aspas, travessões e acentos normais).
// Sai com erro se achar qualquer coisa.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const IGNORAR = new Set(['node_modules', '.next', '.git', 'site_v4', 'vendor', 'test-results', 'playwright-report', '.temp', '.branches']);
const EXTENSOES = new Set(['.html', '.css', '.js', '.mjs', '.ts', '.tsx', '.json', '.jsonc', '.sql', '.md', '.svg', '.webmanifest', '.txt', '.example']);
// Setas, técnicos, caixas, formas, símbolos diversos, dingbats, setas suplementares, emojis, seletor de variação, marcadores.
const PROIBIDOS = /[•‣⁃←-⇿⌀-⏿①-⓿─-◿☀-➿⤀-⥿⬀-⯿　-〿️\u{1F000}-\u{1FAFF}]/gu;

const achados = [];
function andar(pasta) {
  for (const nome of readdirSync(pasta)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(pasta, nome);
    const info = statSync(caminho);
    if (info.isDirectory()) { andar(caminho); continue; }
    if (!EXTENSOES.has(extname(nome)) && !nome.startsWith('.env')) continue;
    if (nome === 'package-lock.json' || nome === 'verificar-glifos.mjs') continue;
    readFileSync(caminho, 'utf8').split('\n').forEach((linha, i) => {
      const m = linha.match(PROIBIDOS);
      if (m) achados.push(caminho + ':' + (i + 1) + '  ' + [...new Set(m)].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' '));
    });
  }
}
andar(process.cwd());
if (achados.length) {
  console.error('Glifos proibidos encontrados (' + achados.length + '):\n' + achados.join('\n'));
  process.exit(1);
}
console.log('Nenhum emoji ou glifo-símbolo encontrado.');
