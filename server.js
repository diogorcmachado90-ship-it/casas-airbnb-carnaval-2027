// Servidor da lista de casas do Carnaval. Sem dependências: só precisa do Node.js.
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const SENHA = process.env.SENHA || '';          // opcional: defina para exigir senha
const FILE = path.join(__dirname, 'dados.json');
const PAGE = path.join(__dirname, 'public', 'index.html');

let S = { P: {}, R: [], C: [] };
try { S = Object.assign(S, JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch (e) {}
let timer = null;
function save() { clearTimeout(timer); timer = setTimeout(() => fs.writeFile(FILE, JSON.stringify(S, null, 2), () => {}), 100); }

function auth(req) {
  if (!SENHA) return true;
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const p = Buffer.from(h.slice(6), 'base64').toString();
  return p.slice(p.indexOf(':') + 1) === SENHA;
}
function readBody(req) {
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (e) { resolve({}); } });
  });
}

http.createServer(async (req, res) => {
  if (!auth(req)) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Carnaval"' }); return res.end('Senha necessária'); }
  const u = req.url.split('?')[0];
  const js = (o, c = 200) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };

  if (req.method === 'GET' && (u === '/' || u === '/index.html')) {
    return fs.readFile(PAGE, (e, b) => { res.writeHead(e ? 500 : 200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(e ? 'public/index.html não encontrado' : b); });
  }
  if (req.method === 'GET' && u === '/api/state') return js(S);

  const b = await readBody(req);
  if (req.method === 'PUT' && u === '/api/price') {
    if (typeof b.id === 'string') { if (b.v) S.P[b.id] = String(b.v); else delete S.P[b.id]; save(); }
    return js({ ok: 1 });
  }
  if (req.method === 'POST' && u === '/api/house') {
    const h = b.house;
    if (h && typeof h.id === 'string') { S.C = S.C.filter(x => x.id !== h.id); S.C.push(h); if (b.price) S.P[h.id] = String(b.price); save(); }
    return js({ ok: 1 });
  }
  if (req.method === 'POST' && u === '/api/remove') {
    if (typeof b.id === 'string') {
      if (b.custom) { S.C = S.C.filter(x => x.id !== b.id); delete S.P[b.id]; }
      else if (!S.R.includes(b.id)) S.R.push(b.id);
      save();
    }
    return js({ ok: 1 });
  }
  if (req.method === 'POST' && u === '/api/restore') { S.R = []; save(); return js({ ok: 1 }); }
  js({ erro: 'não encontrado' }, 404);
}).listen(PORT, '0.0.0.0', () => {
  console.log('Servidor no ar: http://localhost:' + PORT + (SENHA ? '  (com senha)' : '  (SEM senha)'));
});
