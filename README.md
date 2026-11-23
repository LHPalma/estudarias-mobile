# estudarias-mobile

O app do Estudarias para o aluno: uma plataforma adaptativa de estudo de matemática (TCC de ADS, FATEC São Caetano do Sul) que identifica o tipo de cada erro, explica aquele erro e agenda a revisão dele no momento certo.

Este repositório é o front-end: **Expo + TypeScript + React**, com Expo Router. Toda a regra (nota, desbloqueio, diagnóstico, agendamento das revisões) fica no back ([`LHPalma/estudarias`](https://github.com/LHPalma/estudarias)); o app mostra o que a API devolve.

## Documentação

- [`CONTRIBUTING.md`](CONTRIBUTING.md): convenção de branch, commits e PRs (a mesma do back).
- Contrato da API: [`docs/api.md`](https://github.com/LHPalma/estudarias/blob/main/docs/api.md) no back.
- Design: o canvas "Estudarias — app mobile (v1)", com o protótipo navegável e a folha de tokens e componentes.

## Rodando

Precisa do Node 22 e do app **Expo Go** no celular.

```bash
npm install
npm start
```

Leia o QR code com o Expo Go (Android) ou a câmera (iOS). Para abrir no navegador: `npm run web`.

## Demonstração no navegador

O app, em modo mock, está publicado no GitHub Pages: **<https://lhpalma.github.io/estudarias-mobile/>**. Não precisa instalar nada. Entre com **ana@example.com** e a senha **Senha@123**, ou cadastre outra conta.

- É o **modo mock** (veja Configuração): não há back por trás, e os dados vivem em memória e voltam ao começo ao recarregar a página. A sessão fica no `sessionStorage` da aba.
- O site é reconstruído e publicado a cada merge na `main` pelo workflow [`pages.yml`](.github/workflows/pages.yml), com `EXPO_PUBLIC_API_MOCK=true`. Em todo pull request o mesmo export roda sem publicar, para um erro de build aparecer antes do merge.
- O endereço tem o prefixo `/estudarias-mobile` (`experiments.baseUrl` no `app.json`), que só vale no export: `npm start` e `npm run web` seguem na raiz. O Pages não reescreve rotas, então o workflow copia o `index.html` para `404.html`, e o app abre em qualquer caminho (um link direto para `/estudarias-mobile/trail`, por exemplo), mesmo que o servidor responda `404` nele.
- Para reproduzir o build local: `EXPO_PUBLIC_API_MOCK=true npx expo export --platform web` gera a pasta `dist/`.
- Ligar o Pages num fork ou num repositório novo pede uma vez: Settings, Pages, Source: **GitHub Actions**.

## Configuração

As variáveis ficam num `.env.local` (fora do git); o `.env.example` traz um modelo. O Expo embute as `EXPO_PUBLIC_*` no app
na hora do build, então reinicie o `npm start` depois de mudar uma.

| Variável                 | Padrão                  | Para quê                                                                            |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`    | `http://localhost:5007` | a API do back. No celular, use o IP da sua máquina na rede                          |
| `EXPO_PUBLIC_API_MOCK`   | desligado               | `true` faz o app responder do modo mock, sem rede e sem o back                      |
| `EXPO_PUBLIC_MOCK_GROUP` | `diagnostic`            | no modo mock, o grupo do aluno (`diagnostic` ou `control`), que muda a tela de erro |

O **modo mock** segue o contrato e simula o ciclo com as regras do servidor (nota, domínio, desbloqueio e o flashcard criado
pelo erro), com o conteúdo de Frações do protótipo. É o jeito de rodar o app enquanto os endpoints não existem no back.

No modo mock já existe uma conta: **ana@example.com**, senha **Senha@123**. Também dá para cadastrar outra, que vale até
recarregar o app (o mock vive em memória).

### O mock acompanha o contrato da API

O teste `__tests__/api-contract-test.ts` compara o **formato** das respostas do mock (campos, tipos e links) com respostas reais
da API, gravadas em `__tests__/fixtures/api/`. Os valores não contam, só o formato. Quando o back mudar o contrato, grave as
respostas de novo, e o teste mostra o que o mock precisa acompanhar:

```bash
API_URL=http://localhost:5007 DATABASE_URL=postgresql://usuario:senha@localhost/banco node scripts/record-api-contract.mjs
```

O script precisa da API no ar com o conteúdo carregado (veja o README do back) e do `psql` no PATH: ele põe o aluno no grupo certo
e faz um cartão de revisão vencer direto no banco. As respostas gravadas não guardam token, e-mail nem `traceId`.

## Sessão

- O **access token** fica só em memória; o **refresh token** fica no cofre do sistema (`expo-secure-store`). No navegador,
  que só serve para desenvolver, fica no `sessionStorage`.
- Ao abrir, o app renova a sessão com o refresh token guardado e vai direto para a trilha; sem ele, vai para o login.
- Num `401`, o cliente renova a sessão **uma vez** e repete a chamada. Chamadas simultâneas esperam a mesma renovação,
  porque cada renovação troca o refresh token. Se o servidor recusar, o aluno volta ao login com o aviso "Sua sessão expirou".
- As telas do grupo `(app)` só abrem com sessão; as do `(auth)` mandam para a trilha quem já entrou.

## Verificações

```bash
npm run lint       # ESLint + Prettier
npm run typecheck  # TypeScript strict
npm test           # Jest + Testing Library
```

As três rodam no CI em todo pull request.

## Estrutura

```
src/
├── app/          # rotas do Expo Router (todo arquivo aqui é uma tela)
│   ├── (auth)/   # login e cadastro
│   ├── (app)/    # telas com sessão
│   │   └── (tabs)/   # abas Trilha e Revisão
│   └── dev/      # só em desenvolvimento: a galeria de componentes
├── api/          # cliente da API, tipos do contrato, hooks e o modo mock
├── components/   # os componentes do design (Button, TopicCard, MathText...)
├── features/     # as telas por assunto, sem rota nem busca de dados (trilha, mapa...)
├── lib/          # lógica sem tela (a marcação de frações, o desenho do mapa)
├── session/      # a sessão: tokens, renovação no 401 e o provider
├── services.ts   # monta a API e a sessão (reais ou do modo mock)
└── theme/        # tokens: cores, fontes, escala de texto, espaçamento
__tests__/        # testes (fora de src/app, que só tem rotas)
test-utils/       # apoio dos testes: abrir o app no modo mock, entrar, sessão guardada
```

## Design

O tema e os componentes seguem a folha "Tokens e componentes" do canvas. Com o app aberto em desenvolvimento, a rota
`/dev/components` mostra todos eles nos seus estados.

- **Cores e texto:** use os tokens de `@/theme` e o `AppText`, nunca cor ou tamanho soltos na tela.
- **Frações:** no conteúdo, `{1/2}` vira uma fração desenhada pelo `MathText`. É a mesma marcação do conteúdo no back.
- **Fontes:** Bricolage Grotesque e Instrument Sans vão empacotadas no app, carregadas antes da primeira tela.
