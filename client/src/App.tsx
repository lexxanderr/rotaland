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
  ClipboardList,
  Check,
} from 'lucide-react'
import './App.css'

const API = 'http://172.20.10.4:5153'

type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
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
  status: 'Draft' | 'Published'
  publishedAtUtc: string | null
  totalScheduledHours: number
  shifts: Shift[]
}

type TimeOffRequest = {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  endDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAtUtc: string
  reviewedAtUtc: string | null
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
  const [page, setPage] = useState<'rota' | 'employees' | 'requests'>('rota')
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay()
    return today === 0 ? 6 : today - 1
  })
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [rota, setRota] = useState<WeeklyRota | null>(null)
  const [publishingRota, setPublishingRota] = useState(false)
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

  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [employeeFirstName, setEmployeeFirstName] = useState('')
  const [employeeLastName, setEmployeeLastName] = useState('')
  const [employeeEmail, setEmployeeEmail] = useState('')
  const [employeeRole, setEmployeeRole] = useState('Team Member')
  const [employeeHours, setEmployeeHours] = useState(40)
  const [employeeFormError, setEmployeeFormError] = useState('')
  const [savingEmployee, setSavingEmployee] = useState(false)

  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestEmployeeId, setRequestEmployeeId] = useState('')
  const [requestStartDate, setRequestStartDate] = useState('')
  const [requestEndDate, setRequestEndDate] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [requestFormError, setRequestFormError] = useState('')
  const [savingRequest, setSavingRequest] = useState(false)
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null)

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

      const [rotaResponse, employeesResponse, requestsResponse] = await Promise.all([
        fetch(
          `${API}/api/rota/week?start=${encodeURIComponent(
            toApiDate(weekStart),
          )}`,
        ),
        fetch(`${API}/api/employees`),
        fetch(`${API}/api/requests/time-off`),
      ])

      if (!rotaResponse.ok || !employeesResponse.ok || !requestsResponse.ok) {
        throw new Error('Could not load RotaLand data.')
      }

      setRota(await rotaResponse.json())
      setEmployees(await employeesResponse.json())
      setRequests(await requestsResponse.json())
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

  async function publishRota() {
    if (!rota || rota.status === 'Published') return

    try {
      setPublishingRota(true)
      setError('')

      const response = await fetch(
        `${API}/api/rota/week/publish?start=${encodeURIComponent(
          toApiDate(weekStart),
        )}`,
        { method: 'PUT' },
      )

      if (!response.ok) {
        throw new Error('Could not publish this rota.')
      }

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not publish this rota.',
      )
    } finally {
      setPublishingRota(false)
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
          startUtc,
          endUtc,
          breakMinutes: Number(breakMinutes),
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

  function openAddEmployee() {
    setEditingEmployee(null)
    setEmployeeFirstName('')
    setEmployeeLastName('')
    setEmployeeEmail('')
    setEmployeeRole('Team Member')
    setEmployeeHours(40)
    setEmployeeFormError('')
    setShowEmployeeModal(true)
  }

  function openEditEmployee(employee: Employee) {
    setEditingEmployee(employee)
    setEmployeeFirstName(employee.firstName)
    setEmployeeLastName(employee.lastName)
    setEmployeeEmail(employee.email)
    setEmployeeRole(employee.role)
    setEmployeeHours(employee.contractedHoursPerWeek)
    setEmployeeFormError('')
    setShowEmployeeModal(true)
  }

  function closeEmployeeModal() {
    if (savingEmployee) return
    setShowEmployeeModal(false)
    setEditingEmployee(null)
    setEmployeeFormError('')
  }

  async function saveEmployee(event: React.FormEvent) {
    event.preventDefault()
    setEmployeeFormError('')

    if (
      !employeeFirstName.trim() ||
      !employeeLastName.trim() ||
      !employeeEmail.trim() ||
      !employeeRole.trim()
    ) {
      setEmployeeFormError('Please complete all employee fields.')
      return
    }

    try {
      setSavingEmployee(true)

      const response = await fetch(
        editingEmployee
          ? `${API}/api/employees/${editingEmployee.id}`
          : `${API}/api/employees`,
        {
          method: editingEmployee ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: employeeFirstName.trim(),
            lastName: employeeLastName.trim(),
            email: employeeEmail.trim(),
            role: employeeRole.trim(),
            contractedHoursPerWeek: Number(employeeHours),
            departmentId: 'bccd62a9-0288-4d8d-9c00-1f3537c91eee',
          }),
        },
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message ??
            `Could not ${editingEmployee ? 'update' : 'create'} employee.`,
        )
      }

      setShowEmployeeModal(false)
      setEditingEmployee(null)
      await loadData()
    } catch (err) {
      setEmployeeFormError(
        err instanceof Error ? err.message : 'Could not save employee.',
      )
    } finally {
      setSavingEmployee(false)
    }
  }

  async function deactivateEmployee() {
    if (!editingEmployee || !editingEmployee.isActive) return

    const confirmed = window.confirm(
      `Deactivate ${editingEmployee.firstName} ${editingEmployee.lastName}?`,
    )

    if (!confirmed) return

    try {
      setSavingEmployee(true)
      setEmployeeFormError('')

      const response = await fetch(
        `${API}/api/employees/${editingEmployee.id}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message ?? 'Could not deactivate employee.')
      }

      setShowEmployeeModal(false)
      setEditingEmployee(null)
      await loadData()
    } catch (err) {
      setEmployeeFormError(
        err instanceof Error
          ? err.message
          : 'Could not deactivate employee.',
      )
    } finally {
      setSavingEmployee(false)
    }
  }

  async function reactivateEmployee() {
    if (!editingEmployee || editingEmployee.isActive) return

    try {
      setSavingEmployee(true)
      setEmployeeFormError('')

      const response = await fetch(
        `${API}/api/employees/${editingEmployee.id}/reactivate`,
        { method: 'PUT' },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message ?? 'Could not reactivate employee.')
      }

      setShowEmployeeModal(false)
      setEditingEmployee(null)
      await loadData()
    } catch (err) {
      setEmployeeFormError(
        err instanceof Error
          ? err.message
          : 'Could not reactivate employee.',
      )
    } finally {
      setSavingEmployee(false)
    }
  }


  function openAddRequest() {
    setRequestEmployeeId(activeEmployees[0]?.id ?? '')
    setRequestStartDate('')
    setRequestEndDate('')
    setRequestReason('')
    setRequestFormError('')
    setShowRequestModal(true)
  }

  function closeRequestModal() {
    if (savingRequest) return
    setShowRequestModal(false)
    setRequestFormError('')
  }

  async function saveRequest(event: React.FormEvent) {
    event.preventDefault()
    setRequestFormError('')

    if (!requestEmployeeId || !requestStartDate || !requestEndDate || !requestReason.trim()) {
      setRequestFormError('Please complete all request fields.')
      return
    }

    if (requestEndDate < requestStartDate) {
      setRequestFormError('End date cannot be before start date.')
      return
    }

    try {
      setSavingRequest(true)

      const response = await fetch(`${API}/api/requests/time-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: requestEmployeeId,
          startDate: requestStartDate,
          endDate: requestEndDate,
          reason: requestReason.trim(),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? 'Could not create time-off request.')
      }

      setShowRequestModal(false)
      await loadData()
    } catch (err) {
      setRequestFormError(
        err instanceof Error ? err.message : 'Could not create time-off request.',
      )
    } finally {
      setSavingRequest(false)
    }
  }

  async function reviewRequest(requestId: string, decision: 'approve' | 'reject') {
    try {
      setReviewingRequestId(requestId)
      setError('')

      const response = await fetch(
        `${API}/api/requests/time-off/${requestId}/${decision}`,
        { method: 'PUT' },
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? `Could not ${decision} request.`)
      }

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not review request.')
    } finally {
      setReviewingRequestId(null)
    }
  }

  const pendingRequests = requests.filter(request => request.status === 'Pending').length
  const approvedRequests = requests.filter(request => request.status === 'Approved').length
  const rejectedRequests = requests.filter(request => request.status === 'Rejected').length

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logoMark">R</span>
          <span>RotaLand</span>
        </div>

        <nav>
          <button
            className={`navItem ${page === 'rota' ? 'active' : ''}`}
            onClick={() => setPage('rota')}
          >
            <CalendarDays size={18} />
            Rota
          </button>

          <button
            className={`navItem ${page === 'employees' ? 'active' : ''}`}
            onClick={() => setPage('employees')}
          >
            <Users size={18} />
            Employees
          </button>

          <button
            className={`navItem ${page === 'requests' ? 'active' : ''}`}
            onClick={() => setPage('requests')}
          >
            <ClipboardList size={18} />
            Requests
          </button>
        </nav>

        <div className="sidebarBottom">
          <div className="siteLabel">CURRENT SITE</div>
          <strong>Hull Site</strong>
          <span>Operations</span>
        </div>
      </aside>

      <main className="main">
        <div className="mobileHeader">
          <div className="mobileBrand">
            <span className="logoMark">R</span>
            <div>
              <strong>RotaLand</strong>
              <span>Hull Site · Operations</span>
            </div>
          </div>
        </div>
        {page === 'rota' ? (
          <>
        <header className="topbar">
          <div>
            <div className="eyebrow">OPERATIONS</div>
            <h1>Weekly Rota</h1>
          </div>

          <button
            className="primaryButton"
            aria-label="Add shift"
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

            <div className="rotaHeaderActions">
              <div className={`rotaStatus ${rota?.status === 'Published' ? 'published' : 'draft'}`}>
                <span className="statusDot" />
                {rota?.status ?? 'Draft'}
              </div>

              {rota?.status !== 'Published' && (
                <button
                  className="publishRotaButton"
                  onClick={publishRota}
                  disabled={publishingRota || loading}
                >
                  {publishingRota ? 'Publishing…' : 'Publish rota'}
                </button>
              )}

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
          </div>

          {loading && <div className="state">Loading rota…</div>}

          {error && <div className="state error">{error}</div>}

          {!loading && !error && (
            <>
              <div className="desktopRotaGrid rotaGrid">
                <div className="gridEmployeeHeader">EMPLOYEE</div>

                {days.map(day => (
                  <div className="gridDayHeader" key={day.toISOString()}>
                    {formatDay(day)}
                  </div>
                ))}

                {activeEmployees.map(employee => (
                  <div className="employeeRow" key={employee.id}>
                    <div className="employee">
                      <div className="avatar">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      <div>
                        <strong>{employee.firstName} {employee.lastName}</strong>
                        <span>{employee.role}</span>
                      </div>
                    </div>

                    {days.map(day => {
                      const shift = shiftFor(employee.id, day)
                      return (
                        <div className="shiftCell" key={day.toISOString()}>
                          {shift ? (
                            <button className="shift" onClick={() => openEditShift(shift)}>
                              <strong>{formatTime(shift.startUtc)} – {formatTime(shift.endUtc)}</strong>
                              <span>{shift.paidHours}h paid</span>
                              <span className="shiftHint">Click to edit</span>
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

              <div className="mobileAgenda">
                <div className="mobileDayStrip" aria-label="Choose rota day">
                  {days.map((day, index) => (
                    <button
                      key={day.toISOString()}
                      className={index === selectedDayIndex ? 'active' : ''}
                      onClick={() => setSelectedDayIndex(index)}
                    >
                      <span>{day.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                      <strong>{day.getDate()}</strong>
                    </button>
                  ))}
                </div>

                <div className="mobileAgendaHeader">
                  <div>
                    <span className="eyebrow">SCHEDULE</span>
                    <h3>{days[selectedDayIndex].toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                  </div>
                  <span className="mobileShiftCount">
                    {activeEmployees.filter(e => shiftFor(e.id, days[selectedDayIndex])).length} shifts
                  </span>
                </div>

                <div className="mobileAgendaList">
                  {activeEmployees.map(employee => {
                    const shift = shiftFor(employee.id, days[selectedDayIndex])
                    return (
                      <div className="mobileAgendaRow" key={employee.id}>
                        <div className="avatar">{employee.firstName[0]}{employee.lastName[0]}</div>
                        <div className="mobileAgendaPerson">
                          <strong>{employee.firstName} {employee.lastName}</strong>
                          <span>{employee.role}</span>
                        </div>
                        {shift ? (
                          <button className="mobileShiftCard" onClick={() => openEditShift(shift)}>
                            <strong>{formatTime(shift.startUtc)} – {formatTime(shift.endUtc)}</strong>
                            <span>{shift.paidHours}h paid · tap to edit</span>
                          </button>
                        ) : (
                          <span className="mobileNoShift">No shift</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}        </section>
          </>
        ) : page === 'employees' ? (
          <>
            <header className="topbar">
              <div>
                <div className="eyebrow">PEOPLE</div>
                <h1>Employees</h1>
              </div>

              <button className="primaryButton" onClick={openAddEmployee}>
                <Plus size={17} />
                Add employee
              </button>
            </header>

            <section className="employeePanel">
              <div className="employeePanelHeader">
                <div>
                  <h2>Team</h2>
                  <p>{activeEmployees.length} active employees</p>
                </div>
              </div>

              <div className="employeeList">
                {employees.map(employee => (
                  <button
                    className="employeeListRow"
                    key={employee.id}
                    onClick={() => openEditEmployee(employee)}
                  >
                    <div className="employeeListIdentity">
                      <div className="avatar">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </div>

                      <div>
                        <strong>
                          {employee.firstName} {employee.lastName}
                        </strong>
                        <span>{employee.email}</span>
                      </div>
                    </div>

                    <div className="employeeMeta">
                      <div>
                        <span>Role</span>
                        <strong>{employee.role}</strong>
                      </div>

                      <div>
                        <span>Department</span>
                        <strong>{employee.departmentName}</strong>
                      </div>

                      <div>
                        <span>Contract</span>
                        <strong>
                          {employee.contractedHoursPerWeek}h / week
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong
                          className={
                            employee.isActive
                              ? 'statusActive'
                              : 'statusInactive'
                          }
                        >
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </strong>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="topbar">
              <div>
                <div className="eyebrow">TIME OFF</div>
                <h1>Requests</h1>
              </div>

              <button
                className="primaryButton"
                onClick={openAddRequest}
                disabled={activeEmployees.length === 0}
              >
                <Plus size={17} />
                New request
              </button>
            </header>

            <section className="stats">
              <div className="statCard">
                <div className="statIcon"><ClipboardList size={19} /></div>
                <div><span>Pending</span><strong>{pendingRequests}</strong></div>
              </div>
              <div className="statCard">
                <div className="statIcon"><Check size={19} /></div>
                <div><span>Approved</span><strong>{approvedRequests}</strong></div>
              </div>
              <div className="statCard">
                <div className="statIcon"><X size={19} /></div>
                <div><span>Rejected</span><strong>{rejectedRequests}</strong></div>
              </div>
            </section>

            <section className="employeePanel">
              <div className="employeePanelHeader">
                <div>
                  <h2>Time-off requests</h2>
                  <p>{requests.length} total requests</p>
                </div>
              </div>

              {error && <div className="state error">{error}</div>}

              <div className="employeeList">
                {requests.length === 0 ? (
                  <div className="state">No time-off requests yet.</div>
                ) : (
                  requests.map(request => (
                    <div className="employeeListRow" key={request.id}>
                      <div className="employeeListIdentity">
                        <div className="avatar">
                          {request.employeeName
                            .split(' ')
                            .map(part => part[0])
                            .slice(0, 2)
                            .join('')}
                        </div>

                        <div>
                          <strong>{request.employeeName}</strong>
                          <span>{request.reason}</span>
                        </div>
                      </div>

                      <div className="employeeMeta">
                        <div>
                          <span>Dates</span>
                          <strong>
                            {new Date(`${request.startDate}T00:00:00`).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            {' – '}
                            {new Date(`${request.endDate}T00:00:00`).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <span className={`statusPill status${request.status}`}>
                            <span className="statusDot" />
                            {request.status}
                          </span>
                        </div>

                        {request.status === 'Pending' && (
                          <div className="requestActions">
                            <button
                              className="secondaryButton"
                              onClick={() => reviewRequest(request.id, 'approve')}
                              disabled={reviewingRequestId === request.id}
                            >
                              <Check size={15} />
                              Approve
                            </button>
                            <button
                              className="dangerButton"
                              onClick={() => reviewRequest(request.id, 'reject')}
                              disabled={reviewingRequestId === request.id}
                            >
                              <X size={15} />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <nav className="mobileNav" aria-label="Mobile navigation">
        <button
          className={page === 'rota' ? 'active' : ''}
          onClick={() => setPage('rota')}
        >
          <CalendarDays size={20} />
          <span>Rota</span>
        </button>
        <button
          className={page === 'employees' ? 'active' : ''}
          onClick={() => setPage('employees')}
        >
          <Users size={20} />
          <span>People</span>
        </button>
        <button
          className={page === 'requests' ? 'active' : ''}
          onClick={() => setPage('requests')}
        >
          <ClipboardList size={20} />
          <span>Requests</span>
          {pendingRequests > 0 && <b>{pendingRequests}</b>}
        </button>
      </nav>

      {showRequestModal && (
        <div
          className="modalBackdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeRequestModal()
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">TIME OFF</div>
                <h2>New time-off request</h2>
              </div>

              <button className="closeButton" onClick={closeRequestModal}>
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveRequest}>
              <label>
                Employee
                <select
                  value={requestEmployeeId}
                  onChange={event => setRequestEmployeeId(event.target.value)}
                >
                  {activeEmployees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </label>

              <div className="formGrid">
                <label>
                  Start date
                  <input
                    type="date"
                    value={requestStartDate}
                    onChange={event => setRequestStartDate(event.target.value)}
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    value={requestEndDate}
                    onChange={event => setRequestEndDate(event.target.value)}
                  />
                </label>
              </div>

              <label>
                Reason
                <input
                  value={requestReason}
                  onChange={event => setRequestReason(event.target.value)}
                  placeholder="e.g. Annual leave"
                />
              </label>

              {requestFormError && (
                <div className="formError">{requestFormError}</div>
              )}

              <div className="modalActions">
                <div />
                <div className="modalActionsRight">
                  <button
                    type="button"
                    className="secondaryButton"
                    onClick={closeRequestModal}
                    disabled={savingRequest}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primaryButton"
                    disabled={savingRequest}
                  >
                    {savingRequest ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmployeeModal && (
        <div
          className="modalBackdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeEmployeeModal()
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">PEOPLE</div>
                <h2>
                  {editingEmployee ? 'Edit employee' : 'Add employee'}
                </h2>
              </div>

              <button
                className="closeButton"
                onClick={closeEmployeeModal}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveEmployee}>
              <div className="formGrid">
                <label>
                  First name
                  <input
                    value={employeeFirstName}
                    onChange={e => setEmployeeFirstName(e.target.value)}
                  />
                </label>

                <label>
                  Last name
                  <input
                    value={employeeLastName}
                    onChange={e => setEmployeeLastName(e.target.value)}
                  />
                </label>
              </div>

              <label>
                Email
                <input
                  type="email"
                  value={employeeEmail}
                  onChange={e => setEmployeeEmail(e.target.value)}
                />
              </label>

              <label>
                Role
                <input
                  value={employeeRole}
                  onChange={e => setEmployeeRole(e.target.value)}
                />
              </label>

              <label>
                Contracted hours per week
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={employeeHours}
                  onChange={e => setEmployeeHours(Number(e.target.value))}
                />
              </label>

              {employeeFormError && (
                <div className="formError">{employeeFormError}</div>
              )}

              <div className="modalActions">
                {editingEmployee?.isActive ? (
                  <button
                    type="button"
                    className="dangerButton"
                    onClick={deactivateEmployee}
                    disabled={savingEmployee}
                  >
                    Deactivate
                  </button>
                ) : editingEmployee ? (
                  <button
                    type="button"
                    className="secondaryButton"
                    onClick={reactivateEmployee}
                    disabled={savingEmployee}
                  >
                    Reactivate
                  </button>
                ) : null}

                <div className="modalActionsRight">
                  <button
                    type="button"
                    className="secondaryButton"
                    onClick={closeEmployeeModal}
                    disabled={savingEmployee}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primaryButton"
                    disabled={savingEmployee}
                  >
                    {savingEmployee
                      ? 'Saving...'
                      : editingEmployee
                        ? 'Save changes'
                        : 'Add employee'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
