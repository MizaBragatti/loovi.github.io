# loovi-api

API de contratos ("agreements") que expõe dados no mesmo formato de envelope
(`success`, `message`, `errorCode`, `data`, `timestamp`) usado pela API da
Loovi, além de uma rotina de carga que busca os dados na Loovi e os persiste
localmente para servir sem depender de chamada síncrona a cada requisição.

> Status atual: projeto rodando **apenas localmente**. A integração real com
> a API da Loovi (`LOOVI_BASE_URL`, autenticação, path/query exatos do
> endpoint de contratos) ainda não foi ligada — ver seção "Integração com a
> Loovi (pendente)".

## Setup

```bash
npm install
cp .env.example .env   # ajuste DATABASE_URL, LOOVI_BASE_URL, LOOVI_API_KEY
npx prisma generate
npx prisma migrate dev --name init   # requer um Postgres acessível via DATABASE_URL
npm run dev
```

## Scripts

- `npm run dev` — sobe o servidor em modo watch (`tsx`).
- `npm run build` — compila TypeScript para `dist/`.
- `npm start` — roda o build compilado.
- `npm run carga` — executa a ingestão da Loovi via CLI (fora do servidor HTTP).
- `npm test` — roda a suíte de testes (vitest), com o client da Loovi e o
  repositório mockados — não depende de Postgres nem de rede.
- `npm run prisma:generate` / `npm run prisma:migrate` — atalhos do Prisma.

## Endpoints

- `GET /contratos` — lista contratos (filtros `bpCode`, `status`, `placa`;
  paginação por `cursor`/`take`).
- `GET /contratos/:agreementNo` — busca um contrato específico.
- `POST /carga/contratos` — dispara a ingestão sob demanda e retorna
  `{ inseridos, atualizados, falhas }`.

Todas as respostas seguem o envelope:

```json
{
  "success": true,
  "message": "OK",
  "errorCode": null,
  "data": { "...": "..." },
  "timestamp": "2026-09-02T12:00:00.000Z"
}
```

## Banco de dados

Modelo `Contrato` (ver `prisma/schema.prisma`) espelha 1:1 os campos do
payload da Loovi. `agreementNo` é a chave natural usada no `upsert` da carga.

Este ambiente não tinha um Postgres disponível durante a criação do
projeto, então a migration ainda **não foi executada**. Para rodar
localmente:

1. Suba um Postgres (ex.: `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`).
2. Ajuste `DATABASE_URL` no `.env`.
3. `npx prisma migrate dev --name init`.

## Integração com a Loovi (pendente)

`src/integrations/loovi/client.ts` e `fetchContratos.ts` já estão
implementados (client `axios` com `baseURL`/auth via env + paginação por
`nextCursor`), mas com placeholders:

- `LOOVI_BASE_URL` / `LOOVI_API_KEY` no `.env.example` são fictícios.
- O path do endpoint de listagem (`CONTRATOS_PATH` em `fetchContratos.ts`,
  hoje `/contratos`) e os query params de paginação/filtro reais ainda
  precisam ser confirmados com a Loovi antes de habilitar `POST
  /carga/contratos` ou `npm run carga` contra o ambiente real.

Até lá, `npm test` cobre as rotas e a lógica de ingestão com o client da
Loovi e o repositório mockados.
