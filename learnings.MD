

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

