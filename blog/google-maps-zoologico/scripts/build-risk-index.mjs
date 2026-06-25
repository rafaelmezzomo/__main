#!/usr/bin/env node
// Pipeline offline: SSP CSV (por distrito) -> public/risk-index.json (ds_codigo -> 0..1).
// Roda: npm run build:risk  [-- caminho/para/outro.csv]
//
// Granularidade: distrito (ou DP via data/dp-distrito-crosswalk.json). É indicativo, não medição.
// O app consome só o JSON gerado — nunca bate na SSP em runtime.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const csvPath = process.argv[2] || path.join(root, 'data', 'ssp-capital.csv')
const geojsonPath = path.join(root, 'public', 'sp-districts.geojson')
const crosswalkPath = path.join(root, 'data', 'dp-distrito-crosswalk.json')
const outPath = path.join(root, 'public', 'risk-index.json')

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
  const header = lines.shift().split(',').map((h) => h.trim())
  return lines.map((line) => {
    const cells = line.split(',')
    const row = {}
    header.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()))
    return row
  })
}

// Furto entra com peso baixo: para quem ATRAVESSA de carro, o sinal relevante é
// roubo (violento); furto/punga infla zona comercial e diz pouco sobre o trajeto.
const FURTO_WEIGHT = 0.2

// Área aproximada (km²) de cada distrito, via shoelace em projeção equiretangular.
const R = 6378137
const LAT_REF = (-23.6 * Math.PI) / 180
function ringAreaKm2(ring) {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ((ring[i][0] * Math.PI) / 180) * Math.cos(LAT_REF) * R
    const yi = ((ring[i][1] * Math.PI) / 180) * R
    const xj = ((ring[j][0] * Math.PI) / 180) * Math.cos(LAT_REF) * R
    const yj = ((ring[j][1] * Math.PI) / 180) * R
    a += xj * yi - xi * yj
  }
  return Math.abs(a / 2) / 1e6
}
function featureAreaKm2(feature) {
  const g = feature.geometry
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  return polys.reduce((s, p) => s + ringAreaKm2(p[0]), 0)
}

function buildDpLookup() {
  if (!fs.existsSync(crosswalkPath)) return {}
  const { crosswalk = [] } = JSON.parse(fs.readFileSync(crosswalkPath, 'utf8'))
  const byDp = {}
  for (const r of crosswalk) if (r.dp && r.ds_codigo) byDp[r.dp.trim()] = r.ds_codigo
  return byDp
}

function main() {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  const dpLookup = buildDpLookup()
  const geo = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'))

  // área (km²) por distrito, a partir dos polígonos do mapa
  const areaByCode = {}
  for (const f of geo.features) {
    areaByCode[f.properties.ds_codigo] = featureAreaKm2(f)
  }

  // métrica = densidade de roubo por km² (furto entra com FURTO_WEIGHT)
  const rateByCode = {}
  for (const r of rows) {
    const code = r.ds_codigo || dpLookup[(r.dp || '').trim()]
    if (!code || !areaByCode[code]) continue
    const roubos = Number(r.roubos || 0)
    const furtos = Number(r.furtos || 0)
    rateByCode[code] = (roubos + FURTO_WEIGHT * furtos) / areaByCode[code]
  }

  // distritos do mapa que não vieram no CSV herdam a média da subprefeitura
  const bySubpref = {}
  for (const f of geo.features) {
    const { ds_codigo, ds_subpref } = f.properties
    if (rateByCode[ds_codigo] != null) {
      ;(bySubpref[ds_subpref] ||= []).push(rateByCode[ds_codigo])
    }
  }
  const subprefMean = {}
  for (const [k, v] of Object.entries(bySubpref)) {
    subprefMean[k] = v.reduce((a, b) => a + b, 0) / v.length
  }
  const allRates = Object.values(rateByCode)
  const globalMean = allRates.reduce((a, b) => a + b, 0) / (allRates.length || 1)
  for (const f of geo.features) {
    const { ds_codigo, ds_subpref } = f.properties
    if (rateByCode[ds_codigo] == null) {
      rateByCode[ds_codigo] = subprefMean[ds_subpref] ?? globalMean
    }
  }

  // normaliza min-max para 0..1
  const vals = Object.values(rateByCode)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const index = {}
  for (const [code, rate] of Object.entries(rateByCode)) {
    index[code] = Number(((rate - min) / span).toFixed(3))
  }

  const payload = {
    _meta: {
      generatedFrom: path.basename(csvPath),
      source: 'SSP-SP (snapshot) — indicativo, não medição',
      metric: `densidade de roubo por km² (furto×${FURTO_WEIGHT}), normalizado min-max 0..1`,
      districts: Object.keys(index).length,
    },
    index,
  }
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
  console.log(`risk-index.json: ${Object.keys(index).length} distritos -> ${outPath}`)
  for (const f of geo.features) {
    const c = f.properties.ds_codigo
    console.log(`  ${c} ${f.properties.ds_nome.padEnd(16)} ${index[c]}`)
  }
}

main()
