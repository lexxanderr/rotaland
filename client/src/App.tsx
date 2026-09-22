import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Users,
  Clock3,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
} from 'lucide-react'
import './App.css'

const API = 'http://localhost:5153'

type Employee = {
  id: string
  firstName: string
  lastName: string
  role: string
  contractedHoursPerWeek: number
  departmentName: string
  isActive: boolean
}

type Shift = {
  id: string
  employeeId: string
  employeeName: string
  startUtc: string
  endUtc: string
  breakMinutes: number
  paidHours: number
}

type WeeklyRota = {
  weekStart: string
  weekEnd: string
  totalScheduledHours: number
  shifts: Shift[]
}

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toApiDate(date: Date) {
  return date.toISOString()
}

function formatDay(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
  })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function localDateTimeToUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

function getLocalDate(value: string) {
  const d = new Date(value)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLocalTime(value: string) {
  const d = new Date(value)

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

function App() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [rota, setRota] = useState<WeeklyRota | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showShiftModal, setShowShiftModal] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState('')

  const [employeeId, setEmployeeId] = useState('')
  const [shiftDate, setShiftDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [breakMinutes, setBreakMinutes] = useState(30)

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
      }),
    [weekStart],
  )

  const activeEmployees = employees.filter(e => e.isActive)

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [rotaResponse, employeesResponse] = await Promise.all([
        fetch(
          `${API}/api/rota/week?start=${encodeURIComponent(
            toApiDate(weekStart),
          )}`,
        ),
        fetch(`${API}/api/employees`),
      ])

      if (!rotaResponse.ok || !employeesResponse.ok) {
        throw new Error('Could not load RotaLand data.')
      }

      setRota(await rotaResponse.json())
      setEmployees(await employeesResponse.json())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [weekStart])

  function shiftFor(employeeId: string, day: Date) {
    return rota?.shifts.find(shift => {
      if (shift.employeeId !== employeeId) return false

      const shiftDate = new Date(shift.startUtc)

      return (
        shiftDate.getFullYear() === day.getFullYear() &&
        shiftDate.getMonth() === day.getMonth() &&
        shiftDate.getDate() === day.getDate()
      )
    })
  }

  function previousWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  function openAddShift() {
    const defaultDate = new Date(weekStart)
    defaultDate.setDate(defaultDate.getDate() + 1)

    setEditingShift(null)
    setEmployeeId(activeEmployees[0]?.id ?? '')
    setShiftDate(defaultDate.toISOString().slice(0, 10))
    setStartTime('09:00')
    setEndTime('17:00')
    setBreakMinutes(30)
    setFormError('')
    setShowShiftModal(true)
  }

  function openEditShift(shift: Shift) {
    setEditingShift(shift)
    setEmployeeId(shift.employeeId)
    setShiftDate(getLocalDate(shift.startUtc))
    setStartTime(getLocalTime(shift.startUtc))
    setEndTime(getLocalTime(shift.endUtc))
    setBreakMinutes(shift.breakMinutes)
    setFormError('')
    setShowShiftModal(true)
  }

  function closeModal() {
    if (saving || deleting) return

    setShowShiftModal(false)
    setEditingShift(null)
    setFormError('')
  }

  async function saveShift(event: React.FormEvent) {
    event.preventDefault()
    setFormError('')

    if (!employeeId) {
      setFormError('Please select an employee.')
      return
    }

    if (!shiftDate || !startTime || !endTime) {
      setFormError('Please complete all shift fields.')
      return
    }

    const startUtc = localDateTimeToUtc(shiftDate, startTime)
    const endUtc = localDateTimeToUtc(shiftDate, endTime)

    if (new Date(endUtc) <= new Date(startUtc)) {
      setFormError('End time must be after start time.')
      return
    }

    try {
      setSaving(true)

      const url = editingShift
        ? `${API}/api/shifts/${editingShift.id}`
        : `${API}/api/shifts`

      const response = await fetch(url, {
        method: editingShift ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(editingShift ? {} : { employeeId }),
          ...(editingShift ? {} : {}),
          startUtc,
          endUtc,
          breakMinutes: Number(breakMinutes),
          ...(editingShift ? {} : { employeeId }),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message ??
            `Could not ${editingShift ? 'update' : 'create'} the shift.`,
        )
      }

      setShowShiftModal(false)
      setEditingShift(null)
      await loadData()
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Could not save the shift.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteShift() {
    if (!editingShift) return

    const confirmed = window.confirm(
      `Delete ${editingShift.employeeName}'s shift on ${new Date(
        editingShift.startUtc,
      ).toLocaleDateString('en-GB')}?`,
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      setFormError('')

      const response = await fetch(
        `${API}/api/shifts/${editingShift.id}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)

        throw new Error(
          data?.message ?? 'Could not delete the shift.',
        )
      }

      setShowShiftModal(false)
      setEditingShift(null)
      await loadData()
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Could not delete the shift.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logoMark">R</span>
          <span>RotaLand</span>
        </div>

        <nav>
          <a className="navItem active">
            <CalendarDays size={18} />
            Rota
          </a>

          <a className="navItem">
            <Users size={18} />
            Employees
          </a>
        </nav>

        <div className="sidebarBottom">
          <div className="siteLabel">CURRENT SITE</div>
          <strong>Hull Site</strong>
          <span>Operations</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">OPERATIONS</div>
            <h1>Weekly Rota</h1>
          </div>

          <button
            className="primaryButton"
            onClick={openAddShift}
            disabled={activeEmployees.length === 0}
          >
            <Plus size={17} />
            Add shift
          </button>
        </header>

        <section className="stats">
          <div className="statCard">
            <div className="statIcon">
              <Clock3 size={19} />
            </div>

            <div>
              <span>Scheduled hours</span>
              <strong>{rota?.totalScheduledHours ?? 0}h</strong>
            </div>
          </div>

          <div className="statCard">
            <div className="statIcon">
              <Users size={19} />
            </div>

            <div>
              <span>Active employees</span>
              <strong>{activeEmployees.length}</strong>
            </div>
          </div>

          <div className="statCard">
            <div className="statIcon">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>Shifts this week</span>
              <strong>{rota?.shifts.length ?? 0}</strong>
            </div>
          </div>
        </section>

        <section className="rotaPanel">
          <div className="rotaHeader">
            <div>
              <h2>
                {weekStart.toLocaleDateString('en-GB', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>

              <p>
                {weekStart.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
                {' – '}
                {days[6].toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>

            <div className="weekControls">
              <button onClick={previousWeek}>
                <ChevronLeft size={18} />
              </button>

              <button onClick={() => setWeekStart(getMonday(new Date()))}>
                Today
              </button>

              <button onClick={nextWeek}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {loading && <div className="state">Loading rota…</div>}

          {error && <div className="state error">{error}</div>}

          {!loading && !error && (
            <div className="rotaGrid">
              <div className="gridEmployeeHeader">EMPLOYEE</div>

              {days.map(day => (
                <div
                  className="gridDayHeader"
                  key={day.toISOString()}
                >
                  {formatDay(day)}
                </div>
              ))}

              {activeEmployees.map(employee => (
                <div className="employeeRow" key={employee.id}>
                  <div className="employee">
                    <div className="avatar">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </div>

                    <div>
                      <strong>
                        {employee.firstName} {employee.lastName}
                      </strong>
                      <span>{employee.role}</span>
                    </div>
                  </div>

                  {days.map(day => {
                    const shift = shiftFor(employee.id, day)

                    return (
                      <div
                        className="shiftCell"
                        key={day.toISOString()}
                      >
                        {shift ? (
                          <button
                            className="shift"
                            onClick={() => openEditShift(shift)}
                          >
                            <strong>
                              {formatTime(shift.startUtc)} –{' '}
                              {formatTime(shift.endUtc)}
                            </strong>

                            <span>
                              {shift.paidHours}h paid
                            </span>

                            <span className="shiftHint">
                              Click to edit
                            </span>
                          </button>
                        ) : (
                          <span className="empty">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showShiftModal && (
        <div
          className="modalBackdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  {editingShift ? 'SCHEDULING' : 'SCHEDULING'}
                </div>

                <h2>
                  {editingShift ? 'Edit shift' : 'Add shift'}
                </h2>
              </div>

              <button
                className="closeButton"
                onClick={closeModal}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveShift}>
              <label>
                Employee

                <select
                  value={employeeId}
                  onChange={event => setEmployeeId(event.target.value)}
                  disabled={Boolean(editingShift)}
                >
                  {activeEmployees.map(employee => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date

                <input
                  type="date"
                  value={shiftDate}
                  onChange={event => setShiftDate(event.target.value)}
                />
              </label>

              <div className="formRow">
                <label>
                  Start

                  <input
                    type="time"
                    value={startTime}
                    onChange={event => setStartTime(event.target.value)}
                  />
                </label>

                <label>
                  End

                  <input
                    type="time"
                    value={endTime}
                    onChange={event => setEndTime(event.target.value)}
                  />
                </label>
              </div>

              <label>
                Break

                <div className="breakInput">
                  <input
                    type="number"
                    min="0"
                    max="480"
                    value={breakMinutes}
                    onChange={event =>
                      setBreakMinutes(Number(event.target.value))
                    }
                  />

                  <span>minutes</span>
                </div>
              </label>

              {formError && (
                <div className="formError">
                  {formError}
                </div>
              )}

              <div className="modalActions">
                {editingShift && (
                  <button
                    type="button"
                    className="dangerButton"
                    onClick={deleteShift}
                    disabled={saving || deleting}
                  >
                    <Trash2 size={16} />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                )}

                <div className="modalRightActions">
                  <button
                    type="button"
                    className="secondaryButton"
                    onClick={closeModal}
                    disabled={saving || deleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primaryButton"
                    disabled={saving || deleting}
                  >
                    <Pencil size={16} />
                    {saving
                      ? 'Saving…'
                      : editingShift
                        ? 'Save changes'
                        : 'Create shift'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
