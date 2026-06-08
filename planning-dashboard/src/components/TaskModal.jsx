const PRIORITY_EMOJI = { red: '🔴', yellow: '🟡', green: '🟢', white: '⚪' }
const PRIORITY_LABELS = { red: 'Fazer Agora', yellow: 'Agendar', green: 'Quick Win', white: 'Backlog' }

export default function TaskModal({ task, status, notes, onClose, onStatusChange, onNotesChange }) {
  if (!task) return null

  const statusBtnClass = (s) =>
    `modal-status-btn ${s === status ? `active-${s}` : ''}`

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{task.title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <div className="modal-field">
              <div className="modal-label">ID</div>
              <div className="modal-value" style={{ fontFamily: "'SF Mono','Fira Code',monospace" }}>{task.id}</div>
            </div>
            <div className="modal-field">
              <div className="modal-label">Projeto</div>
              <div className="modal-value">
                <span className={`card-project ${task.projectId}`}>{task.projectName}</span>
              </div>
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <div className="modal-label">Repositório</div>
              <div className="modal-value">{task.repo}</div>
            </div>
            <div className="modal-field">
              <div className="modal-label">Horas Estimadas</div>
              <div className="modal-value">{task.estimated_hours}h</div>
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <div className="modal-label">Prioridade</div>
              <div className="modal-value">
                <span className={`priority-badge ${task.priority}`}>
                  {PRIORITY_EMOJI[task.priority]} {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
            </div>
            <div className="modal-field">
              <div className="modal-label">Status</div>
              <div className="modal-status-btns">
                {['todo', 'doing', 'done'].map(s => (
                  <button key={s} className={statusBtnClass(s)} onClick={() => onStatusChange(task.id, s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-field">
            <div className="modal-label">Notas</div>
            <textarea
              className="modal-notes"
              placeholder="Adicionar notas..."
              value={notes}
              onChange={(e) => onNotesChange(task.id, e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
