'use client'

import React, { useState, useRef, useEffect, useMemo, useId } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  badge?: string
  icon?: React.ReactNode
  disabled?: boolean
  description?: string
}

export interface SearchableSelectProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options?: SelectOption[]
  children?: React.ReactNode
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  id?: string
  name?: string
  required?: boolean
  clearable?: boolean
  icon?: React.ReactNode
  emptyMessage?: string
}

export function SearchableSelect({
  value: controlledValue,
  defaultValue = '',
  onChange,
  options: directOptions,
  children,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search options...',
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  id,
  name,
  required,
  clearable = false,
  icon,
  emptyMessage = 'No options found',
}: SearchableSelectProps) {
  const generatedId = useId()
  const selectId = id || generatedId

  // Extract options from props or <option> children
  const parsedOptions: SelectOption[] = useMemo(() => {
    if (directOptions && directOptions.length > 0) {
      return directOptions
    }
    if (!children) return []

    const opts: SelectOption[] = []
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps = child.props as Record<string, any> | undefined
        if (child.type === 'option' || (childProps && 'value' in childProps)) {
          const val = String(childProps?.value ?? '')
          const lbl = typeof childProps?.children === 'string'
            ? childProps.children
            : Array.isArray(childProps?.children)
            ? childProps.children.join('')
            : String(childProps?.children ?? val)
          opts.push({
            value: val,
            label: lbl,
            disabled: !!childProps?.disabled,
          })
        }
      }
    })
    return opts
  }, [directOptions, children])

  const [internalValue, setInternalValue] = useState<string>(defaultValue)
  const isControlled = controlledValue !== undefined
  const currentValue = isControlled ? controlledValue : internalValue

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Current selected option
  const selectedOption = useMemo(() => {
    return parsedOptions.find((opt) => opt.value === currentValue)
  }, [parsedOptions, currentValue])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return parsedOptions
    const q = searchQuery.toLowerCase().trim()
    return parsedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    )
  }, [parsedOptions, searchQuery])

  // Handle open/close
  const handleOpen = () => {
    if (disabled) return
    setIsOpen(true)
    setSearchQuery('')
    // Set highlighted index to current value if found
    const idx = filteredOptions.findIndex((opt) => opt.value === currentValue)
    setHighlightedIndex(idx >= 0 ? idx : 0)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSearchQuery('')
  }

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val)
    }
    onChange?.(val)
    handleClose()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isControlled) {
      setInternalValue('')
    }
    onChange?.('')
  }

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        handleOpen()
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const target = filteredOptions[highlightedIndex]
      if (target && !target.disabled) {
        handleSelect(target.value)
      }
      return
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return
    const item = listRef.current.children[highlightedIndex] as HTMLElement
    if (item) {
      item.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block w-full text-left", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for standard form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        id={selectId}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        disabled={disabled}
        aria-haspopup="listbox"
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
          {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
          {selectedOption ? (
            <span className="truncate flex items-center gap-1.5">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span>{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="text-[10px] bg-purple-50 text-[#5e2b9d] px-1.5 py-0.5 rounded font-normal">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && currentValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 cursor-pointer"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180 text-[#5e2b9d]"
            )}
          />
        </div>
      </button>

      {/* Dropdown Popover Menu with Live Search */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 mt-1 z-50 w-full min-w-[200px] rounded-md border border-gray-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-100",
            contentClassName
          )}
        >
          {/* Search Box Header */}
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-md">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setHighlightedIndex(0)
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:border-[#5e2b9d] focus:ring-1 focus:ring-[#5e2b9d] placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto p-1 text-xs divide-y divide-transparent scrollbar-thin"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === currentValue
                const isHighlighted = idx === highlightedIndex

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "relative flex items-center justify-between px-2.5 py-2 rounded-md transition-colors cursor-pointer select-none",
                      opt.disabled && "cursor-not-allowed opacity-40 bg-gray-50",
                      isSelected
                        ? "bg-[#f7f2fd] text-[#5e2b9d] font-semibold"
                        : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-gray-400 font-normal truncate">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-normal">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#5e2b9d] shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-6 text-center text-xs text-gray-400">
                {emptyMessage}
              </div>
            )}
          </div>

          {/* Footer count indicator if options count is large */}
          {filteredOptions.length > 5 && (
            <div className="px-2.5 py-1 bg-gray-50 text-[10px] text-gray-400 border-t border-gray-100 rounded-b-md flex justify-between items-center">
              <span>{filteredOptions.length} available</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#5e2b9d] hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
