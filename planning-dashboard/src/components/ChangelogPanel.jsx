import { useState, useEffect } from 'react'
import { loadChangelog } from '../data/planning'

function parseMarkdown(md) {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, m => '<ul>' + m + '</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n{2,}/g, '<br>')
}

export default function ChangelogPanel({ open, onClose }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (open) {
      loadChangelog()
        .then(md => setHtml(parseMarkdown(md)))
        .catch(() => setHtml('<p style="color:#8b949e">Não foi possível carregar o changelog.md</p>'))
    }
  }, [open])

  return (
    <div className={`changelog-panel ${open ? 'open' : ''}`}>
      <div className="changelog-header">
        <h3>Changelog Diário</h3>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>
      <div className="changelog-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
