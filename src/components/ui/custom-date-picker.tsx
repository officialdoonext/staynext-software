'use client'

import React, { useState, useRef, useEffect, useMemo, useId } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CustomDatePickerProps {
  value?: string // 'YYYY-MM-DD'
  defaultValue?: string
  onChange?: (date: string) => void
  placeholder?: string
  minDate?: string // 'YYYY-MM-DD'
  maxDate?: string // 'YYYY-MM-DD'
  disabled?: boolean
  className?: string
  triggerClassName?: string
  id?: string
  name?: string
  required?: boolean
  clearable?: boolean
  showShortcuts?: boolean
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function CustomDatePicker({
  value: controlledValue,
  defaultValue = '',
  onChange,
  placeholder = 'Select date...',
  minDate,
  maxDate,
  disabled = false,
  className,
  triggerClassName,
  id,
  name,
  required,
  clearable = true,
  showShortcuts = true,
}: CustomDatePickerProps) {
  const generatedId = useId()
  const inputId = id || generatedId

  const [internalValue, setInternalValue] = useState<string>(defaultValue)
  const isControlled = controlledValue !== undefined
  const currentValue = isControlled ? (controlledValue || '') : internalValue

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse current selected date or fallback to today
  const selectedDateObj = useMemo(() => {
    if (!currentValue) return null
    const [y, m, d] = currentValue.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  }, [currentValue])

  // Active view year & month for navigation
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDateObj) return new Date(selectedDateObj)
    return new Date()
  })

  // Synchronize viewDate when currentValue changes
  useEffect(() => {
    if (selectedDateObj) {
      setViewDate(new Date(selectedDateObj))
    }
  }, [selectedDateObj])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  // Format date helper: YYYY-MM-DD
  const formatDateString = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Display label in trigger button
  const displayLabel = useMemo(() => {
    if (!selectedDateObj) return null
    const day = selectedDateObj.getDate()
    const month = MONTH_NAMES[selectedDateObj.getMonth()].slice(0, 3)
    const year = selectedDateObj.getFullYear()
    return `${day} ${month}, ${year}`
  }, [selectedDateObj])

  // Month navigation
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleSelectDate = (date: Date) => {
    const str = formatDateString(date)
    if (!isControlled) {
      setInternalValue(str)
    }
    onChange?.(str)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isControlled) {
      setInternalValue('')
    }
    onChange?.('')
  }

  // Quick shortcuts
  const selectToday = () => {
    handleSelectDate(new Date())
  }

  const selectTomorrow = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    handleSelectDate(d)
  }

  // Generate days grid
  const daysInGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun
    const totalDays = lastDayOfMonth.getDate()

    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
    const days: Array<{
      date: Date
      isCurrentMonth: boolean
      isToday: boolean
      isSelected: boolean
      isDisabled: boolean
    }> = []

    const todayStr = formatDateString(new Date())

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i)
      const dStr = formatDateString(d)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === currentValue,
        isDisabled: (minDate && dStr < minDate) || (maxDate && dStr > maxDate) || false,
      })
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(currentYear, currentMonth, day)
      const dStr = formatDateString(d)
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === currentValue,
        isDisabled: (minDate && dStr < minDate) || (maxDate && dStr > maxDate) || false,
      })
    }

    // Next month filler days to complete 42 or 35 slots
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i)
      const dStr = formatDateString(d)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === currentValue,
        isDisabled: (minDate && dStr < minDate) || (maxDate && dStr > maxDate) || false,
      })
    }

    return days
  }, [currentYear, currentMonth, currentValue, minDate, maxDate])

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full text-left", className)}>
      {/* Hidden input for form submits */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={inputId}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 shadow-xs transition-colors",
          "hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5e2b9d] focus:border-[#5e2b9d]",
          disabled && "cursor-not-allowed opacity-50 bg-gray-50",
          !disabled && "cursor-pointer",
          isOpen && "border-[#5e2b9d] ring-1 ring-[#5e2b9d]",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          {displayLabel ? (
            <span className="text-gray-900 font-medium">{displayLabel}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && currentValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 cursor-pointer"
              title="Clear date"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </div>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-1 z-50 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100 select-none">
          {/* Calendar Header with Month/Year Navigation */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-xs font-semibold text-gray-900">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_LABELS.map((lbl, idx) => (
              <div
                key={lbl}
                className={cn(
                  "text-[10px] font-semibold uppercase py-1",
                  idx === 0 ? "text-rose-500" : "text-gray-400"
                )}
              >
                {lbl}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysInGrid.map((item, idx) => {
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => !item.isDisabled && handleSelectDate(item.date)}
                  className={cn(
                    "h-8 w-8 mx-auto flex items-center justify-center rounded-md text-xs font-medium transition-colors",
                    item.isDisabled && "opacity-25 cursor-not-allowed",
                    !item.isDisabled && "cursor-pointer",
                    !item.isCurrentMonth && "text-gray-300",
                    item.isCurrentMonth && !item.isSelected && "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    item.isToday && !item.isSelected && "border border-[#5e2b9d] text-[#5e2b9d] font-semibold",
                    item.isSelected && "bg-[#5e2b9d] text-white font-semibold shadow-xs hover:bg-[#4d2282]"
                  )}
                >
                  {item.date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Quick Preset Shortcuts Footer */}
          {showShortcuts && (
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectToday}
                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={selectTomorrow}
                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium cursor-pointer"
                >
                  Tomorrow
                </button>
              </div>

              {currentValue && (
                <button
                  type="button"
                  onClick={() => handleClear({ stopPropagation: () => {} } as any)}
                  className="text-gray-400 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
