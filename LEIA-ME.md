# Pacote Tiger Luck Slot (jogo proprio, original)

## Versao Node.js standalone (recomendada para teste)

Pasta `node/` — o Tigrinho em **Node.js puro, zero PHP**: um unico arquivo,
sem `npm install`, sem banco.

```powershell
cd "$env:USERPROFILE\Documents\tigrinho\node"
node server.js
```

Abra **http://127.0.0.1:3002/** — painel retrato vermelho/ouro, grade 3x3,
botao GIRAR, aposta −/+, TIGER x10 na grade cheia e BIG WIN com chuva de moedas.

- Lógica: `GET /api/state` (saldo + apostas) e `POST /api/spin {"bet": 10}`
  (sorteio ponderado, 5 linhas, x10 em grade cheia). Saldo demo 1000 em memoria.
- Para parar: `Get-Process -Name node | Stop-Process` (cuidado se o Vite do outro
  projeto estiver rodando — ele tambem e `node`; confira a porta 3002 antes).

## Conteudo desta pasta (integracao com o cassino principal)

| Arquivo | Destino no projeto principal |
|---|---|
| `tiger_slot.sql` | `install/tiger_slot.sql` |
| `tiger_luck_slot.svg` | `assets/images/game/tiger_luck_slot.svg` |
| `tiger_slot.blade.php` | `core/resources/views/templates/basic/user/games/tiger_slot.blade.php` |
| `tigrinho-modificacoes.patch` | patch com as edicoes em 4 arquivos existentes (aplica com `git apply`) |

Os 4 arquivos editados pelo patch:

- `core/app/Http/Controllers/User/PlayController.php` — metodos `playTigerSlot` + `gameEndTigerSlot` e ajuste no `invest()` para salvar o resultado em JSON
- `backend/src/game/game.service.ts` — `createTigerSlotRound` + `settleTigerSlot`
- `backend/src/game/game.controller.ts` — rotas `POST /games/tiger_slot/invest` e `/settle`
- `frontend/src/App.tsx` — modal, rotas e campo "numero da sorte (0-9)"

## Como colocar no projeto principal (maquina do seu amigo, com Docker)

1. Copie esta pasta `tigrinho` para a maquina dele (pendrive, zip, etc).
2. Na raiz do repositorio (onde fica a pasta `casino/`), copie os 3 arquivos novos:
   - `tigrinho/tiger_slot.sql` → `casino/install/tiger_slot.sql`
   - `tigrinho/tiger_luck_slot.svg` → `casino/assets/images/game/tiger_luck_slot.svg`
   - `tigrinho/tiger_slot.blade.php` → `casino/core/resources/views/templates/basic/user/games/tiger_slot.blade.php`
3. Aplique as edicoes nos 4 arquivos existentes:
   ```powershell
   git apply C:\caminho\para\tigrinho\tigrinho-modificacoes.patch
   git status --short
   ```
   (Se `git apply` reclamar, abra o `.patch` num editor: ele mostra arquivo por arquivo o que entra (+) e onde.)
4. Importe o jogo no banco do Docker (rode na pasta `backend/`, onde esta o `docker-compose.yml`).
   Confira antes o usuario/senha no `.env` dele (`DATABASE_URL`). Com os valores padrao do compose:
   ```powershell
   Get-Content ..\casino\install\tiger_slot.sql | docker exec -i casino_mysql mysql -uapp -papp_password casino
   ```
   Confira: `docker exec -i casino_mysql mysql -uapp -papp_password casino -e "SELECT id,name,alias,status FROM games;"`
   Tem que aparecer a linha do `tiger_slot`.
5. Rebuild da API (o backend precisa recompilar com o codigo novo):
   ```powershell
   docker compose up -d --build api
   docker logs casino_api --tail 30
   ```
6. Frontend: nada a instalar — na proxima abertura a lista de jogos ja traz o Tiger Luck Slot.
   O Laravel legado atende em `play/game/tiger_slot` automaticamente (a rota e generica por alias).

Nao precisa de `npm install` novo nem de variavel de ambiente nova. O estorno automatico de 2 minutos ja cobre o Tiger sem mudanca.

## Como voce conecta o seu frontend no Docker dele (para testar)

O `docker-compose.yml` publica a API na porta **3000** do PC dele. Passos:

1. **No PC dele:** confirme os containers no ar (`docker ps` — `casino_api` e `casino_mysql`),
   pegue o IPv4 da rede local (`ipconfig` → `IPv4`, ex: `192.168.2.50`) e libere a porta 3000
   no Firewall do Windows (entrada TCP 3000). Voces precisam estar na **mesma rede** (mesmo Wi-Fi).
2. **No seu PC:** teste o alcance:
   ```powershell
   Invoke-WebRequest -Uri "http://192.168.2.50:3000/games" -UseBasicParsing -TimeoutSec 10
   ```
   (troque pelo IP dele). Tem que retornar 200 com a lista de jogos em JSON.
3. Aponte seu frontend para la, em `casino/frontend/.env.local`:
   ```env
   VITE_API_URL=http://192.168.2.50:3000
   ```
4. Reinicie seu servidor Vite (ele le o `.env.local` ao iniciar) e abra `http://127.0.0.1:5173/`.
   Login, saldo e apostas passam a usar o backend dele — inclusive o Tiger, depois do passo 4 acima.

Notas:

- O login usa o JWT do backend dele; nada muda no seu `.env` do backend local.
- Nao exponha a porta 3000 dele na internet (só rede local). Seu Vite continua so em `127.0.0.1`.
- Se o backend dele rodar em porta diferente (`.env` com `PORT=` outro), troque o `:3000` pelo valor certo.
