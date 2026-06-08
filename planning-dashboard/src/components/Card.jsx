const PRIORITY_EMOJI = { red: '🔴', yellow: '🟡', green: '🟢', white: '⚪' }

export default function Card({ task, onDragStart, onDragEnd, onClick }) {
  return (
    <div
      className="card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.currentTarget.classList.add('dragging')
        onDragStart?.(task.id)
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('dragging')
        onDragEnd?.()
      }}
      onClick={() => onClick?.(task)}
    >
      <div className={`card-priority ${task.priority}`} />
      <div className="card-id">{PRIORITY_EMOJI[task.priority]} {task.id}</div>
      <div className="card-title">{task.title}</div>
      <div className="card-footer">
        <span className={`card-project ${task.projectId}`}>{task.projectName}</span>
        <span className="card-hours">{task.estimated_hours}h</span>
      </div>
      <div className="card-repo">{task.repo}</div>
    </div>
  )
}
