import { useEffect } from 'react'
import { Check, X } from 'lucide-react'

type DepartmentOption = {
  name: string
  staffCount: number
  scheduledToday: number
}

type Props = {
  open: boolean
  selectedDepartment: string
  totalStaff: number
  totalScheduledToday: number
  departments: DepartmentOption[]
  onSelect: (department: string) => void
  onClose: () => void
}

export default function DepartmentPicker({
  open,
  selectedDepartment,
  totalStaff,
  totalScheduledToday,
  departments,
  onSelect,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY

    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''

      window.scrollTo(0, scrollY)
    }
  }, [open])

  if (!open) return null

  function select(department: string) {
    onSelect(department)
    onClose()
  }

  return (
    <div
      className="departmentPickerBackdrop"
      onClick={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="departmentPickerSheet">
        <div className="departmentPickerHandle" />

        <div className="departmentPickerHeader">
          <div>
            <span>ROTA VIEW</span>
            <h3>Choose department</h3>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="departmentPickerOptions">
          <button
            type="button"
            className={selectedDepartment === 'All' ? 'active' : ''}
            onClick={() => select('All')}
          >
            <div className="departmentPickerIdentity">
              <span className="departmentPickerInitials">ALL</span>
              <div>
                <strong>All departments</strong>
                <span>
                  {totalStaff} staff · {totalScheduledToday} scheduled
                </span>
              </div>
            </div>

            {selectedDepartment === 'All' && <Check size={18} />}
          </button>

          {departments.map(department => (
            <button
              type="button"
              key={department.name}
              className={
                selectedDepartment === department.name ? 'active' : ''
              }
              onClick={() => select(department.name)}
            >
              <div className="departmentPickerIdentity">
                <span className="departmentPickerInitials">
                  {department.name.slice(0, 2).toUpperCase()}
                </span>

                <div>
                  <strong>{department.name}</strong>
                  <span>
                    {department.staffCount} staff ·{' '}
                    {department.scheduledToday} scheduled
                  </span>
                </div>
              </div>

              {selectedDepartment === department.name && (
                <Check size={18} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
