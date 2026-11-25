'use client'

import React, { useState, useRef, useEffect, useMemo, useId } from 'react'
import { Clock, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CustomTimePickerProps {
  value?: string // 'HH:MM' 24-hour e.g. '14:00'
  defaultValue?: string
  onChange?: (time: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  id?: string
  name?: string
  required?: boolean
  clearable?: boolean
  use12Hour?: boolean
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

export function CustomTimePicker({
  value: controlledValue,
  defaultValue = '',
  onChange,
  placeholder = 'Select time...',
  disabled = false,
  className,
  triggerClassName,
  id,
  name,
  required,
  clearable = true,
  use12Hour = true,
}: CustomTimePickerProps) {
  const generatedId = useId()
  const inputId = id || generatedId

  const [internalValue, setInternalValue] = useState<string>(defaultValue)
  const isControlled = controlledValue !== undefined
  const currentValue = isControlled ? (controlledValue || '') : internalValue

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse hours & minutes
  const { hour24, minute } = useMemo(() => {
    if (!currentValue || !currentValue.includes(':')) {
      return { hour24: '12', minute: '00' }
    }
    const [h, m] = currentValue.split(':')
    return {
      hour24: h.padStart(2, '0'),
      minute: m.padStart(2, '0'),
    }
  }, [currentValue])

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

  // Format display label in 12h or 24h
  const displayLabel = useMemo(() => {
    if (!currentValue || !currentValue.includes(':')) return null
    if (!use12Hour) return currentValue

    const [hStr, mStr] = currentValue.split(':')
    const h = parseInt(hStr, 10)
    if (isNaN(h)) return currentValue

    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${String(h12).padStart(2, '0')}:${mStr} ${ampm}`
  }, [currentValue, use12Hour])

  const handleSelectTime = (newH24: string, newMin: string) => {
    const formatted = `${newH24}:${newMin}`
    if (!isControlled) {
      setInternalValue(formatted)
    }
    onChange?.(formatted)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isControlled) {
      setInternalValue('')
    }
    onChange?.('')
  }

  // Quick Presets
  const setPreset = (presetH24: string, presetMin: string) => {
    handleSelectTime(presetH24, presetMin)
    setIsOpen(false)
  }

  const setNow = () => {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, '0')
    const m = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0')
    handleSelectTime(h, m)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full text-left", className)}>
      {/* Hidden input for standard forms */}
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
          <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
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
              title="Clear time"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </div>
      </button>

      {/* Time Picker Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-1 z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100 select-none">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 text-xs font-semibold text-gray-900">
            <span>Select Time</span>
            {currentValue && (
              <span className="text-[#5e2b9d] bg-[#f7f2fd] px-2 py-0.5 rounded text-[11px]">
                {displayLabel}
              </span>
            )}
          </div>

          {/* Time Picker Columns */}
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* Hours Column */}
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">
                Hour
              </div>
              <div className="h-44 overflow-y-auto rounded-md border border-gray-100 p-1 divide-y divide-gray-50 scrollbar-thin">
                {HOURS_24.map((h) => {
                  const isSelected = h === hour24
                  const label = use12Hour
                    ? `${parseInt(h, 10) % 12 === 0 ? 12 : parseInt(h, 10) % 12} ${parseInt(h, 10) >= 12 ? 'PM' : 'AM'}`
                    : h

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectTime(h, minute)}
                      className={cn(
                        "w-full py-1 text-xs rounded transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[#5e2b9d] text-white font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">
                Minute
              </div>
              <div className="h-44 overflow-y-auto rounded-md border border-gray-100 p-1 divide-y divide-gray-50 scrollbar-thin">
                {MINUTES.map((m) => {
                  const isSelected = m === minute

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectTime(hour24, m)}
                      className={cn(
                        "w-full py-1 text-xs rounded transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[#5e2b9d] text-white font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Hospitality Presets */}
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase font-medium mb-1.5">
              Quick Presets
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <button
                type="button"
                onClick={setNow}
                className="py-1 px-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium truncate cursor-pointer"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => setPreset('11', '00')}
                className="py-1 px-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium truncate cursor-pointer"
                title="11:00 AM Check-out"
              >
                11:00 AM (Out)
              </button>
              <button
                type="button"
                onClick={() => setPreset('14', '00')}
                className="py-1 px-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium truncate cursor-pointer"
                title="02:00 PM Check-in"
              >
                02:00 PM (In)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
