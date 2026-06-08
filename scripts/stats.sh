#!/usr/bin/env bash
# stats.sh — Estatísticas cross-semanas
# Uso: ./scripts/stats.sh [--weeks N]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PLANNINGS_DIR="$ROOT_DIR/plannings"
PROJECTS_JSON="$ROOT_DIR/projects.json"

NUM_WEEKS=0
while [ $# -gt 0 ]; do
  case $1 in
    --weeks) NUM_WEEKS="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if ! command -v jq &> /dev/null; then
  echo "Erro: jq não instalado. Rode: brew install jq"
  exit 1
fi

# Collect weeks
WEEKS=""
for dir in "$PLANNINGS_DIR"/*/; do
  [ -f "$dir/planning.json" ] && WEEKS="$WEEKS $(basename "$dir")"
done
WEEKS=$(echo "$WEEKS" | tr ' ' '\n' | sort | grep -v '^$')

if [ -z "$WEEKS" ]; then
  echo "Nenhuma planning encontrada em $PLANNINGS_DIR"
  exit 0
fi

# Limit weeks
if [ "$NUM_WEEKS" -gt 0 ] 2>/dev/null; then
  WEEKS=$(echo "$WEEKS" | tail -n "$NUM_WEEKS")
fi

FIRST=$(echo "$WEEKS" | head -1)
LAST=$(echo "$WEEKS" | tail -1)
COUNT=$(echo "$WEEKS" | wc -l | tr -d ' ')

echo "# Estatísticas de Planejamento"
echo ""
echo "**Período:** $FIRST a $LAST ($COUNT semanas)"
echo ""

PROJECT_IDS=$(jq -r '.projects[].id' "$PROJECTS_JSON")

# --- 1. Distribuição de tempo por projeto ---
echo "## 1. Distribuição de Tempo por Projeto"
echo ""
echo "| Projeto | Horas Est. | % Est. | Horas Real | % Real |"
echo "|---------|-----------|--------|-----------|--------|"

# Aggregate all weeks into one jq call per project
GRAND_EST=0
GRAND_ACT=0
ROWS_SEC1=""

for PID in $PROJECT_IDS; do
  PNAME=$(jq -r --arg id "$PID" '.projects[] | select(.id == $id) | .name' "$PROJECTS_JSON")
  PE=0
  PA=0
  for WEEK in $WEEKS; do
    JSON="$PLANNINGS_DIR/$WEEK/planning.json"
    E=$(jq --arg pid "$PID" '[.projects[$pid].tasks[]?.estimated_hours // 0] | add // 0' "$JSON")
    A=$(jq --arg pid "$PID" '[.projects[$pid].tasks[]? | select(.actual_hours != null) | .actual_hours] | add // 0' "$JSON")
    PE=$(awk "BEGIN{print $PE + $E}")
    PA=$(awk "BEGIN{print $PA + $A}")
  done
  GRAND_EST=$(awk "BEGIN{print $GRAND_EST + $PE}")
  GRAND_ACT=$(awk "BEGIN{print $GRAND_ACT + $PA}")
  ROWS_SEC1="$ROWS_SEC1|$PNAME|$PE|$PA"$'\n'
done

echo "$ROWS_SEC1" | while IFS='|' read -r _ PNAME PE PA _; do
  [ -z "$PNAME" ] && continue
  if [ "$(awk "BEGIN{print ($GRAND_EST > 0)}")" = "1" ]; then
    PCT_E=$(awk "BEGIN{printf \"%.0f\", $PE * 100 / $GRAND_EST}")
  else PCT_E=0; fi
  if [ "$(awk "BEGIN{print ($GRAND_ACT > 0)}")" = "1" ]; then
    PCT_A=$(awk "BEGIN{printf \"%.0f\", $PA * 100 / $GRAND_ACT}")
  else PCT_A="-"; fi
  echo "| $PNAME | ${PE}h | ${PCT_E}% | ${PA}h | ${PCT_A}% |"
done

echo "| **Total** | **${GRAND_EST}h** | **100%** | **${GRAND_ACT}h** | **100%** |"
echo ""

# --- 2. Tendência semanal ---
echo "## 2. Tendência Semanal"
echo ""

HEADER="| Semana |"
SEP="|--------|"
for PID in $PROJECT_IDS; do
  PNAME=$(jq -r --arg id "$PID" '.projects[] | select(.id == $id) | .name' "$PROJECTS_JSON")
  HEADER="$HEADER $PNAME |"
  SEP="${SEP}--------|"
done
HEADER="$HEADER Total |"
SEP="${SEP}-------|"

echo "$HEADER"
echo "$SEP"

for WEEK in $WEEKS; do
  JSON="$PLANNINGS_DIR/$WEEK/planning.json"
  ROW="| $WEEK |"
  WEEK_TOTAL=0
  for PID in $PROJECT_IDS; do
    EST=$(jq --arg pid "$PID" '[.projects[$pid].tasks[]?.estimated_hours // 0] | add // 0' "$JSON")
    ROW="$ROW ${EST}h |"
    WEEK_TOTAL=$(awk "BEGIN{print $WEEK_TOTAL + $EST}")
  done
  ROW="$ROW ${WEEK_TOTAL}h |"
  echo "$ROW"
done
echo ""

# --- 3. Accuracy ---
echo "## 3. Accuracy (Estimado vs Real)"
echo ""
echo "| Semana | Estimado | Real | Accuracy |"
echo "|--------|----------|------|----------|"

for WEEK in $WEEKS; do
  JSON="$PLANNINGS_DIR/$WEEK/planning.json"
  EST=$(jq '[.projects[].tasks[]?.estimated_hours // 0] | add // 0' "$JSON")
  ACT=$(jq '[.projects[].tasks[]? | select(.actual_hours != null) | .actual_hours] | add // 0' "$JSON")
  if [ "$(awk "BEGIN{print ($EST > 0 && $ACT > 0)}")" = "1" ]; then
    ACC=$(awk "BEGIN{printf \"%.0f\", $ACT * 100 / $EST}")
    echo "| $WEEK | ${EST}h | ${ACT}h | ${ACC}% |"
  else
    echo "| $WEEK | ${EST}h | ${ACT}h | - |"
  fi
done
echo ""

# --- 4. Completion Rate ---
echo "## 4. Completion Rate"
echo ""
echo "| Semana | Done | Total | Rate |"
echo "|--------|------|-------|------|"

for WEEK in $WEEKS; do
  JSON="$PLANNINGS_DIR/$WEEK/planning.json"
  DONE=$(jq '[.projects[].tasks[]? | select(.status == "done")] | length' "$JSON")
  TOTAL=$(jq '[.projects[].tasks[]?] | length' "$JSON")
  if [ "$TOTAL" -gt 0 ]; then
    RATE=$(awk "BEGIN{printf \"%.0f\", $DONE * 100 / $TOTAL}")
  else RATE="-"; fi
  echo "| $WEEK | $DONE | $TOTAL | ${RATE}% |"
done
echo ""

# --- 5. Tempo por Prioridade ---
echo "## 5. Tempo por Prioridade"
echo ""
echo "| Semana | 🔴 Fazer Agora | 🟡 Agendar | 🟢 Quick Win | ⚪ Backlog |"
echo "|--------|---------------|-----------|-------------|-----------|"

for WEEK in $WEEKS; do
  JSON="$PLANNINGS_DIR/$WEEK/planning.json"
  RED=$(jq '[.projects[].tasks[]? | select(.priority == "red") | .estimated_hours // 0] | add // 0' "$JSON")
  YELLOW=$(jq '[.projects[].tasks[]? | select(.priority == "yellow") | .estimated_hours // 0] | add // 0' "$JSON")
  GREEN=$(jq '[.projects[].tasks[]? | select(.priority == "green") | .estimated_hours // 0] | add // 0' "$JSON")
  WHITE=$(jq '[.projects[].tasks[]? | select(.priority == "white") | .estimated_hours // 0] | add // 0' "$JSON")
  echo "| $WEEK | ${RED}h | ${YELLOW}h | ${GREEN}h | ${WHITE}h |"
done
echo ""
echo "---"
echo "*Gerado em $(date '+%Y-%m-%d %H:%M')*"
