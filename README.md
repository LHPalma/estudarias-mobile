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
├── lib/          # lógica sem tela (a marcação de frações)
└── theme/        # tokens: cores, fontes, escala de texto, espaçamento
__tests__/        # testes (fora de src/app, que só tem rotas)
```

## Design

O tema e os componentes seguem a folha "Tokens e componentes" do canvas. Com o app aberto em desenvolvimento, a rota
`/dev/components` mostra todos eles nos seus estados.

- **Cores e texto:** use os tokens de `@/theme` e o `AppText`, nunca cor ou tamanho soltos na tela.
- **Frações:** no conteúdo, `{1/2}` vira uma fração desenhada pelo `MathText`. É a mesma marcação do conteúdo no back.
- **Fontes:** Bricolage Grotesque e Instrument Sans vão empacotadas no app, carregadas antes da primeira tela.
