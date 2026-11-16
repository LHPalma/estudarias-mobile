# Contribuindo

Todo trabalho aqui começa numa **issue** e termina num **pull request**: uma issue, uma branch, um PR. É a mesma convenção do back ([`LHPalma/estudarias`](https://github.com/LHPalma/estudarias/blob/main/CONTRIBUTING.md)). Este guia diz como nomear a branch, como escrever os commits e o que o PR precisa ter. Para rodar o projeto, veja o [README](README.md).

## Fluxo

1. **Issue.** Se o trabalho não tem uma issue, abra uma antes. Ela descreve o escopo, o que fica de fora e as entregas. Uma tarefa que faz parte de outra maior é uma **sub-issue** da issue-mãe, e a branch usa o número da sub-issue.
2. **Branch**, com o nome da seção abaixo.
3. **Commits** pequenos, no formato da seção de commits.
4. **Pull request**, com o template do repositório e `Closes #NN` apontando para a issue.

## Nome da branch

```
task-<NN>-<nome-curto>
```

- **`NN`** é o **número da issue**, com pelo menos dois dígitos (`task-02-...`, `task-17-...`, `task-102-...`). Quem lê a branch chega na issue sem procurar.
- **`nome-curto`** diz o que a tarefa entrega, em duas a quatro palavras: minúsculas, dígitos e hífens, sem acento, sem espaço e sem `_`, em inglês.

Em forma de expressão regular: `^task-[0-9]{2,}-[a-z0-9]+(-[a-z0-9]+)*$`.

| Issue                      | Branch                       |
| -------------------------- | ---------------------------- |
| #2 Fundação do projeto     | `task-02-project-foundation` |
| #3 Tema e componentes base | `task-03-theme-components`   |
| #6 Trilha e mapa           | `task-06-trail-map`          |

As branches do Dependabot (`dependabot/...`) são criadas pela ferramenta e ficam como estão.

Cada branch sai da `main`. Quando a tarefa **depende de outra que ainda não foi mergeada**, a branch sai da branch dessa outra (PR empilhado), e o PR usa essa branch como base.

## Commits

Os commits seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/), com a descrição em português:

```
tipo(escopo): descrição curta, no presente, sem ponto final
```

- **Tipos** em uso: `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `ci` e `chore`.
- **Escopo** é a parte afetada, e é opcional: `app` (rotas e telas), `theme`, `components`, `api`, `auth`, `tests`, `readme`.
- A descrição é como o histórico escreve: `adiciona o Expo Router com as rotas iniciais`.
- O **corpo** explica o porquê, não o que o diff já mostra. É o lugar da decisão.
- **Um commit por mudança coerente, e cada commit passa no lint, nos tipos e nos testes sozinho.** Prefira vários commits pequenos (o componente, depois os testes dele, depois a documentação) a um commit grande.
- O último commit pode fechar a issue (`Closes #NN`).

## Pull request

- Use o [template](.github/pull_request_template.md): preencha **O que muda**, o **Tipo de mudança**, **Como testar** e o **Checklist**, e escreva `Closes #NN` para a issue ser fechada no merge.
- O título segue o formato dos commits (`feat(app): adiciona a tela da trilha`).
- A base é a `main`, ou a branch de que a tarefa depende, num PR empilhado. Diga no corpo do PR em qual ele está empilhado. O CI roda em PRs de qualquer base.
- O CI (`build`) deve estar verde antes do merge.
- Mudança visual: uma captura de tela ou gravação no corpo do PR.

## Qualidade

- `npm run lint` passa sem erro: o Prettier é regra do lint, e `npm run format` corrige a formatação.
- `npm run typecheck` passa: o TypeScript é `strict`.
- Pacotes entram com `npx expo install`, que escolhe a versão compatível com o SDK, e não com `npm install`.
- Comportamento de tela e regra entram com teste, em `__tests__/` (fora de `src/app`, onde todo arquivo vira rota), com o nome em português no `it(...)` e Arrange/Act/Assert:

  ```bash
  npm test
  ```

- Telas seguem o canvas de design e o contrato da API ([`docs/api.md`](https://github.com/LHPalma/estudarias/blob/main/docs/api.md) no back): o app decide pelo `code` do erro e pelos links que a API manda, não por regra própria.
- Mudou como rodar ou configurar? Atualize o README no mesmo PR.
