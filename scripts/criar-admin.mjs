// Cria um administrador (ou atualiza o perfil de um que já existe).
// Uso: npm run admin:criar -- email@exemplo.com "Nome da pessoa" dono|portaria
// A senha é pedida no terminal e não aparece na tela. Em automação, use a variável ADMIN_SENHA.
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline';

const [email, nome, papel] = process.argv.slice(2);
if (!email || !nome || !['dono', 'portaria'].includes(papel)) {
  console.error('Uso: npm run admin:criar -- email@exemplo.com "Nome da pessoa" dono|portaria');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.SUPABASE_SECRET_KEY;
if (!url || !chave) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local.');
  process.exit(1);
}

function pedirSenha() {
  if (process.env.ADMIN_SENHA) return Promise.resolve(process.env.ADMIN_SENHA);
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (texto) => { if (texto.includes('Senha')) process.stdout.write(texto); };
    rl.question('Senha (mínimo de 10 caracteres): ', (s) => { rl.close(); process.stdout.write('\n'); resolve(s); });
  });
}

const senha = await pedirSenha();
if (!senha || senha.length < 10) {
  console.error('A senha precisa ter pelo menos 10 caracteres.');
  process.exit(1);
}

const supabase = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
let id;
const criado = await supabase.auth.admin.createUser({ email, password: senha, email_confirm: true });
if (criado.error) {
  // Já existe: localiza e troca a senha.
  const lista = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const achado = lista.data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!achado) { console.error('Não foi possível criar o usuário: ' + criado.error.message); process.exit(1); }
  id = achado.id;
  const troca = await supabase.auth.admin.updateUserById(id, { password: senha });
  if (troca.error) { console.error('Não foi possível trocar a senha: ' + troca.error.message); process.exit(1); }
} else {
  id = criado.data.user.id;
}

const perfil = await supabase.from('admin_perfis').upsert({ user_id: id, nome, papel, ativo: true });
if (perfil.error) { console.error('Não foi possível gravar o perfil: ' + perfil.error.message); process.exit(1); }
await supabase.from('auditoria').insert({ acao: 'admin.criado_por_script', alvo_tipo: 'admin_perfis', alvo_id: id, depois: { papel } });
console.log('Administrador pronto: ' + email + ' (' + papel + ').');
