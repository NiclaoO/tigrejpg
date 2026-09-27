// Tiger Luck Slot — servidor Node.js standalone (sem PHP, sem banco, sem npm).
// Jogo proprio e original, estilo slot do tigre 3x3. Arte por emoji + CSS.
// Recursos: giros gratis (scatter), bonus de escolha, jackpot acumulado, historico.
// Uso:  node server.js   →  abra http://127.0.0.1:3002/
// Tudo em memoria (reseta ao reiniciar). Saldo ficticio.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const HOST = '127.0.0.1';

// Foto do simbolo Tigre (arquivo local da pasta). Se faltar, volta ao emoji.
let TIGER_PHOTO = null;
try {
  TIGER_PHOTO = fs.readFileSync(path.join(__dirname, 'BOLSONARO.PNG'));
  console.log('Foto do Tigre carregada: BOLSONARO.PNG (' + TIGER_PHOTO.length + ' bytes)');
} catch (e) {
  console.log('BOLSONARO.PNG nao encontrada — usando emoji 🐯.');
}

// Foto do simbolo Envelope. Se faltar, volta ao emoji.
let ARMA_PHOTO = null;
try {
  ARMA_PHOTO = fs.readFileSync(path.join(__dirname, 'ARMINHA.jpg'));
  console.log('Foto do Envelope carregada: ARMINHA.jpg (' + ARMA_PHOTO.length + ' bytes)');
} catch (e) {
  console.log('ARMINHA.jpg nao encontrada — usando emoji 🧧.');
}

// Foto do simbolo Lanterna. Se faltar, volta ao emoji.
let CORACAO_PHOTO = null;
try {
  CORACAO_PHOTO = fs.readFileSync(path.join(__dirname, 'CORACAO.jpg'));
  console.log('Foto da Lanterna carregada: CORACAO.jpg (' + CORACAO_PHOTO.length + ' bytes)');
} catch (e) {
  console.log('CORACAO.jpg nao encontrada — usando emoji 🏮.');
}

// Foto do simbolo Laranja. Se faltar, volta ao emoji.
let MASC_PHOTO = null;
try {
  MASC_PHOTO = fs.readFileSync(path.join(__dirname, 'mascara.jpg'));
  console.log('Foto da Laranja carregada: mascara.jpg (' + MASC_PHOTO.length + ' bytes)');
} catch (e) {
  console.log('mascara.jpg nao encontrada — usando emoji 🍊.');
}

// Foto do simbolo Fogos. Se faltar, volta ao emoji.
let DOM_PHOTO = null;
try {
  DOM_PHOTO = fs.readFileSync(path.join(__dirname, 'DOMINGO.jpg'));
  console.log('Foto dos Fogos carregada: DOMINGO.jpg (' + DOM_PHOTO.length + ' bytes)');
} catch (e) {
  console.log('DOMINGO.jpg nao encontrada — usando emoji 🧨.');
}

// Foto do simbolo Moedas. Se faltar, volta ao emoji.
let RAINHA_PHOTO = null;
try {
  RAINHA_PHOTO = fs.readFileSync(path.join(__dirname, 'RAINHA.jpg'));
  console.log('Foto das Moedas carregada: RAINHA.jpg (' + RAINHA_PHOTO.length + ' bytes)');
} catch (e) {
  console.log('RAINHA.jpg nao encontrada — usando emoji 🪙.');
}

// Foto do simbolo Estrela (giros gratis). Se faltar, volta ao emoji.
let ANAO_PHOTO = null;
try {
  ANAO_PHOTO = fs.readFileSync(path.join(__dirname, 'BOLSONARO ANAO.jpg'));
  console.log('Foto da Estrela carregada: BOLSONARO ANAO.jpg (' + ANAO_PHOTO.length + ' bytes)');
} catch (e) {
  console.log('BOLSONARO ANAO.jpg nao encontrada — usando emoji ⭐.');
}

// Som de vitoria. Toca no navegador quando o jogador ganha.
let WIN_SOUND = null;
try {
  WIN_SOUND = fs.readFileSync(path.join(__dirname, 'bolsonaro-e-norte-bolsonaro-e-nordeste.mp3'));
  console.log('Som de vitoria carregado: bolsonaro-e-norte-bolsonaro-e-nordeste.mp3 (' + WIN_SOUND.length + ' bytes)');
} catch (e) {
  console.log('MP3 nao encontrado — sem som de vitoria.');
}

// Som de saldo zerado. Toca quando acaba o saldo e ao tentar girar sem saldo.
let END_SOUND = null;
try {
  END_SOUND = fs.readFileSync(path.join(__dirname, 'bolsonaro-acabou-porra.mp3'));
  console.log('Som de fim de saldo carregado: bolsonaro-acabou-porra.mp3 (' + END_SOUND.length + ' bytes)');
} catch (e) {
  console.log('MP3 do fim de saldo nao encontrado.');
}

// Som do jackpot. Toca em todo acerto.
let POETA_SOUND = null;
try {
  POETA_SOUND = fs.readFileSync(path.join(__dirname, 'bolsonaro-poeta.mp3'));
  console.log('Som do jackpot carregado: bolsonaro-poeta.mp3 (' + POETA_SOUND.length + ' bytes)');
} catch (e) {
  console.log('MP3 do jackpot nao encontrado.');
}

// Som de erro. Toca toda vez que a pessoa erra (giro sem ganho).
let RISADA_SOUND = null;
try {
  RISADA_SOUND = fs.readFileSync(path.join(__dirname, 'bolsonaro-risada.mp3'));
  console.log('Som de erro carregado: bolsonaro-risada.mp3 (' + RISADA_SOUND.length + ' bytes)');
} catch (e) {
  console.log('MP3 da risada nao encontrado.');
}

const SYMBOLS = [
  { icon: '🐯', name: 'Tigre', pay: 25, weight: 1 },
  { icon: '🧧', name: 'Envelope', pay: 10, weight: 2 },
  { icon: '🧨', name: 'Fogos', pay: 5, weight: 3 },
  { icon: '🍊', name: 'Laranja', pay: 4, weight: 5 },
  { icon: '🪙', name: 'Moedas', pay: 2, weight: 7 },
  { icon: '🏮', name: 'Lanterna', pay: 1, weight: 9 },
  { icon: '⭐', name: 'Estrela', pay: 0, weight: 2, scatter: true }, // so ativa giros gratis
];
const TIGER = 0;
const SCATTER = 6;
const TOTAL_W = SYMBOLS.reduce((s, x) => s + x.weight, 0);
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];
const BETS = [1, 2, 5, 10, 25, 50, 100, 200];
const FREE_SPINS_AWARD = 10;
const FS_MULT = 2; // ganhos x2 nos giros gratis
const BONUS_MULTS = [5, 10, 25]; // envelopes do bonus (x aposta)
const JACKPOT_SEED = 500;
const JACKPOT_FEE = 0.01; // 1% de cada aposta alimenta o jackpot
const HISTORY_MAX = 20;

let balance = 50;
let jackpot = JACKPOT_SEED;
let freeSpins = 0;
let freeBet = 0;
let pendingBonus = null; // { bet, prizes:[mult...] }
let history = [];

// Persistencia: so o jackpot sobrevive (pote da casa). O saldo volta a 50
// toda vez que a pagina e carregada (POST /api/reset no inicio).
const SAVE_FILE = path.join(__dirname, 'saldo.json');
function loadSave() {
  try {
    const s = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
    if (Number.isFinite(s.jackpot) && s.jackpot >= JACKPOT_SEED) jackpot = s.jackpot;
    console.log('Jackpot carregado: ' + jackpot);
  } catch (e) {
    console.log('Sem save anterior — jackpot no inicial.');
  }
}
function save() {
  try {
    fs.writeFileSync(SAVE_FILE, JSON.stringify({ jackpot }));
  } catch (e) {
    console.log('Falha ao salvar: ' + e.message);
  }
}
loadSave();

function drawSymbol() {
  let r = Math.random() * TOTAL_W;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= SYMBOLS[i].weight;
    if (r < 0) return i;
  }
  return SYMBOLS.length - 1;
}

function pushHistory(entry) {
  history.unshift({ t: new Date().toISOString(), ...entry });
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
}

function spin(bet, isFree) {
  const stake = isFree ? 0 : bet;
  balance = Math.round((balance - stake) * 100) / 100;
  if (!isFree) jackpot = Math.round((jackpot + bet * JACKPOT_FEE) * 100) / 100;

  const grid = Array.from({ length: 9 }, drawSymbol);
  const lineBet = bet / LINES.length;
  let total = 0;
  const cells = new Set();
  const wins = [];
  for (const [a, b, c] of LINES) {
    const s = grid[a];
    if (s === grid[b] && s === grid[c] && SYMBOLS[s].pay > 0 && !SYMBOLS[s].scatter) {
      const amount = Math.round(SYMBOLS[s].pay * lineBet * 100) / 100;
      total = Math.round((total + amount) * 100) / 100;
      cells.add(a); cells.add(b); cells.add(c);
      wins.push({ line: [a, b, c], symbol: SYMBOLS[s].name, amount });
    }
  }
  if (isFree) total = Math.round(total * FS_MULT * 100) / 100; // x2 nos giros gratis

  let mult = false;
  if (total > 0 && grid.every((v) => v === grid[0])) {
    total = Math.round(total * 10 * 100) / 100; // grade cheia: x10
    mult = true;
  }

  // Jackpot: grade cheia de tigres leva tudo; qualquer outra grade cheia leva 10% do pote
  let jackpotHit = 0;
  if (grid.every((v) => v === grid[0])) {
    if (grid[0] === TIGER) {
      jackpotHit = Math.round(jackpot * 100) / 100;
      jackpot = JACKPOT_SEED;
    } else {
      jackpotHit = Math.round(jackpot * 0.1 * 100) / 100;
      jackpot = Math.round((jackpot - jackpotHit) * 100) / 100;
    }
    total = Math.round((total + jackpotHit) * 100) / 100;
  }

  // Giros gratis: 3+ estrelas em qualquer lugar = +10 (acumula)
  const scatters = grid.filter((v) => v === SCATTER).length;
  let fsWon = 0;
  if (scatters >= 3) {
    fsWon = FREE_SPINS_AWARD;
    freeSpins += FREE_SPINS_AWARD;
    if (!isFree) freeBet = bet;
  }
  if (isFree) freeSpins = Math.max(0, freeSpins - 1);

  // Bonus de escolha: 3+ tigres em qualquer lugar abre os envelopes
  const tigers = grid.filter((v) => v === TIGER).length;
  let bonusReady = false;
  if (tigers >= 3 && !pendingBonus) {
    pendingBonus = { bet, prizes: [...BONUS_MULTS].sort(() => Math.random() - 0.5) };
    bonusReady = true;
  }

  balance = Math.round((balance + total) * 100) / 100;
  const entry = {
    bet, free: isFree, symbols: grid.map((i) => SYMBOLS[i].icon),
    win: total, x10: mult, jackpot: jackpotHit, fsWon, bonus: bonusReady,
    freeLeft: freeSpins, balance,
  };
  pushHistory(entry);
  save();
  return {
    grid, symbols: entry.symbols, winCells: [...cells], wins, win: total,
    x10: mult, jackpotHit, fsWon, bonusReady, bigWin: total >= bet * 10,
    freeSpins, freeLeft: freeSpins, balance, jackpot: Math.round(jackpot * 100) / 100,
  };
}

function pickBonus(choice) {
  if (!pendingBonus) return { error: 'Nenhum bonus pendente.' };
  if (![0, 1, 2].includes(choice)) return { error: 'Escolha 0, 1 ou 2.' };
  const { bet, prizes } = pendingBonus;
  pendingBonus = null;
  const prize = Math.round(bet * prizes[choice] * 100) / 100;
  balance = Math.round((balance + prize) * 100) / 100;
  pushHistory({ bet: 0, free: false, symbols: ['🎁', '🎁', '🎁'], win: prize, x10: false, jackpot: 0, fsWon: 0, bonus: false, bonusPick: true, freeLeft: freeSpins, balance });
  save();
  return { prize, mult: prizes[choice], prizes, balance, jackpot: Math.round(jackpot * 100) / 100 };
}

const TIGER_IMG = TIGER_PHOTO ? '<img src="/tigre.png" class="timg" alt="Tigre">' : '🐯';
const TIGER_IMG_SM = TIGER_PHOTO ? '<img src="/tigre.png" style="width:1.3em;height:1.3em;object-fit:cover;border-radius:50%;vertical-align:-4px" alt="Tigre">' : '🐯';
const ARMA_IMG = ARMA_PHOTO ? '<img src="/arminha.jpg" class="timg" alt="Envelope">' : '🧧';
const ARMA_IMG_SM = ARMA_PHOTO ? '<img src="/arminha.jpg" style="width:1.3em;height:1.3em;object-fit:cover;border-radius:4px;vertical-align:-4px" alt="Envelope">' : '🧧';
const ARMA_IMG_BTN = ARMA_PHOTO ? '<img src="/arminha.jpg" style="width:64px;height:64px;object-fit:cover;border-radius:12px" alt="Envelope">' : '🧧';
const CORACAO_IMG = CORACAO_PHOTO ? '<img src="/coracao.jpg" class="timg" alt="Lanterna">' : '🏮';
const CORACAO_IMG_SM = CORACAO_PHOTO ? '<img src="/coracao.jpg" style="width:1.3em;height:1.3em;object-fit:cover;border-radius:4px;vertical-align:-4px" alt="Lanterna">' : '🏮';
const MASC_IMG = MASC_PHOTO ? '<img src="/mascara.jpg" class="timg" alt="Laranja">' : '🍊';
const MASC_IMG_SM = MASC_PHOTO ? '<img src="/mascara.jpg" style="width:1.3em;height:1.3em;object-fit:cover;border-radius:4px;vertical-align:-4px" alt="Laranja">' : '🍊';
const DOM_IMG = DOM_PHOTO ? '<img src="/domingo.jpg" class="timg" alt="Fogos">' : '🧨';
const DOM_IMG_SM = DOM_PHOTO ? '<img src="/domingo.jpg" style="width:1.3em;height:1.3em;object-fit:cover;border-radius:4px;vertical-align:-4px" alt="Fogos">' : '🧨';
const RAINHA_IMG = RAINHA_PHOTO ? '<img src="/rainha.jpg" class="timg" alt="Moedas">' : '🪙';
const RAINHA_IMG_SM = RAINHA_PHOTO ? '<img src="/rainha.jpg" style="width:1.3em;height:1.3em;object-fit:cover;border-radius:4px;vertical-align:-4px" alt="Moedas">' : '🪙';
const ANAO_IMG = ANAO_PHOTO ? '<img src="/anao.jpg" class="timg" alt="Estrela">' : '⭐';
const ANAO_IMG_SM = ANAO_PHOTO ? '<img src="/anao.jpg" style="width:1.3em;height:1.3em;object-fit:cover;border-radius:4px;vertical-align:-4px" alt="Estrela">' : '⭐';

const PAY_ROWS = SYMBOLS.filter((s) => !s.scatter)
  .map((s) => `<div><span>${s.name === 'Tigre' ? TIGER_IMG_SM : s.name === 'Envelope' ? ARMA_IMG_SM : s.name === 'Lanterna' ? CORACAO_IMG_SM : s.name === 'Laranja' ? MASC_IMG_SM : s.name === 'Fogos' ? DOM_IMG_SM : s.name === 'Moedas' ? RAINHA_IMG_SM : s.icon} ${s.name} ×3</span><strong>${s.pay}x</strong></div>`).join('');

const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BolsoLucks</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif}
body{background:#2b0508;display:flex;justify-content:center;color:#ffe9b0}
.panel{width:min(100%,430px);min-height:100vh;background:radial-gradient(circle at 50% -40px,#c22530 0%,#7d0e15 45%,#4a060c 100%);border-left:3px solid #8a6a1f;border-right:3px solid #8a6a1f;display:flex;flex-direction:column;align-items:center;padding:14px 16px 26px}
.orn{font-size:13px;letter-spacing:.3em;color:#e8b96a}
.mascot{width:92px;height:92px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#f5b81e 60%,#b97a1a);display:grid;place-items:center;font-size:56px;border:4px solid #ffe9a8;box-shadow:0 0 26px rgba(245,200,69,.8);margin-top:6px}
h1{margin:8px 0 0;font-size:1.9rem;font-weight:900;letter-spacing:.06em;color:#ffd968;text-shadow:0 2px 0 #7a4a00,0 0 22px rgba(255,200,60,.55)}
.sub{font-size:.68rem;letter-spacing:.28em;color:#e8b96a}
.jack{margin-top:10px;padding:8px 22px;border-radius:999px;border:2px solid #fff200;background:rgba(0,0,0,.5);font-weight:900;color:#fff200;text-shadow:0 0 12px #ff9d00}
#fsbar{display:none;margin-top:10px;padding:8px 22px;border-radius:999px;border:2px solid #7CFC00;background:rgba(0,0,0,.5);font-weight:900;color:#7CFC00}
.frame{margin-top:14px;padding:10px;border-radius:16px;background:linear-gradient(180deg,#ffe9a8,#d9a529 30%,#8a6a1f 50%,#d9a529 70%,#ffe9a8);box-shadow:0 6px 24px rgba(0,0,0,.6),0 0 30px rgba(245,200,69,.35);width:100%;max-width:340px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;border-radius:10px;background:#3d060a;padding:8px}
.cell{aspect-ratio:1;display:grid;place-items:center;font-size:2.4rem;border-radius:8px;background:linear-gradient(180deg,#fffdf4,#f0d48a);outline:2px solid #a8842c;position:relative;overflow:hidden}
.cell.win{background:radial-gradient(circle,#fffbe0,#ffd968);outline:3px solid #fff200;box-shadow:0 0 14px #fff200}
.cell.blur{filter:blur(1px)}
.timg{position:absolute;top:8%;left:8%;width:84%;height:84%;object-fit:cover;border-radius:10px}
#bgvideo{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
.panel{position:relative;z-index:1;background:linear-gradient(180deg,rgba(150,18,26,.82),rgba(45,4,8,.9)) !important}
#start{background:radial-gradient(circle at 50% 30%,rgba(194,37,48,.88) 0%,rgba(40,3,6,.94) 100%) !important}
.stat{display:flex;gap:10px;margin-top:12px}
.box{min-width:150px;text-align:center;padding:8px 18px;border-radius:12px;border:2px solid #f5c445;background:rgba(0,0,0,.45)}
.box small{font-size:.62rem;letter-spacing:.18em;color:#e8b96a}
.box b{font-size:1.3rem;font-weight:900}
#msg{min-height:28px;margin-top:10px;font-weight:700;font-size:.95rem;text-align:center}
.controls{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:340px;margin-top:12px}
.ctl{text-align:center}
.ctl small{font-size:.62rem;letter-spacing:.18em;color:#e8b96a}
.ctl .val{font-weight:800;display:flex;align-items:center;gap:6px;justify-content:center}
.rbtn{width:26px;height:26px;border-radius:50%;border:1px solid #f5c445;background:transparent;color:#ffd968;cursor:pointer;font-size:16px;line-height:1}
.rbtn:disabled{opacity:.3}
#spin{width:108px;height:108px;border-radius:50%;border:5px solid #ffe9a8;background:radial-gradient(circle at 35% 30%,#ffe27a,#f0a500 60%,#b36a00);color:#5c0a10;font-weight:900;font-size:1.05rem;cursor:pointer;box-shadow:0 6px 0 #6b4500,0 0 26px rgba(245,200,69,.6)}
#spin:disabled{background:#8a6a1f;cursor:wait}
#bigwin,#bonusmodal{position:fixed;inset:0;display:none;place-items:center;background:rgba(40,4,7,.82);z-index:40}
#bigwin.show,#bonusmodal.show{display:grid}
#bigwin .t{font-size:3rem;font-weight:900;color:#ffd968;text-shadow:0 3px 0 #7a4a00,0 0 34px #ff9d00;text-align:center}
#bigwin .v{font-size:2rem;font-weight:900;color:#fff;text-align:center}
.env{font-size:56px;cursor:pointer;background:none;border:0;padding:6px 12px;transition:transform .15s}
.env:hover{transform:scale(1.2)}
.coin{position:fixed;top:-40px;z-index:50;pointer-events:none;animation:coinfall linear infinite}
@keyframes coinfall{0%{transform:translateY(-5vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}
.pay{width:100%;max-width:340px;margin-top:18px;border:1px solid #8a6a1f;border-radius:12px;padding:10px 14px;background:rgba(0,0,0,.4);font-size:.82rem}
.pay div{display:flex;justify-content:space-between;padding:2px 0}
.pay strong{color:#ffd968}
.hist{width:100%;max-width:340px;margin-top:14px;border:1px solid #8a6a1f;border-radius:12px;padding:10px 14px;background:rgba(0,0,0,.4);font-size:.78rem}
.hist table{width:100%;border-collapse:collapse}
.hist td,.hist th{padding:3px 4px;text-align:center;color:#ffe9b0}
.hist th{color:#e8b96a;font-size:.68rem;letter-spacing:.1em}
.back{margin-top:16px;font-size:.8rem;color:#e8b96a;text-align:center}
</style>
</head>
<body>
<video id="bgvideo" src="/fundo.mp4" autoplay muted loop playsinline></video>
<div class="panel">
<audio id="winSound" src="/win.mp3" preload="auto"></audio>
<audio id="endSound" src="/end.mp3" preload="auto"></audio>
<audio id="poetaSound" src="/poeta.mp3" preload="auto"></audio>
<audio id="risadaSound" src="/risada.mp3" preload="auto"></audio>
<audio id="bgMusic" src="/win.mp3" loop preload="auto"></audio>
<button id="mutebtn" style="position:fixed;top:12px;right:12px;z-index:70;width:44px;height:44px;border-radius:50%;border:2px solid #f5c445;background:rgba(0,0,0,.6);font-size:20px;cursor:pointer">🔊</button>
<div id="start" style="position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#c22530 0%,#4a060c 100%)">
<div style="text-align:center;padding:20px">
<img src="/tigre.png" alt="Tigre" style="width:130px;height:130px;object-fit:cover;border-radius:50%;border:4px solid #ffe9a8;box-shadow:0 0 30px rgba(245,200,69,.8)">
<div style="font-size:2.4rem;font-weight:900;color:#ffd968;margin-top:12px;text-shadow:0 2px 0 #7a4a00,0 0 22px rgba(255,200,60,.55)">BOLSOLUCKS</div>
<div style="color:#e8b96a;font-size:.85rem;margin:6px 0 20px">saldo demo 50 · giros grátis · jackpot · bônus</div>
<button id="playbtn" style="min-width:220px;min-height:60px;border-radius:999px;border:4px solid #ffe9a8;background:linear-gradient(180deg,#ffcf4d,#e08a00);color:#5c0a10;font-weight:900;font-size:1.4rem;cursor:pointer;box-shadow:0 6px 0 #6b4500,0 0 26px rgba(245,200,69,.6)">▶ JOGAR</button>
</div>
</div>
<div class="orn">✦ ✦ ✦</div>
<div class="mascot"><img src="/tigre.png" alt="Tigre" style="width:100%;height:100%;object-fit:cover;border-radius:50%"></div>
<h1>BOLSOLUCKS</h1>
<div class="sub">NODE.JS · 3×3 · JACKPOT · GIROS GRATIS</div>
<div class="jack">💰 JACKPOT <span id="jack">500.00</span></div>
<div id="fsbar">🎁 GIROS GRATIS: <span id="fsn">0</span> (ganhos ×2)</div>
<div class="frame"><div class="grid" id="grid"></div></div>
<div class="stat">
<div class="box"><small>SALDO</small><br><b id="bal">50.00</b></div>
<div class="box"><small>GANHO</small><br><b id="win">0.00</b></div>
</div>
<div id="msg">Aperte GIRAR e boa sorte!</div>
<button id="reloadBtn" style="display:none;margin-top:10px;padding:12px 30px;border-radius:999px;border:2px solid #7CFC00;background:rgba(0,0,0,.5);color:#7CFC00;font-weight:900;font-size:1rem;cursor:pointer">＋ RECARREGAR 50 DEMO</button>
<div class="controls">
<div class="ctl"><small>APOSTA</small><div class="val"><button class="rbtn" id="minus">−</button><span id="bet">10</span><button class="rbtn" id="plus">+</button></div></div>
<button id="spin"><img src="/tigre.png" alt="Tigre" style="width:44px;height:44px;object-fit:cover;border-radius:50%;vertical-align:middle"><br>GIRAR</button>
<div class="ctl"><small>RODADAS</small><div class="val" id="rounds">0</div></div>
</div>
<div class="pay">${PAY_ROWS}<div><span>${ANAO_IMG_SM} Estrela ×3 em qualquer lugar</span><strong>+10 grátis</strong></div><div><span>${TIGER_IMG_SM} Tigre ×3 em qualquer lugar</span><strong>bônus</strong></div><div style="margin-top:6px;color:#ffd968;font-size:.78rem">Grade cheia igual: prêmio <strong>×10</strong> + fatia do jackpot (tigre cheia = tudo) · 5 linhas</div></div>
<div class="hist"><table><tr><th>#</th><th>APOSTA</th><th>GANHO</th><th>INFO</th></tr><tbody id="hist"></tbody></table></div>
<div class="back">Saldo ficticio · jogo proprio, sem relacao com PG Soft · <b>node server.js</b></div>
</div>
<div id="bigwin"><div><div class="t" id="bigt">BIG WIN</div><div class="v" id="bigval"></div><div style="text-align:center"><img src="/tigre.png" alt="Tigre" style="width:64px;height:64px;object-fit:cover;border-radius:50%;vertical-align:middle"><img src="/rainha.jpg" alt="Moedas" style="width:64px;height:64px;object-fit:cover;border-radius:12px;vertical-align:middle"><img src="/tigre.png" alt="Tigre" style="width:64px;height:64px;object-fit:cover;border-radius:50%;vertical-align:middle"></div></div></div>
<div id="bonusmodal"><div style="text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#ffd968">🎁 BONUS DO TIGRE 🎁</div><div style="color:#ffe9b0;margin:6px 0 12px">Escolha um envelope!</div><div><button class="env" data-c="0">${ARMA_IMG_BTN}</button><button class="env" data-c="1">${ARMA_IMG_BTN}</button><button class="env" data-c="2">${ARMA_IMG_BTN}</button></div><div id="bonusres" style="margin-top:10px;font-weight:900;color:#7CFC00"></div></div></div>
<script>
const ICONS = ${JSON.stringify(SYMBOLS.map((s) => s.icon))};
const TIG = ${JSON.stringify(TIGER_IMG)};
ICONS[0] = TIG; // simbolo Tigre vira a foto
const ARMA = ${JSON.stringify(ARMA_IMG)};
ICONS[1] = ARMA; // simbolo Envelope vira a foto (tamanho da grade)
const CORA = ${JSON.stringify(CORACAO_IMG)};
ICONS[5] = CORA; // simbolo Lanterna vira a foto (tamanho da grade)
const MASC = ${JSON.stringify(MASC_IMG)};
ICONS[3] = MASC; // simbolo Laranja vira a foto (tamanho da grade)
const DOMI = ${JSON.stringify(DOM_IMG)};
ICONS[2] = DOMI; // simbolo Fogos vira a foto (tamanho da grade)
const RAI = ${JSON.stringify(RAINHA_IMG)};
ICONS[4] = RAI; // simbolo Moedas vira a foto (tamanho da grade)
const ANA = ${JSON.stringify(ANAO_IMG)};
ICONS[6] = ANA; // simbolo Estrela vira a foto (tamanho da grade)
function sym(i) { return ICONS[i]; }
const BETS = ${JSON.stringify(BETS)};
let betIdx = 3, spinning = false, rounds = 0;
const grid = document.getElementById('grid');
const cells = [];
for (let i = 0; i < 9; i++) { const d = document.createElement('div'); d.className = 'cell'; d.innerHTML = CORA; grid.appendChild(d); cells.push(d); }
function setBet(d) { betIdx = Math.min(BETS.length - 1, Math.max(0, betIdx + d)); document.getElementById('bet').textContent = BETS[betIdx]; }
document.getElementById('minus').onclick = () => setBet(-1);
document.getElementById('plus').onclick = () => setBet(1);
function coins(n) { document.querySelectorAll('.coin').forEach((e) => e.remove()); for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'coin'; const sz = (18 + ((i * 13) % 22)); s.innerHTML = '<img src="/rainha.jpg" style="width:' + sz + 'px;height:' + sz + 'px;object-fit:cover;border-radius:8px">'; s.style.left = ((i * 97) % 100) + '%'; s.style.animationDuration = (1.6 + ((i * 7) % 10) / 10) + 's'; s.style.animationDelay = ((i % 12) * 0.18) + 's'; document.body.appendChild(s); } }
function stopCoins() { document.querySelectorAll('.coin').forEach((e) => e.remove()); }
function fsbar(n) { const b = document.getElementById('fsbar'); if (n > 0) { b.style.display = 'block'; document.getElementById('fsn').textContent = n; } else b.style.display = 'none'; }
async function hist() { try { const r = await fetch('/api/history'); const j = await r.json(); document.getElementById('hist').innerHTML = j.map((h, i) => '<tr><td>' + (rounds - i) + '</td><td>' + (h.free ? 'GRÁTIS' : h.bet) + '</td><td>' + h.win.toFixed(2) + '</td><td>' + [h.jackpot > 0 ? '💰' : '', h.fsWon > 0 ? '🎁+' + h.fsWon : '', h.bonus ? '🧧' : '', h.x10 ? 'x10' : ''].filter(Boolean).join(' ') + '</td></tr>').join(''); } catch (e) {} }
let started = false;
function sfx(id) { try { const bg = document.getElementById('bgMusic'); bg.pause(); const a = document.getElementById(id); a.onended = () => { try { if (started && !bg.muted) bg.play().catch(() => {}); } catch (e) {} }; a.currentTime = 0; a.play().catch(() => {}); } catch (e) {} }
document.getElementById('playbtn').onclick = async () => {
  document.getElementById('start').style.display = 'none';
  try { await fetch('/api/reset', { method: 'POST' }); } catch (e) {}
  try { const r = await fetch('/api/state'); const j = await r.json(); document.getElementById('bal').textContent = j.balance.toFixed(2); document.getElementById('jack').textContent = j.jackpot.toFixed(2); fsbar(j.freeSpins); } catch (e) {}
  hist();
  updateReload();
  started = true;
  try { const bg = document.getElementById('bgMusic'); bg.volume = 0.35; bg.muted = false; document.getElementById('mutebtn').textContent = '🔊'; await bg.play(); } catch (e) {}
};
document.getElementById('mutebtn').onclick = () => { const bg = document.getElementById('bgMusic'); bg.muted = !bg.muted; document.getElementById('mutebtn').textContent = bg.muted ? '🔇' : '🔊'; if (!bg.muted && started) bg.play().catch(() => {}); };
function updateReload() { try { const b = parseFloat(document.getElementById('bal').textContent) || 0; document.getElementById('reloadBtn').style.display = b < 1 ? 'block' : 'none'; } catch (e) {} }
document.getElementById('reloadBtn').onclick = async () => {
  try { const r = await fetch('/api/reload', { method: 'POST' }); const j = await r.json(); document.getElementById('bal').textContent = j.balance.toFixed(2); document.getElementById('msg').textContent = 'Saldo recarregado! +50 demo. Boa sorte! 🐯'; updateReload(); } catch (e) {}
};
document.getElementById('spin').onclick = async () => {
  if (spinning) return; spinning = true;
  try { const s = document.getElementById('winSound'); s.pause(); s.currentTime = 0; } catch (e) {}
  try { const s = document.getElementById('endSound'); s.pause(); s.currentTime = 0; } catch (e) {}
  try { const s = document.getElementById('poetaSound'); s.pause(); s.currentTime = 0; } catch (e) {}
  try { const s = document.getElementById('risadaSound'); s.pause(); s.currentTime = 0; } catch (e) {}
  document.getElementById('spin').disabled = true;
  document.getElementById('msg').textContent = 'Girando... 🎰';
  document.getElementById('bigwin').classList.remove('show'); stopCoins();
  cells.forEach((c) => { c.classList.remove('win'); c.classList.add('blur'); });
  const iv = setInterval(() => cells.forEach((c) => (c.innerHTML = sym(Math.floor(Math.random() * ICONS.length)))), 100);
  try {
    const r = await fetch('/api/spin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bet: BETS[betIdx] }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'erro');
    await new Promise((ok) => setTimeout(ok, 900));
    clearInterval(iv);
    j.grid.forEach((s, i) => { cells[i].innerHTML = sym(s); cells[i].classList.remove('blur'); });
    j.winCells.forEach((i) => cells[i].classList.add('win'));
    rounds++;
    document.getElementById('rounds').textContent = rounds;
    document.getElementById('win').textContent = j.win.toFixed(2);
    document.getElementById('win').style.color = j.win > 0 ? '#7CFC00' : '#ffe9b0';
    document.getElementById('bal').textContent = j.balance.toFixed(2);
    document.getElementById('jack').textContent = j.jackpot.toFixed(2);
    fsbar(j.freeSpins);
    let msg = j.win > 0 ? 'Ganhou ' + j.win.toFixed(2) + ' demo!' : 'Sem linha premiada. Gire de novo!';
    if (j.x10) msg = 'TIGER x10! ' + TIG + ' ' + msg;
    if (j.jackpotHit > 0) msg = '💰 JACKPOT! +' + j.jackpotHit.toFixed(2) + '! ' + msg;
    if (j.fsWon > 0) msg += ' 🎁 +' + j.fsWon + ' GIROS GRATIS!';
    document.getElementById('msg').innerHTML = msg;
    if (j.balance <= 0) sfx('endSound');
    else if (j.win > 0) sfx('poetaSound');
    else sfx('risadaSound');
    if (j.bigWin || j.jackpotHit > 0) { document.getElementById('bigt').textContent = j.jackpotHit > 0 ? 'JACKPOT!' : 'BIG WIN'; document.getElementById('bigval').textContent = j.win.toFixed(2); document.getElementById('bigwin').classList.add('show'); coins(36); setTimeout(() => { document.getElementById('bigwin').classList.remove('show'); stopCoins(); }, 3500); }
    hist();
    if (j.bonusReady) {
      document.getElementById('bonusres').textContent = '';
      document.getElementById('bonusmodal').classList.add('show');
    }
  } catch (e) { clearInterval(iv); const m = e.message || 'Erro de conexao.'; document.getElementById('msg').textContent = m; if (m.toLowerCase().indexOf('saldo') !== -1) sfx('endSound'); }
  spinning = false; document.getElementById('spin').disabled = false; updateReload();
};
document.querySelectorAll('.env').forEach((b) => (b.onclick = async () => {
  const r = await fetch('/api/bonus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice: Number(b.dataset.c) }) });
  const j = await r.json();
  document.getElementById('bonusres').textContent = 'Envelope ' + (Number(b.dataset.c) + 1) + ': ' + j.mult + 'x = +' + j.prize.toFixed(2) + ' (eram ' + j.prizes.join('x, ') + 'x)';
  document.getElementById('bal').textContent = j.balance.toFixed(2);
  document.getElementById('jack').textContent = j.jackpot.toFixed(2);
  hist();
  setTimeout(() => document.getElementById('bonusmodal').classList.remove('show'), 3000);
}));
(async () => { try { const r = await fetch('/api/state'); const j = await r.json(); document.getElementById('bal').textContent = j.balance.toFixed(2); document.getElementById('jack').textContent = j.jackpot.toFixed(2); fsbar(j.freeSpins); } catch (e) {} })();
hist();
</script>
</body>
</html>`;

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8' });
  res.end(body);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch { reject(new Error('JSON invalido.')); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  try {
    if (req.method === 'GET' && url.pathname === '/') return send(res, 200, 'text/html', PAGE);
    if (req.method === 'GET' && url.pathname === '/tigre.png') {
      if (!TIGER_PHOTO) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
      return res.end(TIGER_PHOTO);
    }
    if (req.method === 'GET' && url.pathname === '/arminha.jpg') {
      if (!ARMA_PHOTO) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(ARMA_PHOTO);
    }
    if (req.method === 'GET' && url.pathname === '/coracao.jpg') {
      if (!CORACAO_PHOTO) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(CORACAO_PHOTO);
    }
    if (req.method === 'GET' && url.pathname === '/mascara.jpg') {
      if (!MASC_PHOTO) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(MASC_PHOTO);
    }
    if (req.method === 'GET' && url.pathname === '/domingo.jpg') {
      if (!DOM_PHOTO) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(DOM_PHOTO);
    }
    if (req.method === 'GET' && url.pathname === '/rainha.jpg') {
      if (!RAINHA_PHOTO) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(RAINHA_PHOTO);
    }
    if (req.method === 'GET' && url.pathname === '/anao.jpg') {
      if (!ANAO_PHOTO) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(ANAO_PHOTO);
    }
    if (req.method === 'GET' && url.pathname === '/win.mp3') {
      if (!WIN_SOUND) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(WIN_SOUND);
    }
    if (url.pathname === '/fundo.mp4') {
      // Streaming com suporte a Range (video de fundo, arquivo grande: nao carrega na RAM)
      try {
        const st = fs.statSync(path.join(__dirname, '0927.mp4'));
        const range = req.headers.range;
        if (range) {
          const m = range.match(/bytes=(\d*)-(\d*)/);
          const start = m && m[1] ? parseInt(m[1], 10) : 0;
          const end = m && m[2] ? parseInt(m[2], 10) : Math.min(start + 4 * 1024 * 1024 - 1, st.size - 1);
          res.writeHead(206, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Cache-Control': 'public, max-age=86400' });
          return fs.createReadStream(path.join(__dirname, '0927.mp4'), { start, end }).pipe(res);
        }
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': st.size, 'Cache-Control': 'public, max-age=86400' });
        return fs.createReadStream(path.join(__dirname, '0927.mp4')).pipe(res);
      } catch (e) {
        res.writeHead(404); return res.end();
      }
    }
    if (req.method === 'GET' && url.pathname === '/end.mp3') {
      if (!END_SOUND) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(END_SOUND);
    }
    if (req.method === 'GET' && url.pathname === '/poeta.mp3') {
      if (!POETA_SOUND) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(POETA_SOUND);
    }
    if (req.method === 'GET' && url.pathname === '/risada.mp3') {
      if (!RISADA_SOUND) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(RISADA_SOUND);
    }
    if (req.method === 'GET' && url.pathname === '/api/state') {
      return send(res, 200, 'application/json', JSON.stringify({ balance, bets: BETS, jackpot, freeSpins, pendingBonus: !!pendingBonus }));
    }
    if (req.method === 'GET' && url.pathname === '/api/history') {
      return send(res, 200, 'application/json', JSON.stringify(history));
    }
    if (req.method === 'POST' && url.pathname === '/api/reset') {
      balance = 50; freeSpins = 0; freeBet = 0; pendingBonus = null; history = [];
      return send(res, 200, 'application/json', JSON.stringify({ balance, jackpot, freeSpins }));
    }
    if (req.method === 'POST' && url.pathname === '/api/reload') {
      balance = Math.round((balance + 50) * 100) / 100;
      return send(res, 200, 'application/json', JSON.stringify({ balance, jackpot, freeSpins }));
    }
    if (req.method === 'POST' && url.pathname === '/api/spin') {
      if (pendingBonus) return send(res, 409, 'application/json', JSON.stringify({ error: 'Escolha o envelope do bonus antes de girar.' }));
      const { bet } = await readJson(req);
      const isFree = freeSpins > 0;
      const useBet = isFree ? freeBet : bet;
      if (!isFree && !BETS.includes(bet)) return send(res, 400, 'application/json', JSON.stringify({ error: 'Aposta invalida. Use: ' + BETS.join(', ') }));
      if (!isFree && useBet > balance) return send(res, 400, 'application/json', JSON.stringify({ error: 'Saldo demo insuficiente.' }));
      if (isFree && freeBet <= 0) return send(res, 400, 'application/json', JSON.stringify({ error: 'Aposta dos giros gratis invalida.' }));
      return send(res, 200, 'application/json', JSON.stringify(spin(useBet, isFree)));
    }
    if (req.method === 'POST' && url.pathname === '/api/bonus') {
      const { choice } = await readJson(req);
      const out = pickBonus(choice);
      if (out.error) return send(res, 400, 'application/json', JSON.stringify({ error: out.error }));
      return send(res, 200, 'application/json', JSON.stringify(out));
    }
    return send(res, 404, 'application/json', JSON.stringify({ error: 'Rota nao encontrada.' }));
  } catch (e) {
    return send(res, 400, 'application/json', JSON.stringify({ error: e.message || 'Requisicao invalida.' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`BolsoLucks (Node.js) rodando em http://${HOST}:${PORT}/`);
});
