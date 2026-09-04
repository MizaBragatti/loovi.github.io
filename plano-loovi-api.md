# API de Contratos (Loovi) — Node + TypeScript + Express + Zod

## Contexto

O objetivo é criar uma API backend própria que expõe contratos ("agreements") no
mesmo formato de envelope de resposta usado pela API da Loovi (`success`,
`message`, `errorCode`, `data`, `timestamp`), e depois construir uma rotina de
**carga** que busca esses dados na API da Loovi e os persiste no nosso banco,
para que nossa própria API sirva esses dados sem depender de chamada síncrona
à Loovi a cada requisição.

Diretório atual (`C:\Users\Nicolas`) não é um repositório git nem contém
nenhum projeto — este é um projeto novo (greenfield). Assumi os seguintes
padrões por serem os mais comuns para esse tipo de stack; ajustável antes de
começar:

- **Local**: `C:\Users\Nicolas\projects\loovi-api`
- **Banco de dados**: PostgreSQL
- **ORM**: Prisma (boa integração com TS; schema declarativo; migrations)
- **Gerenciador de pacotes**: npm
- **HTTP client** para a Loovi: `axios`
- **Runtime dev**: `tsx` (watch mode) + `typescript`

## Stack e dependências

Produção: `express`, `zod`, `axios`, `@prisma/client`, `dotenv`, `pino`
(logger) + `pino-http`.
Dev: `typescript`, `tsx`, `prisma`, `@types/express`, `@types/node`,
`eslint`, tooling de teste (`vitest` + `supertest`).

## Estrutura de pastas

```
loovi-api/
  prisma/
    schema.prisma
  src/
    config/
      env.ts              # zod schema validando process.env (DATABASE_URL, LOOVI_BASE_URL, LOOVI_API_KEY, PORT...)
    schemas/
      contrato.schema.ts   # zod schema do "Contrato" (espelha o payload da Loovi)
      envelope.schema.ts    # zod schema genérico do envelope { success, message, errorCode, data, timestamp }
    types/
      contrato.types.ts     # tipos inferidos via z.infer
    lib/
      prisma.ts             # instância singleton do PrismaClient
      logger.ts             # instância do pino
      apiResponse.ts         # helpers ok(data, message) / fail(errorCode, message) que montam o envelope
      httpError.ts           # classe AppError { statusCode, errorCode, message }
    integrations/
      loovi/
        client.ts            # axios instance com baseURL + auth (interceptors)
        loovi.types.ts        # tipos da resposta crua da Loovi (reaproveita contrato.schema.ts)
        fetchContratos.ts     # função que pagina via cursor (nextCursor) e retorna todos os itens
    repositories/
      contrato.repository.ts # findMany (paginado/filtrado), findByAgreementNo, upsertMany
    services/
      contrato.service.ts    # regras de negócio para expor contratos via nossa API
      ingestao.service.ts     # orquestra: busca na Loovi -> valida com zod -> upsert em lote -> log de resultado
    middlewares/
      validate.ts             # middleware genérico que valida req.query/body/params com um schema zod
      errorHandler.ts          # error handler central -> sempre responde no formato do envelope
      notFound.ts
    routes/
      contratos.routes.ts     # GET /contratos, GET /contratos/:agreementNo
      carga.routes.ts          # POST /carga/contratos (dispara ingestão sob demanda)
      index.ts
    app.ts                    # cria o express app, monta middlewares e rotas
    server.ts                 # sobe o servidor HTTP (usa env.PORT)
    scripts/
      carga.ts                 # entrypoint de CLI (`npm run carga`) que roda a ingestão fora do servidor HTTP
  tests/
    contratos.routes.test.ts
    ingestao.service.test.ts
  .env.example
  package.json
  tsconfig.json
  .eslintrc / eslint.config.js
```

## Modelagem de dados (Prisma)

Modelo `Contrato` espelhando 1:1 os campos do payload de exemplo:

```prisma
model Contrato {
  id                  Int      @id @default(autoincrement())
  agreementNo         Int      @unique
  contratoNatural     String
  bpCode              String
  bpName              String
  startDate           DateTime
  endDate             DateTime
  status              String
  slp                 String
  dataInicioVigencia  DateTime
  dataFimVigencia     DateTime
  idIndicacao         String?
  idIndicacaoAfiliado String?
  placa               String?
  dataCancelamento    DateTime?
  telefone            String?
  email               String?
  linkApolice         String?
  inDebito            Boolean
  garantiaAtiva       Boolean
  valorRecorrencia    Decimal
  tipoPagamento       String

  criadoEm            DateTime @default(now())
  atualizadoEm        DateTime @updatedAt
}
```

`agreementNo` é a chave natural usada para `upsert` na carga (evita
duplicar contratos em cargas repetidas).

## Contrato de resposta (envelope)

`src/schemas/envelope.schema.ts` define um builder genérico:

```ts
function envelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().nullable(),
    data: dataSchema,
    timestamp: z.string(),
  });
}
```

Usado tanto para **validar** a resposta crua vinda da Loovi (dado externo,
não confiável) quanto para **tipar/gerar** a resposta da nossa própria API
(via `apiResponse.ts`), garantindo simetria entre o que a Loovi manda e o
que devolvemos.

`data` da listagem segue `{ itens: Contrato[], total: number, nextCursor:
string | null }`, igual ao exemplo fornecido.

## Endpoints da nossa API

- `GET /contratos` — lista contratos do nosso banco (paginação por cursor,
  filtros simples por `bpCode`/`status`/`placa` via query string validada
  com zod), resposta no envelope padrão.
- `GET /contratos/:agreementNo` — busca um contrato específico.
- `POST /carga/contratos` — dispara a ingestão sob demanda (chama
  `ingestao.service.ts`) e retorna um resumo (`inseridos`, `atualizados`,
  `falhas`) no envelope.

## Rotina de carga (ingestão da Loovi)

1. `integrations/loovi/client.ts` monta um `axios` client com `baseURL`
   (`LOOVI_BASE_URL`) e header de auth (`LOOVI_API_KEY`) vindos do env
   validado por `config/env.ts`.
2. `fetchContratos.ts` pagina usando o próprio `nextCursor` retornado pela
   Loovi até ele vir `null`, acumulando os itens.
3. Cada item bruto é validado com `contrato.schema.ts` (zod) — itens que
   falharem a validação são logados e pulados, não derrubam a carga inteira.
4. `contrato.repository.ts` faz `upsert` em lote por `agreementNo`
   (insere novo / atualiza existente).
5. `ingestao.service.ts` orquestra os passos acima e retorna um resumo.
6. Dois modos de disparo:
   - **Manual/HTTP**: `POST /carga/contratos`.
   - **CLI**: `npm run carga` (`src/scripts/carga.ts`), útil para rodar via
     Task Scheduler do Windows ou cron externo, sem precisar do servidor
     HTTP no ar.
   (Agendamento automático embutido no processo, ex. `node-cron`, fica como
   extensão futura opcional — não incluído nesta primeira versão para não
   assumir a frequência desejada.)

## Tratamento de erro

`AppError` (`lib/httpError.ts`) carrega `statusCode` + `errorCode` +
`message`. `errorHandler.ts` captura qualquer erro (incluindo falhas de
validação zod) e sempre responde no envelope com `success: false`,
`data: null`, `errorCode` preenchido — nunca um erro cru do Express.

## Passos de implementação

1. `npm init` + configurar `tsconfig.json`, `package.json` scripts (`dev`,
   `build`, `start`, `carga`, `test`).
2. Instalar dependências de produção/dev listadas acima.
3. Configurar Prisma (`npx prisma init`), escrever `schema.prisma` e rodar a
   primeira migration (requer uma instância Postgres — local via Docker ou
   já provisionada; confirmar com o usuário antes de rodar migration).
4. Implementar `config/env.ts`, `lib/*`, `schemas/*`, `types/*`.
5. Implementar `integrations/loovi/*` (client + paginação) — precisa da
   `LOOVI_BASE_URL` e forma de autenticação reais (API key, bearer token
   etc.) fornecidas pelo usuário; usar placeholders em `.env.example` até lá.
6. Implementar `repositories/contrato.repository.ts` e
   `services/{contrato,ingestao}.service.ts`.
7. Implementar `middlewares/*`, `routes/*`, `app.ts`, `server.ts`.
8. Implementar `scripts/carga.ts` (CLI de ingestão).
9. Escrever testes (`vitest` + `supertest`) para `GET /contratos` e para a
   lógica de ingestão (mockando o client da Loovi).
10. `README.md` com instruções de setup, variáveis de ambiente e como rodar
    a carga.

## Verificação

- `npm run build` (checagem de tipos/compilação TS sem erros).
- `npm test` (suíte vitest cobrindo rotas e serviço de ingestão).
- `npm run dev` + chamada manual (`curl`/Thunder Client) em
  `GET /contratos` confirmando o envelope de resposta.
- `npm run carga` contra a Loovi (ou um mock local do endpoint) para
  validar paginação, upsert e o resumo retornado.

## Pontos em aberto (preciso de você antes ou durante a implementação)

- Confirmar local do projeto, banco (Postgres é o assumido) e gerenciador
  de pacotes (npm assumido) — ou seguimos com os defaults acima.
- Dados reais de acesso à API da Loovi: `LOOVI_BASE_URL`, forma de
  autenticação (API key/bearer/OAuth) e o endpoint exato de listagem de
  contratos (path, query params de paginação/filtro).
- Se a carga deve rodar apenas sob demanda (HTTP/CLI) ou também em
  agendamento automático dentro do processo (ex.: a cada X horas).
