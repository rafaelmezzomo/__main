// This file is auto-loaded from ../../../plannings/
// Vite serves parent dirs, so we fetch at runtime
export async function loadPlanning(week) {
  const res = await fetch(`/plannings/${week}/planning.json`)
  if (!res.ok) throw new Error(`Planning ${week} not found`)
  return res.json()
}

export async function loadChangelog() {
  const res = await fetch('/changelog.md')
  if (!res.ok) throw new Error('Changelog not found')
  return res.text()
}

export async function loadProjects() {
  const res = await fetch('/projects.json')
  if (!res.ok) throw new Error('projects.json not found')
  return res.json()
}
