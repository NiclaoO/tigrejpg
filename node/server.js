// Tiger Luck Slot — servidor Node.js standalone (sem PHP, sem banco, sem npm).
// Jogo proprio e original, estilo slot do tigre 3x3. Arte por emoji + CSS.
// Uso:  node server.js   →  abra http://127.0.0.1:3002/
// Saldo ficticio em memoria (reseta ao reiniciar).

const http = require('http');

const PORT = 3002;
const HOST = '127.0.0.1';

const SYMBOLS = [
  { icon: '🐯', name: 'Tigre', pay: 25, weight: 1 },
  { icon: '🧧', name: 'Envelope', pay: 10, weight: 2 },
  { icon: '🧨', name: 'Fogos', pay: 5, weight: 3 },
  { icon: '🍊', name: 'Laranja', pay: 4, weight: 5 },
  { icon: '🪙', name: 'Moedas', pay: 2, weight: 7 },
  { icon: '🏮', name: 'Lanterna', pay: 1, weight: 9 },
];
const TOTAL_W = SYMBOLS.reduce((s, x) => s + x.weight, 0);
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];
const BETS = [1, 2, 5, 10, 25, 50, 100, 200];

let balance = 1000;

function drawSymbol() {
  let r = Math.random() * TOTAL_W;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= SYMBOLS[i].weight;
    if (r < 0) return i;
  }
  return SYMBOLS.length - 1;
}

function spin(bet) {
  balance = Math.round((balance - bet) * 100) / 100;
  const grid = Array.from({ length: 9 }, drawSymbol);
  const lineBet = bet / LINES.length;
  let total = 0;
  const cells = new Set();
  const wins = [];
  for (const [a, b, c] of LINES) {
    if (grid[a] === grid[b] && grid[b] === grid[c]) {
      const amount = Math.round(SYMBOLS[grid[a]].pay * lineBet * 100) / 100;
      total = Math.round((total + amount) * 100) / 100;
      cells.add(a); cells.add(b); cells.add(c);
      wins.push({ line: [a, b, c], symbol: SYMBOLS[grid[a]].name, amount });
    }
  }
  let mult = false;
  if (total > 0 && grid.every((v) => v === grid[0])) {
    total = Math.round(total * 10 * 100) / 100; // grade cheia: x10
    mult = true;
  }
  balance = Math.round((balance + total) * 100) / 100;
  return { grid, symbols: grid.map((i) => SYMBOLS[i].icon), winCells: [...cells], wins, win: total, x10: mult, bigWin: total >= bet * 10, balance };
}

const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tiger Luck — Node.js</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif}
body{background:#2b0508;display:flex;justify-content:center;color:#ffe9b0}
.panel{width:min(100%,430px);min-height:100vh;background:radial-gradient(circle at 50% -40px,#c22530 0%,#7d0e15 45%,#4a060c 100%);border-left:3px solid #8a6a1f;border-right:3px solid #8a6a1f;display:flex;flex-direction:column;align-items:center;padding:14px 16px 26px}
.orn{font-size:13px;letter-spacing:.3em;color:#e8b96a}
.mascot{width:92px;height:92px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#f5b81e 60%,#b97a1a);display:grid;place-items:center;font-size:56px;border:4px solid #ffe9a8;box-shadow:0 0 26px rgba(245,200,69,.8);margin-top:6px}
h1{margin:8px 0 0;font-size:1.9rem;font-weight:900;letter-spacing:.06em;color:#ffd968;text-shadow:0 2px 0 #7a4a00,0 0 22px rgba(255,200,60,.55)}
.sub{font-size:.68rem;letter-spacing:.28em;color:#e8b96a}
.frame{margin-top:14px;padding:10px;border-radius:16px;background:linear-gradient(180deg,#ffe9a8,#d9a529 30%,#8a6a1f 50%,#d9a529 70%,#ffe9a8);box-shadow:0 6px 24px rgba(0,0,0,.6),0 0 30px rgba(245,200,69,.35);width:100%;max-width:340px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;border-radius:10px;background:#3d060a;padding:8px}
.cell{aspect-ratio:1;display:grid;place-items:center;font-size:2.4rem;border-radius:8px;background:linear-gradient(180deg,#fffdf4,#f0d48a);outline:2px solid #a8842c}
.cell.win{background:radial-gradient(circle,#fffbe0,#ffd968);outline:3px solid #fff200;box-shadow:0 0 14px #fff200}
.cell.blur{filter:blur(1px)}
.prize{margin-top:12px;min-width:220px;text-align:center;padding:8px 26px;border-radius:999px;border:2px solid #f5c445;background:rgba(0,0,0,.45)}
.prize small{font-size:.68rem;letter-spacing:.2em;color:#e8b96a}
.prize b{font-size:1.5rem;font-weight:900}
#msg{min-height:28px;margin-top:10px;font-weight:700;font-size:.95rem;text-align:center}
.controls{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:340px;margin-top:14px}
.ctl{text-align:center}
.ctl small{font-size:.62rem;letter-spacing:.18em;color:#e8b96a}
.ctl .val{font-weight:800;display:flex;align-items:center;gap:6px;justify-content:center}
.rbtn{width:26px;height:26px;border-radius:50%;border:1px solid #f5c445;background:transparent;color:#ffd968;cursor:pointer;font-size:16px;line-height:1}
.rbtn:disabled{opacity:.3}
#spin{width:108px;height:108px;border-radius:50%;border:5px solid #ffe9a8;background:radial-gradient(circle at 35% 30%,#ffe27a,#f0a500 60%,#b36a00);color:#5c0a10;font-weight:900;font-size:1.05rem;cursor:pointer;box-shadow:0 6px 0 #6b4500,0 0 26px rgba(245,200,69,.6)}
#spin:disabled{background:#8a6a1f;cursor:wait}
.pay{width:100%;max-width:340px;margin-top:18px;border:1px solid #8a6a1f;border-radius:12px;padding:10px 14px;background:rgba(0,0,0,.4);font-size:.82rem}
.pay div{display:flex;justify-content:space-between;padding:2px 0}
.pay strong{color:#ffd968}
#bigwin{position:fixed;inset:0;display:none;place-items:center;background:rgba(40,4,7,.78);z-index:40}
#bigwin.show{display:grid}
#bigwin .t{font-size:3rem;font-weight:900;color:#ffd968;text-shadow:0 3px 0 #7a4a00,0 0 34px #ff9d00}
#bigwin .v{font-size:2rem;font-weight:900;color:#fff}
.coin{position:fixed;top:-40px;z-index:50;pointer-events:none;animation:coinfall linear infinite}
@keyframes coinfall{0%{transform:translateY(-5vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}
.back{margin-top:16px;font-size:.8rem;color:#e8b96a}
</style>
</head>
<body>
<div class="panel">
<div class="orn">✦ ✦ ✦</div>
<div class="mascot">🐯</div>
<h1>TIGER LUCK</h1>
<div class="sub">NODE.JS · DEMO 3×3</div>
<div class="frame"><div class="grid" id="grid"></div></div>
<div class="prize"><small>GANHO&nbsp;&nbsp;</small><b id="win">0.00</b></div>
<div id="msg">Aperte GIRAR e boa sorte! 🐯</div>
<div class="controls">
<div class="ctl"><small>SALDO</small><div class="val" id="bal">1000.00</div></div>
<button id="spin">🐯<br>GIRAR</button>
<div class="ctl"><small>APOSTA</small><div class="val"><button class="rbtn" id="minus">−</button><span id="bet">10</span><button class="rbtn" id="plus">+</button></div></div>
</div>
<div class="pay" id="pay"></div>
<div class="back">Saldo ficticio · jogo proprio, sem relacao com PG Soft · rode com: <b>node server.js</b></div>
</div>
<div id="bigwin"><div><div class="t">BIG WIN</div><div class="v" id="bigval"></div><div style="font-size:44px">🐯🪙🐯</div></div></div>
<script>
const ICONS = ${JSON.stringify(SYMBOLS.map((s) => s.icon))};
const BETS = ${JSON.stringify(BETS)};
let betIdx = 3, spinning = false;
const grid = document.getElementById('grid');
const cells = [];
for (let i = 0; i < 9; i++) { const d = document.createElement('div'); d.className = 'cell'; d.textContent = '🏮'; grid.appendChild(d); cells.push(d); }
document.getElementById('pay').innerHTML = ${JSON.stringify(SYMBOLS.map((s) => `<div><span>${s.icon} ${s.name} ×3</span><strong>${s.pay}x</strong></div>`).join(''))} + '<div style="margin-top:6px;color:#ffd968;font-size:.78rem">Grade cheia igual: prêmio <strong>×10</strong> · 5 linhas</div>';
function setBet(d) { betIdx = Math.min(BETS.length - 1, Math.max(0, betIdx + d)); document.getElementById('bet').textContent = BETS[betIdx]; }
document.getElementById('minus').onclick = () => setBet(-1);
document.getElementById('plus').onclick = () => setBet(1);
function coins(n) { document.querySelectorAll('.coin').forEach((e) => e.remove()); for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'coin'; s.textContent = '🪙'; s.style.left = ((i * 97) % 100) + '%'; s.style.fontSize = (18 + ((i * 13) % 22)) + 'px'; s.style.animationDuration = (1.6 + ((i * 7) % 10) / 10) + 's'; s.style.animationDelay = ((i % 12) * 0.18) + 's'; document.body.appendChild(s); } }
async function refresh() { const r = await fetch('/api/state'); const j = await r.json(); document.getElementById('bal').textContent = j.balance.toFixed(2); }
document.getElementById('spin').onclick = async () => {
  if (spinning) return; spinning = true;
  document.getElementById('spin').disabled = true;
  document.getElementById('msg').textContent = 'Girando... 🎰';
  cells.forEach((c) => { c.classList.remove('win'); c.classList.add('blur'); });
  const iv = setInterval(() => cells.forEach((c) => (c.textContent = ICONS[Math.floor(Math.random() * ICONS.length)])), 100);
  try {
    const r = await fetch('/api/spin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bet: BETS[betIdx] }) });
    const j = await r.json();
    await new Promise((ok) => setTimeout(ok, 900));
    clearInterval(iv);
    j.grid.forEach((s, i) => { cells[i].textContent = ICONS[s]; cells[i].classList.remove('blur'); });
    j.winCells.forEach((i) => cells[i].classList.add('win'));
    document.getElementById('win').textContent = j.win.toFixed(2);
    document.getElementById('win').style.color = j.win > 0 ? '#7CFC00' : '#ffe9b0';
    document.getElementById('bal').textContent = j.balance.toFixed(2);
    document.getElementById('msg').textContent = j.win > 0 ? (j.x10 ? 'TIGER x10! 🐯🔥 Ganhou ' + j.win.toFixed(2) + '!' : 'Ganhou ' + j.win.toFixed(2) + ' demo!') : 'Sem linha premiada. Gire de novo!';
    if (j.bigWin) { document.getElementById('bigval').textContent = j.win.toFixed(2); document.getElementById('bigwin').classList.add('show'); coins(36); setTimeout(() => { document.getElementById('bigwin').classList.remove('show'); document.querySelectorAll('.coin').forEach((e) => e.remove()); }, 3500); }
  } catch (e) { clearInterval(iv); document.getElementById('msg').textContent = 'Erro de conexao com o servidor Node.'; }
  spinning = false; document.getElementById('spin').disabled = false;
};
refresh();
</script>
</body>
</html>`;

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/') return send(res, 200, 'text/html', PAGE);
  if (req.method === 'GET' && url.pathname === '/api/state') {
    return send(res, 200, 'application/json', JSON.stringify({ balance, bets: BETS }));
  }
  if (req.method === 'POST' && url.pathname === '/api/spin') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const { bet } = JSON.parse(raw || '{}');
        if (!BETS.includes(bet)) return send(res, 400, 'application/json', JSON.stringify({ error: 'Aposta invalida. Use: ' + BETS.join(', ') }));
        if (bet > balance) return send(res, 400, 'application/json', JSON.stringify({ error: 'Saldo demo insuficiente.' }));
        return send(res, 200, 'application/json', JSON.stringify(spin(bet)));
      } catch {
        return send(res, 400, 'application/json', JSON.stringify({ error: 'JSON invalido.' }));
      }
    });
    return;
  }
  return send(res, 404, 'application/json', JSON.stringify({ error: 'Rota nao encontrada.' }));
});

server.listen(PORT, HOST, () => {
  console.log(`Tiger Luck (Node.js) rodando em http://${HOST}:${PORT}/`);
});
