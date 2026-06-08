# Daily Log

Gera uma entrada no changelog diário (`changelog.md` na raiz do __main).

Se $ARGUMENTS for uma data (ex: 2026-05-25), usar essa data. Se não, usar ontem.

## Passo 1: Coletar dados do dia
- Puxar git logs de todos os projetos para o dia em questão
- Verificar sessões do Claude do dia (mensagens do usuário nos .jsonl)
- Checar se houve mudanças nos plannings (tarefas movidas, criadas, etc.)

## Passo 2: Gerar entrada
- Formato conciso: data + bullets por projeto do que foi feito
- Incluir apenas o que foi significativo (não listar cada micro-commit)
- Agrupar por projeto
- Incluir decisões importantes tomadas durante o dia

## Passo 3: Salvar
- Adicionar a entrada NO TOPO do `changelog.md` (mais recente primeiro, abaixo do `# Changelog Diário`)
- Não duplicar — se já existe entrada para o dia, atualizar ao invés de criar nova
- Atualizar a variável `CHANGELOG_MD` dentro de `__planning-layout/index.html` com o conteúdo atualizado do `changelog.md` (o HTML lê o changelog inline, não via fetch)

## Formato da entrada

```markdown
## YYYY-MM-DD (dia-da-semana)

### Projeto 1
- O que foi feito (bullet conciso)

### Projeto 2
- O que foi feito

### Decisões / Notas
- Decisões relevantes tomadas no dia
```
