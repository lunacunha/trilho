

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

- as migrations criam a base de dados do zero, o seed enche-a com dados fictícios realistas

- Chave primária (PK): o identificador único de cada linha. Por exemplo, o id de uma candidatura.
- Chave estrangeira (FK): uma coluna que aponta para a PK de outra tabela. Por exemplo, application.user_id aponta para user.id. A base de dados garante que aponta para algo que existe: é a integridade referencial.
- ON DELETE: o que acontece às linhas que apontam para uma linha apagada.
    - CASCADE: apaga-as também. Por exemplo, apagar a conta apaga as candidaturas (US08).
    - RESTRICT: impede a eliminação. Por exemplo, não se apaga uma empresa que tem candidaturas.
    - SET NULL: mantém a linha, mas esvazia a ligação.
- Restrições: NOT NULL (obrigatório), UNIQUE (sem repetidos) e CHECK (uma condição, por exemplo um comprimento ≤ 120). Ficam na base de dados como última linha de defesa, mesmo que o código tenha um erro.
- Normalização: cada facto guarda-se num só sítio. O nome “Lumen Energy” vive uma vez na tabela company; as candidaturas guardam só o ID. Se o nome mudar, muda num sítio.
- Porque é que o histórico é uma tabela e não colunas: uma candidatura pode ter 1, 3 ou 7 mudanças de estado. Com colunas (data_sent, data_interview...) não cabem repetições nem idas e voltas (a R6 permite-as). Com uma tabela status_change, cada mudança é uma linha. É daí que a R1 calcula o tempo de resposta.
- Índice: um “sumário” que torna as pesquisas rápidas. Cria-se nas colunas usadas para procurar, por exemplo application.user_id, porque o pipeline procura as candidaturas de uma estudante.
- Ligação ao resto
    - As tabelas implementam o SPEC: as regras R1–R12 leem-nas, os eventos da secção 9 vivem numa delas, e a US08 depende do ON DELETE. Na Fase 4, os testes de integração correm contra a branch test com estas tabelas.

- nota no data model: o reminder aponta para a candidatura e para a mudança de estado, mas a mudança de estado já pertence a uma candidatura. É uma pequena redundância, com o mesmo raciocínio do current_status: torna as queries mais simples (“lembretes desta candidatura”), e é o service que garante que as duas ligações batem certo, porque a base de dados não o verifica sozinha

- variáveis do Better Auth
    - BETTER_AUTH_SECRET: uma chave secreta aleatória. Quando alguém faz login, o Better Auth entrega ao browser um “bilhete” (o cookie de sessão) assinado com esta chave. Em cada pedido seguinte, verifica a assinatura para saber que o bilhete é verdadeiro. Quem souber a chave consegue falsificar bilhetes e entrar como qualquer pessoa. Por isso é secreta e nunca vai para o Git.
    - BETTER_AUTH_URL: o endereço da app. O Better Auth usa-o para construir links (por exemplo, o link de verificação no email) e para confirmar que os pedidos vêm do sítio certo.


fase 4: fazer testes a partir da spec 

- objetivo: cada critério de aceitação e cada regra do SPEC passa a ter um teste com o seu ID, escrito antes do código que o implementa. No fim desta fase, os testes existem e falham pela razão certa. Na Fase 5, cada fatia fá-los passar.

- Teste unitário: testa uma peça isolada, sem base de dados. As tuas regras são funções puras, por isso testam-se assim: “mediana 17 → ‘2–3 weeks’”. Correm em milissegundos.
- Teste de integração: testa várias peças juntas, aqui os services contra a branch test do Neon. É mais lento, mas é o único que apanha erros como “a estudante B consegue ver a candidatura da A”.
- Given/When/Then = Arrange/Act/Assert. Os cenários do SPEC já estão escritos na forma de um teste: preparar os dados, executar a ação e verificar o resultado.
- TDD, red → green: escreve-se o teste primeiro e vê-se a falhar (vermelho), depois implementa-se até passar (verde). O ponto importante é falhar pela razão certa. Um teste que falha com “erro de sintaxe” ou “ficheiro não encontrado” não prova nada. Um teste que falha com “Not implemented” prova que está pronto e só espera pelo código. Por isso o agente vai criar as funções vazias (stubs) que só lançam esse erro.
- Os testes definem a interface. Ao escrever getPipeline(user, today) num teste, estás a decidir como o service se vai chamar antes de ele existir. O plano do agente vai propor essas assinaturas, e convém revê-las.
- Isolamento: cada teste de integração começa com a base de dados limpa e cria só os dados de que precisa (2 estudantes, 1 empresa...). Não usa o seed grande. Assim, quando um teste falha, sabes exatamente porquê.
- Ligação ao resto
    - Os testes leem o SPEC (os IDs e os exemplos numéricos), usam as tabelas da Fase 3 e são o critério de “feito” de cada fatia da Fase 5: uma fatia só está pronta quando os testes dela ficam verdes.