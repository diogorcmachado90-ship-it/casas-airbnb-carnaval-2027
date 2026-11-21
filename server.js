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

function airbnbUrl(value) {
  let url;
  try { url = new URL(value); } catch (e) { throw new Error('Cole um link válido do Airbnb.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !(host === 'airbnb.com' || host.endsWith('.airbnb.com') ||
        host === 'airbnb.com.br' || host.endsWith('.airbnb.com.br')) ||
      !/^\/rooms\/\d+\/?$/.test(url.pathname)) {
    throw new Error('Use o link completo de um anúncio Airbnb, no formato airbnb.com.br/rooms/123456.');
  }
  return url;
}

function decodeHtml(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#39);|&#(?:x([0-9a-f]+)|(\d+));/gi, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&#39;': "'" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const hex = entity.match(/^&#x([0-9a-f]+);$/i);
    const num = hex ? parseInt(hex[1], 16) : parseInt(entity.match(/^&#(\d+);$/)[1], 10);
    return Number.isFinite(num) && num <= 0x10ffff ? String.fromCodePoint(num) : entity;
  });
}

function metaTags(html) {
  const tags = {};
  const attr = (tag, name) => {
    const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", 'i'));
    return match && (match[1] || match[2] || match[3]) || '';
  };
  html.replace(/<meta\b[^>]*>/gi, tag => {
    const key = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase();
    const value = attr(tag, 'content');
    if (key && value) tags[key] = decodeHtml(value);
    return tag;
  });
  return tags;
}

async function fetchAirbnbPage(input) {
  let url = airbnbUrl(input);
  for (let redirects = 0; redirects <= 5; redirects++) {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CarnavalHouseList/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.7'
      }
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirects === 5) throw new Error('O Airbnb redirecionou demais; tente colar o link completo do anúncio.');
      url = airbnbUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new Error('O Airbnb não permitiu ler este anúncio (HTTP ' + response.status + ').');
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) throw new Error('A página do anúncio é grande demais para importar.');
      chunks.push(chunk);
    }
    return { html: Buffer.concat(chunks).toString('utf8'), url: url.href };
  }
  throw new Error('Não foi possível abrir o anúncio.');
}

function listingDetails(html, url) {
  const meta = metaTags(html);
  const objects = [];
  html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (match, text) => {
    try {
      const add = value => {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) return value.forEach(add);
        objects.push(value);
        Object.keys(value).forEach(key => add(value[key]));
      };
      add(JSON.parse(text));
    } catch (e) {}
    return match;
  });
  const find = (keys, source = objects) => {
    for (const object of source) {
      for (const key of keys) {
        const value = object && object[key];
        if (value !== undefined && value !== null && value !== '') return value;
      }
    }
    return '';
  };
  const titleTag = (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const title = String(meta['og:title'] || find(['name', 'headline']) || decodeHtml(titleTag).replace(/<[^>]*>/g, ''))
    .replace(/\s*[|·-]\s*Airbnb.*$/i, '').trim();
  const description = String(find(['description']) || meta['og:description'] || '');
  const address = find(['address']);
  const city = address && typeof address === 'object'
    ? String(address.addressLocality || address.locality || address.city || '') : '';
  const region = address && typeof address === 'object'
    ? String(address.addressRegion || address.region || '') : '';
  const combined = title + ' ' + description;
  const numeric = value => {
    const n = typeof value === 'object' && value !== null ? Number(value.value || value.ratingValue) : Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const numberFromText = pattern => {
    const match = combined.match(pattern);
    return match ? parseInt(match[1], 10) : null;
  };
  const rating = numeric(find(['ratingValue'])) || numeric(find(['rating']));
  const house = {
    url,
    t: title,
    loc: [city, region].filter(Boolean).join(' · '),
    reg: region,
    cap: numeric(find(['numberOfGuests', 'maximumAttendeeCapacity'])) ||
      numberFromText(/(\d+)\s*(?:hóspedes?|guests?)/i),
    q: numeric(find(['numberOfBedrooms', 'numberOfRooms'])) ||
      numberFromText(/(\d+)\s*(?:quartos?|bedrooms?)/i) || '',
    nota: rating && rating <= 5 ? rating : null,
    w: description.slice(0, 500)
  };
  const features = objects.flatMap(object => Array.isArray(object.amenityFeature) ? object.amenityFeature : []);
  const amenityNames = features.map(feature => String(feature.name || '')).join(' ').toLowerCase();
  if (/ar.?condicionado|air.?conditioning/.test(amenityNames)) house.ar = 'Informado no anúncio';
  if (/piscina|pool/.test(amenityNames)) house.pi = 'Informado no anúncio';
  if (/churrasqueira|barbecue|bbq/.test(amenityNames)) house.ch = 'Sim';
  return house;
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
  if (req.method === 'POST' && u === '/api/airbnb-read') {
    try {
      const { html, url } = await fetchAirbnbPage(b.url);
      const house = listingDetails(html, url);
      if (!house.t) throw new Error('O anúncio abriu, mas o Airbnb não forneceu um título legível.');
      return js({ house });
    } catch (e) {
      return js({ erro: e.name === 'TimeoutError' ? 'O Airbnb demorou demais para responder. Tente novamente.' : e.message }, 400);
    }
  }
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
