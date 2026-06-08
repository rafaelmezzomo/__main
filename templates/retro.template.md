# Retro Semana {{WEEK}} ({{START_DATE}} - {{END_DATE}})

## Métricas
- Tarefas: {{TASKS_DONE}}/{{TASKS_TOTAL}} concluídas ({{COMPLETION_PCT}}%)
- Horas: {{HOURS_ACTUAL}}h real vs {{HOURS_ESTIMATED}}h estimado ({{ACCURACY_PCT}}% accuracy)
- Utilização: {{HOURS_ACTUAL}}h / {{HOURS_AVAILABLE}}h disponíveis ({{UTILIZATION_PCT}}%)

| Projeto | Est. | Real | % Tempo | Conclusão |
|---------|------|------|---------|-----------|
{{PROJECT_ROWS}}

## Reflexão
1. **O que foi bem?** {{WHAT_WENT_WELL}}
2. **O que me travou?** {{WHAT_BLOCKED_ME}}
3. **O que vou mudar?** {{WHAT_TO_CHANGE}}

## Carryover → {{NEXT_WEEK}}
{{CARRYOVER_TASKS}}

## Tokens Claude da semana

| Projeto | Input | Output | Cache | Total |
|---------|-------|--------|-------|-------|
{{TOKEN_ROWS}}
| **Total** | {{TOKENS_INPUT_TOTAL}} | {{TOKENS_OUTPUT_TOTAL}} | {{TOKENS_CACHE_TOTAL}} | {{TOKENS_GRAND_TOTAL}} |
