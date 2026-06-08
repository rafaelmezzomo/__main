import Card from './Card'

const priorityOrder = { red: 0, yellow: 1, green: 2, white: 3 }

export default function Column({ title, status, tasks, onDrop, onCardClick }) {
  const sorted = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e) => e.currentTarget.classList.remove('drag-over')

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const taskId = e.dataTransfer.getData('text/plain')
    onDrop(taskId, status)
  }

  return (
    <div className="column">
      <div className="column-header">
        <span>{title}</span>
        <span className="count">{sorted.length}</span>
      </div>
      <div
        className="column-body"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {sorted.map(task => (
          <Card key={task.id} task={task} onClick={onCardClick} />
        ))}
      </div>
    </div>
  )
}
