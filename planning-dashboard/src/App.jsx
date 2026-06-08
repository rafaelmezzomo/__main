import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { loadPlanning, loadProjects } from './data/planning'
import Column from './components/Column'
import TaskModal from './components/TaskModal'
import ChangelogPanel from './components/ChangelogPanel'

// Get current ISO week
function getCurrentWeek() {
  const now = new Date()
  const jan1 = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now - jan1) / 86400000)
  const week = Math.ceil((days + jan1.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export default function App() {
  const [planning, setPlanning] = useState(null)
  const [projectNames, setProjectNames] = useState({})
  const [statuses, setStatuses] = useLocalStorage('planning-status-2026-W22', {})
  const [notes, setNotes] = useLocalStorage('planning-notes-2026-W22', {})
  const [filter, setFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [changelogOpen, setChangelogOpen] = useState(false)

  useEffect(() => {
    Promise.all([loadPlanning('2026-W22'), loadProjects()])
      .then(([plan, proj]) => {
        setPlanning(plan)
        const names = {}
        proj.projects.forEach(p => { names[p.id] = p.name })
        setProjectNames(names)
      })
      .catch(console.error)
  }, [])

  const getAllTasks = useCallback(() => {
    if (!planning) return []
    const tasks = []
    for (const [projectId, project] of Object.entries(planning.projects)) {
      for (const task of project.tasks) {
        tasks.push({
          ...task,
          projectId,
          projectName: projectNames[projectId] || projectId,
        })
      }
    }
    return tasks
  }, [planning, projectNames])

  const getStatus = (id) => statuses[id] || 'todo'

  const setStatus = (id, status) => {
    setStatuses({ ...statuses, [id]: status })
  }

  const setNote = (id, note) => {
    setNotes({ ...notes, [id]: note })
  }

  const handleDrop = (taskId, newStatus) => {
    setStatus(taskId, newStatus)
  }

  if (!planning) return <div style={{ padding: 40, color: '#8b949e' }}>Carregando...</div>

  const allTasks = getAllTasks()
  const filtered = filter === 'all' ? allTasks : allTasks.filter(t => t.projectId === filter)

  const columns = { todo: [], doing: [], done: [] }
  filtered.forEach(t => {
    const s = getStatus(t.id)
    columns[s].push(t)
  })

  const total = filtered.length
  const doneCount = columns.done.length
  const doingCount = columns.doing.length
  const todoCount = columns.todo.length
  const hoursDone = columns.done.reduce((s, t) => s + t.estimated_hours, 0)
  const hoursDoing = columns.doing.reduce((s, t) => s + t.estimated_hours, 0)
  const hoursTotal = filtered.reduce((s, t) => s + t.estimated_hours, 0)

  const projectIds = Object.keys(planning.projects)

  return (
    <>
      <div className="header">
        <h1>Planning {planning.week}</h1>
        <div className="meta">
          <span>
            {formatDate(planning.start_date)} - {formatDate(planning.end_date)} &middot;{' '}
            <strong>{hoursDone + hoursDoing}h</strong> / {planning.hours_available}h
          </span>
          <button className="header-btn" onClick={() => setChangelogOpen(!changelogOpen)}>
            &#9776; Changelog
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat-item"><div className="stat-dot todo" /> {todoCount} todo</div>
        <div className="stat-item"><div className="stat-dot doing" /> {doingCount} doing</div>
        <div className="stat-item"><div className="stat-dot done" /> {doneCount} done</div>
        <div className="stat-item" style={{ marginLeft: 'auto', color: '#8b949e' }}>
          {hoursDone}h done / {hoursTotal}h total
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-done" style={{ width: total > 0 ? `${(doneCount / total) * 100}%` : 0 }} />
        <div className="progress-doing" style={{ width: total > 0 ? `${(doingCount / total) * 100}%` : 0 }} />
      </div>

      <div className="filters">
        {[{ id: 'all', name: 'Todos' }, ...projectIds.map(id => ({ id, name: projectNames[id] || id }))].map(p => (
          <button
            key={p.id}
            className={`filter-btn ${filter === p.id ? 'active' : ''}`}
            onClick={() => setFilter(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="board">
        <Column title="Todo" status="todo" tasks={columns.todo} onDrop={handleDrop} onCardClick={setSelectedTask} />
        <Column title="Doing" status="doing" tasks={columns.doing} onDrop={handleDrop} onCardClick={setSelectedTask} />
        <Column title="Done" status="done" tasks={columns.done} onDrop={handleDrop} onCardClick={setSelectedTask} />
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          status={getStatus(selectedTask.id)}
          notes={notes[selectedTask.id] || selectedTask.notes || ''}
          onClose={() => setSelectedTask(null)}
          onStatusChange={(id, s) => setStatus(id, s)}
          onNotesChange={(id, n) => setNote(id, n)}
        />
      )}

      <ChangelogPanel open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </>
  )
}
