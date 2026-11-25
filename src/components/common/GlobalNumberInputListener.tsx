'use client'

import { useEffect } from 'react'

/**
 * GlobalNumberInputListener
 * 1. Blocks mouse wheel from incrementing or decrementing <input type="number"> values.
 * 2. Blurs active number inputs on wheel scroll so values do not accidentally change.
 */
export function GlobalNumberInputListener() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        target.tagName === 'INPUT' &&
        (target as HTMLInputElement).type === 'number'
      ) {
        // Prevent default browser number stepping on mouse wheel
        e.preventDefault()
      }
    }

    const handleWindowWheel = () => {
      const activeEl = document.activeElement as HTMLElement | null
      if (
        activeEl &&
        activeEl.tagName === 'INPUT' &&
        (activeEl as HTMLInputElement).type === 'number'
      ) {
        activeEl.blur()
      }
    }

    // Must be passive: false to allow e.preventDefault()
    document.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('wheel', handleWindowWheel, { passive: true })

    return () => {
      document.removeEventListener('wheel', handleWheel)
      window.removeEventListener('wheel', handleWindowWheel)
    }
  }, [])

  return null
}
