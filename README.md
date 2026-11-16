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
└── app/          # rotas do Expo Router (todo arquivo aqui é uma tela)
    ├── (auth)/   # login e cadastro
    └── (app)/    # telas com sessão
        └── (tabs)/   # abas Trilha e Revisão
__tests__/        # testes (fora de src/app, que só tem rotas)
```
