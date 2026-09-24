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
import DepartmentPicker from './components/DepartmentPicker'
import './App.css'

const API = 'http://172.20.10.4:5153'

type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  contractedHoursPerWeek: number
  departmentId: string
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
  status: 'Draft' | 'Published' | 'Updated'
  version: number
  wasPreviouslyPublished: boolean
  publishedAtUtc: string | null
  lastUpdatedAtUtc: string | null
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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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
  const [selectedDepartment, setSelectedDepartment] = useState('All')
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

  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false)
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
  const [peopleDepartment, setPeopleDepartment] = useState<string | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [employeeFirstName, setEmployeeFirstName] = useState('')
  const [employeeLastName, setEmployeeLastName] = useState('')
  const [employeeEmail, setEmployeeEmail] = useState('')
  const [employeeRole, setEmployeeRole] = useState('Team Member')
  const [employeeDepartmentId, setEmployeeDepartmentId] = useState('')
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

  const modalOpen = showEmployeeModal || showShiftModal || showRequestModal

  useEffect(() => {
    if (modalOpen === false) return

    const scrollY = window.scrollY
    const body = document.body

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [modalOpen])

  const activeEmployees = employees.filter(e => e.isActive)

  const departmentNames = Array.from(
    new Set(activeEmployees.map(employee => employee.departmentName).filter(Boolean))
  ).sort()

  const employeeDepartments = Array.from(
    new Map(
      employees
        .filter(employee => employee.departmentId && employee.departmentName)
        .map(employee => [
          employee.departmentId,
          {
            id: employee.departmentId,
            name: employee.departmentName,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name))

  const filteredEmployees =
    selectedDepartment === 'All'
      ? activeEmployees
      : activeEmployees.filter(
          employee => employee.departmentName === selectedDepartment
        )

  const departmentSummary = departmentNames.map(department => {
    const staff = activeEmployees.filter(
      employee => employee.departmentName === department
    )

    const scheduledToday = staff.filter(employee =>
      shiftFor(employee.id, days[selectedDayIndex])
    ).length

    return {
      name: department,
      staffCount: staff.length,
      scheduledToday,
    }
  })

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

  async function amendRota() {
    if (!rota || rota.status === 'Draft') return

    try {
      setPublishingRota(true)
      setError('')

      const response = await fetch(
        `${API}/api/rota/week/amend?start=${encodeURIComponent(
          toApiDate(weekStart),
        )}`,
        { method: 'PUT' },
      )

      if (!response.ok) {
        throw new Error('Could not reopen this rota for amendments.')
      }

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not reopen this rota for amendments.',
      )
    } finally {
      setPublishingRota(false)
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
    const defaultDate = days[selectedDayIndex]

    const departmentEmployees =
      selectedDepartment === 'All'
        ? activeEmployees
        : activeEmployees.filter(
            employee => employee.departmentName === selectedDepartment
          )

    setEditingShift(null)
    setEmployeeId(departmentEmployees[0]?.id ?? '')
    setShiftDate(toApiDate(defaultDate))
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
    setEmployeeDepartmentId(employeeDepartments[0]?.id ?? '')
  }

  function openEditEmployee(employee: Employee) {
    setEditingEmployee(employee)
    setEmployeeFirstName(employee.firstName)
    setEmployeeLastName(employee.lastName)
    setEmployeeEmail(employee.email)
    setEmployeeRole(employee.role)
    setEmployeeDepartmentId(employee.departmentId)
    setEmployeeHours(employee.contractedHoursPerWeek)
    setEmployeeDepartmentId(employee.departmentId)
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
      !employeeRole.trim() ||
      !employeeDepartmentId
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
            departmentId: employeeDepartmentId,
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
              <span>
                Hull Site · {selectedDepartment === 'All'
                  ? 'All departments'
                  : selectedDepartment}
              </span>
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
            className="primaryButton rotaAddButton pageActionButton"
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
              <div
                className={`rotaStatus ${
                  rota?.status === 'Draft' ? 'draft' : 'published'
                }`}
              >
                <span className="statusDot" />
                {rota?.status === 'Draft' && rota.wasPreviouslyPublished
                  ? 'Amending'
                  : rota?.status ?? 'Draft'}
                {rota && rota.version > 1 ? ` · v${rota.version}` : ''}
              </div>

              {rota?.status === 'Draft' ? (
                <button
                  className="publishRotaButton"
                  onClick={publishRota}
                  disabled={publishingRota || loading}
                >
                  {publishingRota
                    ? 'Publishing…'
                    : rota.wasPreviouslyPublished
                      ? 'Republish rota'
                      : 'Publish rota'}
                </button>
              ) : (
                <button
                  className="amendRotaButton"
                  onClick={amendRota}
                  disabled={publishingRota || loading}
                >
                  {publishingRota ? 'Opening…' : 'Amend rota'}
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
              <div className="desktopRotaWorkspace">
                {selectedDepartment === 'All' ? (
                  <div className="desktopDepartmentOverview">
                    <div className="desktopDepartmentOverviewHeader">
                      <div>
                        <span className="eyebrow">STORE OVERVIEW</span>
                        <h3>Department rotas</h3>
                        <p>
                          Select a department to view and manage its weekly rota.
                        </p>
                      </div>

                      <div className="desktopCoverageTotal">
                        <strong>
                          {departmentSummary.reduce(
                            (total, department) =>
                              total + department.scheduledToday,
                            0
                          )}
                        </strong>
                        <span>working today</span>
                      </div>
                    </div>

                    <div className="desktopDepartmentGrid">
                      {departmentSummary.map(department => (
                        <button
                          type="button"
                          className="desktopDepartmentCard"
                          key={department.name}
                          onClick={() =>
                            setSelectedDepartment(department.name)
                          }
                        >
                          <div className="desktopDepartmentIdentity">
                            <div className="departmentOverviewIcon">
                              {department.name.slice(0, 2).toUpperCase()}
                            </div>

                            <div>
                              <strong>{department.name}</strong>
                              <span>
                                {department.staffCount} team members
                              </span>
                            </div>
                          </div>

                          <div className="desktopDepartmentMeta">
                            <div>
                              <strong>{department.scheduledToday}</strong>
                              <span>working today</span>
                            </div>

                            <ChevronRight size={19} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="desktopDepartmentRotaHeader">
                      <button
                        type="button"
                        className="backToStoreOverview"
                        onClick={() => setSelectedDepartment('All')}
                      >
                        <ChevronLeft size={15} />
                        Store overview
                      </button>

                      <div className="desktopDepartmentRotaTitle">
                        <div>
                          <span className="eyebrow">
                            {selectedDepartment.toUpperCase()}
                          </span>
                          <h3>{selectedDepartment} weekly rota</h3>
                          <p>
                            {filteredEmployees.length} team members
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="desktopRotaGrid rotaGrid">
                      <div className="gridEmployeeHeader">EMPLOYEE</div>

                      {days.map(day => (
                        <div
                          className="gridDayHeader"
                          key={day.toISOString()}
                        >
                          {formatDay(day)}
                        </div>
                      ))}

                      {filteredEmployees.map(employee => (
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
                                    <span>{shift.paidHours}h paid</span>
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
                  </>
                )}
              </div>

              <div className="mobileAgenda">

                <div className="mobileRotaControls">
                  <div className="mobileDaySection">
                    <div className="mobileControlLabel">
                      <span>SELECT DAY</span>
                      <span>
                        {days[selectedDayIndex].toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="mobileDayStrip">
                      {days.map((day, index) => (
                        <button
                          type="button"
                          key={day.toISOString()}
                          className={index === selectedDayIndex ? 'active' : ''}
                          onClick={() => setSelectedDayIndex(index)}
                        >
                          <span>
                            {day
                              .toLocaleDateString('en-GB', {
                                weekday: 'short',
                              })
                              .toUpperCase()}
                          </span>
                          <strong>{day.getDate()}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mobileStaffingWorkspace">
                {selectedDepartment === 'All' ? (
                  <div className="mobileAgendaHeader storeOverviewHeader">
                    <div>
                      <span className="eyebrow">STORE OVERVIEW</span>
                      <h3>Staffing overview</h3>
                    </div>

                    <span className="mobileShiftCount">
                      {filteredEmployees.filter(employee =>
                        shiftFor(employee.id, days[selectedDayIndex])
                      ).length} working
                    </span>
                  </div>
                ) : (
                  <div className="departmentDrilldownHeader">
                    <button
                      type="button"
                      className="backToStoreOverview"
                      onClick={() => setSelectedDepartment('All')}
                    >
                      <ChevronLeft size={15} />
                      Store overview
                    </button>

                    <div className="departmentDrilldownTitle">
                      <div>
                        <span className="eyebrow">
                          {selectedDepartment.toUpperCase()}
                        </span>
                        <h3>{selectedDepartment} rota</h3>
                        <span className="departmentTeamCount">
                          {filteredEmployees.length} team members
                        </span>
                      </div>

                      <div className="departmentWorkingCount">
                        <strong>
                          {filteredEmployees.filter(employee =>
                            shiftFor(employee.id, days[selectedDayIndex])
                          ).length}
                        </strong>
                        <span>working</span>
                      </div>
                    </div>

                    <div className="departmentDayContext">
                      <span>
                        {days[selectedDayIndex].toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        }).toUpperCase()}
                      </span>

                      <strong>
                        {filteredEmployees.filter(employee =>
                          shiftFor(employee.id, days[selectedDayIndex])
                        ).length}{' '}
                        {filteredEmployees.filter(employee =>
                          shiftFor(employee.id, days[selectedDayIndex])
                        ).length === 1 ? 'shift' : 'shifts'}
                      </strong>
                    </div>
                  </div>
                )}

                {selectedDepartment === 'All' ? (
                  <div className="departmentOverview">
                    <div className="storeCoverageSummary">
                      <div>
                        <span className="storeCoverageLabel">
                          TEAM COVERAGE
                        </span>
                        <strong>
                          {departmentSummary.reduce(
                            (total, department) =>
                              total + department.scheduledToday,
                            0
                          )}{' '}
                          of {activeEmployees.length} team members scheduled
                        </strong>
                      </div>

                      <span className="storeCoverageDepartments">
                        {departmentSummary.length} departments
                      </span>
                    </div>

                    <div className="departmentOverviewList">
                      {departmentSummary.map(department => {
                        const hasCoverage = department.scheduledToday > 0

                        return (
                          <button
                            className={`departmentOverviewCard ${
                              hasCoverage ? 'hasCoverage' : 'noCoverage'
                            }`}
                            key={department.name}
                            onClick={() =>
                              setSelectedDepartment(department.name)
                            }
                          >
                            <div className="departmentOverviewMain">
                              <div className="departmentOverviewIcon">
                                {department.name.slice(0, 2).toUpperCase()}
                              </div>

                              <div className="departmentOverviewIdentity">
                                <strong>{department.name}</strong>
                                <span>
                                  {department.staffCount} team members
                                </span>
                              </div>
                            </div>

                            <div className="departmentOverviewAction">
                              <div className="departmentOverviewCoverage">
                                {hasCoverage ? (
                                  <>
                                    <strong>
                                      {department.scheduledToday}
                                    </strong>
                                    <span>
                                      {department.scheduledToday === 1
                                        ? 'working'
                                        : 'working'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <strong>—</strong>
                                    <span>No one scheduled</span>
                                  </>
                                )}
                              </div>

                              <div className="departmentOverviewOpen">
                                <span>View rota</span>
                                <ChevronRight size={17} />
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mobileAgendaList">
                    {filteredEmployees.map(employee => {
                      const shift = shiftFor(
                        employee.id,
                        days[selectedDayIndex]
                      )

                      return (
                        <div className="mobileAgendaRow" key={employee.id}>
                          <div className="avatar">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </div>

                          <div className="mobileAgendaPerson">
                            <strong>
                              {employee.firstName} {employee.lastName}
                            </strong>

                            <span>{employee.role}</span>
                          </div>

                          {shift ? (
                            <button
                              className="mobileShiftCard"
                              onClick={() => openEditShift(shift)}
                            >
                              <strong>
                                {formatTime(shift.startUtc)} –{' '}
                                {formatTime(shift.endUtc)}
                              </strong>

                              <span>
                                {shift.paidHours}h paid · tap to edit
                              </span>
                            </button>
                          ) : (
                            <span className="mobileNoShift">
                              No shift
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
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

              <button
                className="primaryButton peopleAddButton pageActionButton"
                onClick={openAddEmployee}
                aria-label="Add employee"
                title="Add employee"
              >
                <Plus size={20} />
              </button>
            </header>

            <section className="peopleWorkspace">
              {!peopleDepartment ? (
                <>
                  <div className="peopleOverview peopleOverviewCompact">
                    <div>
                      <div className="peopleOverviewLabel">TEAM OVERVIEW</div>
                      <h2>{activeEmployees.length} active employees</h2>
                      <p>
                        {departmentNames.length} departments ·{' '}
                        {activeEmployees.reduce(
                          (total, employee) =>
                            total + employee.contractedHoursPerWeek,
                          0,
                        )}h contracted / week
                      </p>
                    </div>
                  </div>

                  <div className="peopleSectionHeading">
                    <span>DEPARTMENTS</span>
                  </div>

                  <div className="peopleDepartmentDirectory">
                    {departmentNames.map(department => {
                      const departmentEmployees = activeEmployees.filter(
                        employee => employee.departmentName === department,
                      )

                      const supervisorCount = departmentEmployees.filter(
                        employee =>
                          employee.role.toLowerCase().includes('supervisor'),
                      ).length

                      const initials = department
                        .split(/\s|&/)
                        .filter(Boolean)
                        .map(part => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()

                      return (
                        <button
                          type="button"
                          className="peopleDepartmentRow"
                          key={department}
                          onClick={() => setPeopleDepartment(department)}
                        >
                          <div className="peopleDepartmentInitials">
                            {initials}
                          </div>

                          <div className="peopleDepartmentInfo">
                            <strong>{department}</strong>
                            <span>
                              {departmentEmployees.length}{' '}
                              {departmentEmployees.length === 1
                                ? 'team member'
                                : 'team members'}
                            </span>
                            <small>
                              {supervisorCount > 0
                                ? `${supervisorCount} ${
                                    supervisorCount === 1
                                      ? 'supervisor'
                                      : 'supervisors'
                                  } · ${
                                    departmentEmployees.length - supervisorCount
                                  } other team ${
                                    departmentEmployees.length -
                                      supervisorCount ===
                                    1
                                      ? 'member'
                                      : 'members'
                                  }`
                                : `${departmentEmployees.length} team members`}
                            </small>
                          </div>

                          <div className="peopleDepartmentArrow">›</div>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="peopleBackButton"
                    onClick={() => setPeopleDepartment(null)}
                  >
                    ‹ All departments
                  </button>

                  <div className="peopleDepartmentDetailHeader">
                    <div>
                      <div className="peopleOverviewLabel">DEPARTMENT</div>
                      <h2>{peopleDepartment}</h2>
                      <p>
                        {
                          activeEmployees.filter(
                            employee =>
                              employee.departmentName === peopleDepartment,
                          ).length
                        }{' '}
                        team members
                      </p>
                    </div>
                  </div>

                  <div className="peopleTeamDetail">
                    {activeEmployees
                      .filter(
                        employee =>
                          employee.departmentName === peopleDepartment,
                      )
                      .map(employee => (
                        <button
                          type="button"
                          className="peopleEmployeeRow"
                          key={employee.id}
                          onClick={() => openEditEmployee(employee)}
                        >
                          <div className="avatar peopleEmployeeAvatar">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </div>

                          <div className="peopleEmployeeInfo">
                            <strong>
                              {employee.firstName} {employee.lastName}
                            </strong>
                            <span>{employee.role}</span>
                            <small>
                              {employee.contractedHoursPerWeek}h / week
                              <span className="peopleActiveDot">•</span>
                              Active
                            </small>
                          </div>

                          <div className="peopleDepartmentArrow">›</div>
                        </button>
                      ))}
                  </div>
                </>
              )}
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
                className="primaryButton pageActionButton"
                onClick={openAddRequest}
                disabled={activeEmployees.length === 0}
                aria-label="New request"
                title="New request"
              >
                <Plus size={20} />
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

      <DepartmentPicker
        open={showDepartmentPicker}
        selectedDepartment={selectedDepartment}
        totalStaff={activeEmployees.length}
        totalScheduledToday={
          activeEmployees.filter(employee =>
            shiftFor(employee.id, days[selectedDayIndex])
          ).length
        }
        departments={departmentSummary}
        onSelect={setSelectedDepartment}
        onClose={() => setShowDepartmentPicker(false)}
      />

      {showRequestModal && (
        <div
          className="modalBackdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeRequestModal()
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">TIME OFF</div>
                <h2>New request</h2>
              </div>

              <button
                type="button"
                className="closeButton"
                onClick={closeRequestModal}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveRequest} className="premiumForm">
              <div className="formSection">
                <div className="formSectionLabel">EMPLOYEE</div>

                <div className="premiumSelectWrap">
                  <div className="employeeMiniAvatar">
                    {activeEmployees
                      .find(employee => employee.id === requestEmployeeId)
                      ?.firstName?.charAt(0)}
                    {activeEmployees
                      .find(employee => employee.id === requestEmployeeId)
                      ?.lastName?.charAt(0)}
                  </div>

                  <select
                    className="premiumSelect"
                    value={requestEmployeeId}
                    onChange={event => setRequestEmployeeId(event.target.value)}
                  >
                    {activeEmployees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>

                  <span className="fieldChevron">›</span>
                </div>
              </div>

              <div className="formSection">
                <div className="formSectionLabel">DATES</div>

                <div className="timeFieldGroup">
                  <label className="timeField">
                    <span>START</span>
                    <input
                      type="date"
                      value={requestStartDate}
                      onChange={event => setRequestStartDate(event.target.value)}
                    />
                  </label>

                  <label className="timeField">
                    <span>END</span>
                    <input
                      type="date"
                      value={requestEndDate}
                      min={requestStartDate || undefined}
                      onChange={event => setRequestEndDate(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="formSection">
                <div className="formSectionLabel">REASON</div>

                <input
                  className="premiumField"
                  value={requestReason}
                  onChange={event => setRequestReason(event.target.value)}
                  placeholder="e.g. Annual leave"
                />
              </div>

              {requestFormError && (
                <div className="formError">{requestFormError}</div>
              )}

              <button
                type="submit"
                className="primaryButton premiumSubmitButton"
                disabled={savingRequest}
              >
                <ClipboardList size={18} />
                {savingRequest ? 'Creating…' : 'Create request'}
              </button>
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

            <form
              className="premiumEmployeeForm"
              onSubmit={saveEmployee}
            >
              <div className="employeeNameFields">
                <label className="premiumEmployeeField">
                  <span>FIRST NAME</span>
                  <input
                    autoComplete="given-name"
                    value={employeeFirstName}
                    onChange={e => setEmployeeFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </label>

                <label className="premiumEmployeeField">
                  <span>LAST NAME</span>
                  <input
                    autoComplete="family-name"
                    value={employeeLastName}
                    onChange={e => setEmployeeLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </label>
              </div>

              <label className="premiumEmployeeField">
                <span>EMAIL</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={employeeEmail}
                  onChange={e => setEmployeeEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </label>

              <label className="premiumEmployeeField">
                <span>ROLE</span>
                <input
                  value={employeeRole}
                  onChange={e => setEmployeeRole(e.target.value)}
                  placeholder="e.g. Sales Advisor"
                />
              </label>

              <label className="premiumEmployeeField">
                <span>DEPARTMENT</span>
                <select
                  value={employeeDepartmentId}
                  onChange={e => setEmployeeDepartmentId(e.target.value)}
                >
                  <option value="" disabled>
                    Select department
                  </option>

                  {employeeDepartments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="premiumEmployeeField">
                <span>CONTRACT HOURS / WEEK</span>
                <div className="employeeHoursControl">
                  <button
                    type="button"
                    aria-label="Reduce contracted hours"
                    onClick={() =>
                      setEmployeeHours(hours => Math.max(0, Number(hours) - 1))
                    }
                  >
                    −
                  </button>

                  <div>
                    <strong>{employeeHours}</strong>
                    <small>hours</small>
                  </div>

                  <button
                    type="button"
                    aria-label="Increase contracted hours"
                    onClick={() =>
                      setEmployeeHours(hours => Math.min(168, Number(hours) + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </label>

              {employeeFormError && (
                <div className="formError">{employeeFormError}</div>
              )}

              <div className="premiumEmployeeActions">
                {editingEmployee?.isActive ? (
                  <button
                    type="button"
                    className="employeeDeactivateButton"
                    onClick={deactivateEmployee}
                    disabled={savingEmployee}
                  >
                    Deactivate
                  </button>
                ) : editingEmployee ? (
                  <button
                    type="button"
                    className="employeeReactivateButton"
                    onClick={reactivateEmployee}
                    disabled={savingEmployee}
                  >
                    Reactivate
                  </button>
                ) : null}

                <button
                  type="submit"
                  className="primaryButton premiumEmployeeSubmit"
                  disabled={savingEmployee || !employeeDepartmentId}
                >
                  {savingEmployee
                    ? 'Saving…'
                    : editingEmployee
                      ? 'Save changes'
                      : 'Add employee'}
                </button>
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

            <form onSubmit={saveShift} className="premiumForm">
              <div className="formIntro">
                <p>
                  {editingShift
                    ? 'Update the shift details below.'
                    : 'Create a shift for your team.'}
                </p>
              </div>

              <div className="formSection">
                <div className="formSectionLabel">EMPLOYEE</div>

                <div className="premiumSelectWrap">
                  <div className="employeeMiniAvatar">
                    {activeEmployees.find(employee => employee.id === employeeId)?.firstName?.charAt(0)}
                    {activeEmployees.find(employee => employee.id === employeeId)?.lastName?.charAt(0)}
                  </div>

                  <select
                    className="premiumSelect"
                    value={employeeId}
                    onChange={event => setEmployeeId(event.target.value)}
                    disabled={Boolean(editingShift)}
                  >
                    {activeEmployees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>

                  <span className="fieldChevron">›</span>
                </div>
              </div>

              <div className="formSection">
                <div className="formSectionLabel">DATE</div>

                <input
                  className="premiumField"
                  type="date"
                  value={shiftDate}
                  onChange={event => setShiftDate(event.target.value)}
                />
              </div>

              <div className="formSection">
                <div className="formSectionLabel">TIME</div>

                <div className="timeFieldGroup">
                  <label className="timeField">
                    <span>START</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={event => setStartTime(event.target.value)}
                    />
                  </label>

                  <label className="timeField">
                    <span>END</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={event => setEndTime(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="formSection">
                <div className="breakHeader">
                  <div className="formSectionLabel">BREAK</div>
                  <button
                    type="button"
                    className="customBreakLink"
                    onClick={() => {
                      const value = window.prompt(
                        'Custom break time in minutes',
                        String(breakMinutes),
                      )

                      if (value === null) return

                      const minutes = Number(value)

                      if (
                        Number.isFinite(minutes) &&
                        minutes >= 0 &&
                        minutes <= 180
                      ) {
                        setBreakMinutes(Math.round(minutes))
                      }
                    }}
                  >
                    Custom ›
                  </button>
                </div>

                <div className="breakChoices">
                  {[0, 15, 30, 45].map(minutes => (
                    <button
                      key={minutes}
                      type="button"
                      className={`breakChoice ${breakMinutes === minutes ? 'active' : ''}`}
                      onClick={() => setBreakMinutes(minutes)}
                    >
                      {minutes === 0 ? 'None' : `${minutes}m`}
                    </button>
                  ))}
                </div>

                {![0, 15, 30, 45].includes(breakMinutes) && (
                  <div className="customBreakValue">
                    Custom break · {breakMinutes} minutes
                  </div>
                )}
              </div>

              {formError && (
                <div className="formError">{formError}</div>
              )}

              <div className="premiumFormFooter">
                {editingShift && (
                  <button
                    type="button"
                    className="dangerButton premiumDelete"
                    onClick={deleteShift}
                    disabled={saving || deleting}
                  >
                    <Trash2 size={16} />
                    {deleting ? 'Deleting…' : 'Delete shift'}
                  </button>
                )}

                <button
                  type="submit"
                  className="primaryButton premiumSubmit"
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
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
