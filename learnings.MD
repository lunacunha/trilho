

- Node.js : motor que corre JavaScript fora do browser (põe o Next.js a funcionar quando fazes npm run dev)

- npm : gestor de pacotes 
    - package.json: a lista do que o projeto precisa (ex.: driver do Neon)
    - node_modules/: os pacotes descarregados (não vai para o git)

- Next.js : framework da app + faz os ecrãs (React) e a parte de servidor (a API) tudo no mesmo projeto
    - dentro de src/app : as pastas são os URLs (ex.: src/app/api/health/route.ts responde em /api/health)

- TypeScript : JavaScript com tipos (apanha erros antes de se correr o código)

- Tailwind: a forma de dar estilo aos ecrãs

# base de dados

- PostgreSQL: motor de base de dados onde vivem as tabelas

- Neon: a empresa que te aloja o PostgreSQL (grátis)

- Branches : production + dev + test
    - production = cópia da base de dados com os dados reais

- Driver (@neondatabase/serverless): a biblioteca que deixa o código falar com o Neon

- Connection string: morada e password da base de dados (postgresql://...)

# hidden

- .env.local : onde está a connection string (cofre)
    - a linha .env* no .gitignore impede o cofre de ir para o github

# online

- vercel : vai buscar código ao github e põe-no na internet
    - variáveis de ambiente do vercel : cofre de produção -> o .env.local nunca chega ao vecel (connection string tem de ser posta lá à parte)
    - região fra1 = onde o vercel corre o código (fica ao lado do neon)


quando se abre a app:   

Telemóvel ──► Vercel (Frankfurt) ──► route.ts ──► driver ──► Neon (Frankfurt)
    ▲                                                            │
    └───────────────── JSON {"status":"ok"} ◄────────────────────┘


quando se muda o código:

git commit ──► GitHub ──► Vercel faz o build ──► URL atualizado

"npm run dev" : modo de desenvolvimento que carrega o código sozinho
"npm run build": prepara a versão de produção + é o que o vercel corre
    - se o build passa no mac -> passa no vercel



- Spec-driven development: o SPEC é a fonte de verdade. Quando o agente encontra uma ambiguidade, inventa uma resposta. Cada regra que escreves é uma decisão que o agente deixa de tomar por ti.

- Given/When/Then: o formato dos critérios de aceitação. Given é o contexto, When a ação e Then o resultado. Cada cenário vira um teste na Fase 4, quase palavra a palavra.

- Regra de negócio: uma definição usada por várias histórias. Por exemplo, “primeira resposta” é usada pela US06, pela US07 e pelos lembretes. Fica escrita uma vez, com um ID, e as histórias referem-na.
Máquina de estados: a lista de estados de uma candidatura e as mudanças permitidas entre eles.

- Camadas: cada pedido atravessa camadas com responsabilidades separadas. A lógica de negócio vive numa camada própria (services), não nos ecrãs. Assim testa-se sem browser e reutiliza-se na API dos próximos assignments.


1. UI (app/, components/)       → mostra e recolhe dados. Sem lógica de negócio.
2. Entrada (Server Actions,      → recebe o pedido, verifica quem é o utilizador,
   Route Handlers)                 chama um service. Fina.
3. Services (lib/services/)      → a lógica de negócio: permissões, regras, transações.
   + Rules (lib/rules/)          → as regras R1–R10 como funções puras (sem base de dados).
4. Dados (db/)                   → o esquema das tabelas (Drizzle) e a ligação ao Neon.