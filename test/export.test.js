const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const page = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const start = page.indexOf('function url(h)');
const end = page.indexOf('$("export_csv").addEventListener', start);
const context = vm.createContext({});
vm.runInContext(page.slice(start, end), context);

test('exports all house details with Excel-compatible encoding and numeric values', () => {
  const house = {
    id: '123', t: 'Casa "Boa"; praia', loc: 'São Paulo', reg: 'São Paulo',
    cap: 12, q: 4, c: 6, b: '4,5', nota: 4.94, av: 17,
    bd: ['Quarto 1: casal', 'Quarto 2: solteiro'], am: ['Wi-Fi', 'Piscina'],
    ar: 'Todos os quartos', pi: 'Privativa', ch: 'Sim', w: 'Observação',
    url: 'https://www.airbnb.com.br/rooms/123'
  };
  const csv = context.csvList([house, { id: 'c1', custom: 1, t: 'Sem preço' }], { '123': '7767' }, 11);
  assert.ok(csv.startsWith('\ufeff"Nome";"Local"'));
  assert.match(csv, /"Casa ""Boa""; praia"/);
  assert.match(csv, /"Quarto 1: casal\nQuarto 2: solteiro"/);
  assert.match(csv, /"4,94";"17"/);
  assert.match(csv, /"7767";"11";"706,09";"https:\/\/www\.airbnb\.com\.br\/rooms\/123"/);
  assert.match(csv, /"Sem preço".*;"";"11";"";""/);
});

test('neutralizes spreadsheet formulas in text fields', () => {
  const csv = context.csvList([{ id: '123', t: '=1+1', loc: '  +cmd', w: '@formula', am: ['-unsafe'] }], {}, 10);
  assert.match(csv, /"'=1\+1";"'  \+cmd"/);
  assert.match(csv, /"'-unsafe";"'@formula"/);
});
