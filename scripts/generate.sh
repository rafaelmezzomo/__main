#!/bin/bash
# generate.sh — Gera Markdowns a partir do planning JSON
# Uso: ./scripts/generate.sh 2026-W22

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WEEK="${1:?Uso: $0 <week> (ex: 2026-W22)}"
PLANNING_DIR="$ROOT_DIR/plannings/$WEEK"
JSON="$PLANNING_DIR/planning.json"
PROJECTS_JSON="$ROOT_DIR/projects.json"

if [ ! -f "$JSON" ]; then
  echo "Erro: $JSON não encontrado"
  exit 1
fi

# Check jq
if ! command -v jq &> /dev/null; then
  echo "Erro: jq não instalado. Rode: brew install jq"
  exit 1
fi

START_DATE=$(jq -r '.start_date' "$JSON")
END_DATE=$(jq -r '.end_date' "$JSON")
HOURS_AVAILABLE=$(jq -r '.hours_available' "$JSON")
PERIOD_LABEL=$(jq -r '.period_label // "Semana"' "$JSON")

# Format dates for display (DD/MM)
START_DISPLAY=$(date -j -f "%Y-%m-%d" "$START_DATE" "+%d/%m" 2>/dev/null || echo "$START_DATE")
END_DISPLAY=$(date -j -f "%Y-%m-%d" "$END_DATE" "+%d/%m" 2>/dev/null || echo "$END_DATE")

# --- Generate central planning.md ---

OUTPUT="$PLANNING_DIR/planning.md"

# Build project rows and task lists
PROJECT_ROWS=""
RED_TASKS=""
YELLOW_TASKS=""
GREEN_TASKS=""
WHITE_TASKS=""
TOTAL_HOURS=0
TOTAL_RED=0
TOTAL_YELLOW=0
TOTAL_GREEN=0
TOTAL_WHITE=0
TOTAL_TASKS=0

for PROJECT_ID in $(jq -r '.projects | keys[]' "$JSON"); do
  PROJECT_NAME=$(jq -r --arg id "$PROJECT_ID" '.projects[] | select(.id == $id) | .name // $id' "$PROJECTS_JSON")

  TASKS=$(jq -c --arg pid "$PROJECT_ID" '.projects[$pid].tasks[]?' "$JSON")
  P_HOURS=0
  P_RED=0
  P_YELLOW=0
  P_GREEN=0
  P_WHITE=0
  P_TOTAL=0

  while IFS= read -r task; do
    [ -z "$task" ] && continue
    ID=$(echo "$task" | jq -r '.id')
    TITLE=$(echo "$task" | jq -r '.title')
    REPO=$(echo "$task" | jq -r '.repo')
    EST=$(echo "$task" | jq -r '.estimated_hours')
    PRIORITY=$(echo "$task" | jq -r '.priority')
    STATUS=$(echo "$task" | jq -r '.status')
    CARRYOVER=$(echo "$task" | jq -r '.carryover')

    EST_NUM=${EST:-0}
    P_HOURS=$(awk "BEGIN{print $P_HOURS + $EST_NUM}")
    P_TOTAL=$((P_TOTAL + 1))

    # Status checkbox
    CHECK="[ ]"
    if [ "$STATUS" = "done" ]; then CHECK="[x]"; fi

    # Carryover marker
    CARRY_MARK=""
    if [ "$CARRYOVER" = "true" ]; then CARRY_MARK=" *(carryover)*"; fi

    LINE="- $CHECK [$ID] $TITLE ($REPO) — ${EST}h$CARRY_MARK"

    case "$PRIORITY" in
      red)    RED_TASKS+="$LINE"$'\n'; P_RED=$((P_RED + 1)) ;;
      yellow) YELLOW_TASKS+="$LINE"$'\n'; P_YELLOW=$((P_YELLOW + 1)) ;;
      green)  GREEN_TASKS+="$LINE"$'\n'; P_GREEN=$((P_GREEN + 1)) ;;
      white)  WHITE_TASKS+="$LINE"$'\n'; P_WHITE=$((P_WHITE + 1)) ;;
    esac
  done <<< "$TASKS"

  PROJECT_ROWS+="| $PROJECT_NAME | ${P_HOURS}h | $P_RED | $P_YELLOW | $P_GREEN | $P_WHITE | $P_TOTAL |"$'\n'
  TOTAL_HOURS=$(awk "BEGIN{print $TOTAL_HOURS + $P_HOURS}")
  TOTAL_RED=$((TOTAL_RED + P_RED))
  TOTAL_YELLOW=$((TOTAL_YELLOW + P_YELLOW))
  TOTAL_GREEN=$((TOTAL_GREEN + P_GREEN))
  TOTAL_WHITE=$((TOTAL_WHITE + P_WHITE))
  TOTAL_TASKS=$((TOTAL_TASKS + P_TOTAL))
done

# Default empty
[ -z "$RED_TASKS" ] && RED_TASKS="*Nenhuma tarefa*"$'\n'
[ -z "$YELLOW_TASKS" ] && YELLOW_TASKS="*Nenhuma tarefa*"$'\n'
[ -z "$GREEN_TASKS" ] && GREEN_TASKS="*Nenhuma tarefa*"$'\n'
[ -z "$WHITE_TASKS" ] && WHITE_TASKS="*Nenhuma tarefa*"$'\n'

cat > "$OUTPUT" << EOF
# Planning $PERIOD_LABEL $WEEK ($START_DISPLAY - $END_DISPLAY)

**Horas disponíveis:** ${HOURS_AVAILABLE}h | **Horas alocadas:** ${TOTAL_HOURS}h | **Livre:** $(awk "BEGIN{print $HOURS_AVAILABLE - $TOTAL_HOURS}")h

## Resumo

| Projeto | Horas Est. | 🔴 | 🟡 | 🟢 | ⚪ | Tarefas |
|---------|-----------|----|----|----|----|---------|
${PROJECT_ROWS}| **Total** | **${TOTAL_HOURS}h** | $TOTAL_RED | $TOTAL_YELLOW | $TOTAL_GREEN | $TOTAL_WHITE | **$TOTAL_TASKS** |

## 🔴 Fazer Agora
$RED_TASKS
## 🟡 Agendar
$YELLOW_TASKS
## 🟢 Quick Wins
$GREEN_TASKS
## ⚪ Backlog
$WHITE_TASKS
EOF

echo "Gerado: $OUTPUT"

# --- Generate per-project weekly plannings ---

for PROJECT_ID in $(jq -r '.projects | keys[]' "$JSON"); do
  TASKS=$(jq -c --arg pid "$PROJECT_ID" '.projects[$pid].tasks[]?' "$JSON")
  [ -z "$TASKS" ] && continue

  # Get repos for this project
  REPOS=$(jq -r --arg id "$PROJECT_ID" '.projects[] | select(.id == $id) | .repos[]' "$PROJECTS_JSON")
  PROJECT_NAME=$(jq -r --arg id "$PROJECT_ID" '.projects[] | select(.id == $id) | .name // $id' "$PROJECTS_JSON")

  for REPO in $REPOS; do
    REPO_DIR="$ROOT_DIR/repositories/$REPO"
    [ ! -d "$REPO_DIR" ] && continue

    WEEKLY_DIR="$REPO_DIR/weekly-plannings"
    mkdir -p "$WEEKLY_DIR"

    REPO_TASKS=""
    REPO_HOURS=0

    while IFS= read -r task; do
      [ -z "$task" ] && continue
      TASK_REPO=$(echo "$task" | jq -r '.repo')
      [ "$TASK_REPO" != "$REPO" ] && continue

      ID=$(echo "$task" | jq -r '.id')
      TITLE=$(echo "$task" | jq -r '.title')
      EST=$(echo "$task" | jq -r '.estimated_hours')
      PRIORITY=$(echo "$task" | jq -r '.priority')
      STATUS=$(echo "$task" | jq -r '.status')

      CHECK="[ ]"
      if [ "$STATUS" = "done" ]; then CHECK="[x]"; fi

      EMOJI=""
      case "$PRIORITY" in
        red) EMOJI="🔴" ;; yellow) EMOJI="🟡" ;; green) EMOJI="🟢" ;; white) EMOJI="⚪" ;;
      esac

      REPO_TASKS+="- $CHECK $EMOJI [$ID] $TITLE — ${EST}h"$'\n'
      REPO_HOURS=$(awk "BEGIN{print $REPO_HOURS + ${EST:-0}}")
    done <<< "$TASKS"

    [ -z "$REPO_TASKS" ] && continue

    cat > "$WEEKLY_DIR/$WEEK.md" << EOF
# $PROJECT_NAME / $REPO — $PERIOD_LABEL $WEEK ($START_DISPLAY - $END_DISPLAY)

**Horas estimadas:** ${REPO_HOURS}h

## Tarefas

$REPO_TASKS
EOF

    echo "Gerado: $WEEKLY_DIR/$WEEK.md"
  done
done

echo "Done!"
