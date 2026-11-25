'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Sparkles,
  Wrench,
  UtensilsCrossed,
  X,
  Volume2,
  Clock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { playNotificationChime } from '@/lib/sound'
import {
  RequestNotification,
  getRecentRequestNotifications,
} from '@/services/request-notifications.service'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'staynext_read_notifications'

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Math.max(0, Date.now() - new Date(dateString).getTime())
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return 'Just now'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return 'Recently'
  }
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<RequestNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [activeAlert, setActiveAlert] = useState<RequestNotification | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'food' | 'housekeeping' | 'maintenance'>('all')
  const [hasNewAlertAnimation, setHasNewAlertAnimation] = useState(false)

  // Track known IDs so we only alert for genuinely new incoming requests
  const knownIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoadRef = useRef(true)

  // 1. Initialize read IDs from localStorage on client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed))
        }
      }
    } catch (e) {
      console.warn('Failed to load read notifications from localStorage:', e)
    }
  }, [])

  // 2. Fetch notifications from server action
  const loadNotifications = useCallback(async (isInitial = false) => {
    try {
      const data = await getRecentRequestNotifications()
      if (!data) return

      // Detect any new incoming requests that we haven't seen yet
      if (!isInitial && knownIdsRef.current.size > 0) {
        const incomingNew = data.filter((item) => !knownIdsRef.current.has(item.id))
        if (incomingNew.length > 0) {
          const newest = incomingNew[0]
          // Play notification chime
          playNotificationChime()
          // Show immediate alert modal/card
          setActiveAlert(newest)
          // Trigger bell wiggle animation
          setHasNewAlertAnimation(true)
          setTimeout(() => setHasNewAlertAnimation(false), 3000)
        }
      }

      // Update known IDs
      data.forEach((item) => knownIdsRef.current.add(item.id))
      setNotifications(data)
    } catch (err) {
      console.warn('Error loading notifications:', err)
    } finally {
      if (isInitial) {
        isFirstLoadRef.current = false
      }
    }
  }, [])

  // 3. Mark a notification as read and persist to localStorage ("on click on ok mark that as read dont show again")
  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const updated = new Set(prev)
      updated.add(id)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(updated)))
      } catch (e) {
        console.warn('Failed to save read notifications:', e)
      }
      return updated
    })

    // If active alert matches this notification, dismiss it immediately
    setActiveAlert((curr) => (curr?.id === id ? null : curr))
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    const allIds = new Set([...Array.from(readIds), ...notifications.map((n) => n.id)])
    setReadIds(allIds)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(allIds)))
    } catch (e) {
      console.warn('Failed to save read notifications:', e)
    }
    setActiveAlert(null)
  }, [notifications, readIds])

  // 4. Initial fetch and Realtime + Polling subscription
  useEffect(() => {
    loadNotifications(true)

    // Polling fallback every 10 seconds for 100% reliable detection
    const pollInterval = setInterval(() => {
      loadNotifications(false)
    }, 10000)

    // Supabase Realtime channel subscription
    const supabase = createClient()
    const channel = supabase
      .channel('live-request-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'housekeeping_tasks' },
        () => loadNotifications(false)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'maintenance_requests' },
        () => loadNotifications(false)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guest_orders' },
        () => loadNotifications(false)
      )
      .subscribe()

    // Listen to custom DOM events if created locally within the tab
    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) {
        playNotificationChime()
        setActiveAlert(detail)
        loadNotifications(false)
      }
    }
    window.addEventListener('new-service-request', handleCustomEvent)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
      window.removeEventListener('new-service-request', handleCustomEvent)
    }
  }, [loadNotifications])

  // Calculate unread counts
  const unreadNotifications = notifications.filter((n) => !readIds.has(n.id))
  const unreadCount = unreadNotifications.length

  const foodCount = notifications.filter((n) => n.category === 'food' && !readIds.has(n.id)).length
  const hkCount = notifications.filter((n) => n.category === 'housekeeping' && !readIds.has(n.id)).length
  const maintCount = notifications.filter((n) => n.category === 'maintenance' && !readIds.has(n.id)).length

  // Filter list by active tab
  const filteredList = notifications.filter((item) => {
    if (activeTab === 'all') return true
    return item.category === activeTab
  })

  // Category Icon & styling helper
  const getCategoryMeta = (category: RequestNotification['category']) => {
    switch (category) {
      case 'food':
        return {
          label: 'Food Request',
          icon: <UtensilsCrossed className="h-4 w-4 text-[#5e2b9d]" />,
          badgeClass: 'bg-[#f7f2fd] text-[#5e2b9d] border-[#dfcef6]',
          iconBg: 'bg-[#f7f2fd] border-[#dfcef6]',
        }
      case 'housekeeping':
        return {
          label: 'Housekeeping',
          icon: <Sparkles className="h-4 w-4 text-cyan-600" />,
          badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          iconBg: 'bg-cyan-50 border-cyan-200',
        }
      case 'maintenance':
        return {
          label: 'Maintenance',
          icon: <Wrench className="h-4 w-4 text-amber-600" />,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-50 border-amber-200',
        }
    }
  }

  // Trigger test simulation for user verification
  const handleTestChime = () => {
    playNotificationChime()
    const testItem: RequestNotification = {
      id: `test_${Date.now()}`,
      rawId: `${Date.now()}`,
      category: 'food',
      title: 'New In-Room Dining Order',
      roomNumber: '204',
      description: 'Order #ORD-771: 2x Club Sandwich, 1x Fresh Lime Soda',
      status: 'placed',
      createdAt: new Date().toISOString(),
      targetUrl: '/restaurant/food-requests',
    }
    setActiveAlert(testItem)
    setNotifications((prev) => [testItem, ...prev])
  }

  return (
    <>
      {/* ======================================================== */}
      {/* 1. REALTIME ALERT POPUP (NON-DISTURBING MODAL-LIKE ALERT)*/}
      {/* ======================================================== */}
      {activeAlert && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 fade-in-50 duration-300"
        >
          <div className="bg-white rounded-lg border-2 border-[#5e2b9d]/30 shadow-2xl p-4 overflow-hidden relative backdrop-blur-sm">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5e2b9d] via-[#8c4be0] to-amber-500 animate-pulse" />

            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5e2b9d] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#5e2b9d]" />
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#5e2b9d]">
                  New Request Alert!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded-md cursor-pointer transition-colors"
                title="Dismiss Alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2.5 flex items-start gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-md border shrink-0',
                  getCategoryMeta(activeAlert.category).iconBg
                )}
              >
                {getCategoryMeta(activeAlert.category).icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-md',
                      getCategoryMeta(activeAlert.category).badgeClass
                    )}
                  >
                    {getCategoryMeta(activeAlert.category).label}
                  </Badge>

                  {activeAlert.roomNumber && (
                    <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                      Room {activeAlert.roomNumber}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-1">
                  {activeAlert.title}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                  {activeAlert.description}
                </p>

                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(activeAlert.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons: "on clik on ok mark that as read dont show again" */}
            <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  markAsRead(activeAlert.id)
                }}
                className="h-7 text-xs px-3 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer font-medium"
              >
                <Check className="h-3 w-3 mr-1 text-emerald-600" />
                OK (Mark Read)
              </Button>

              <Link
                href={activeAlert.targetUrl}
                onClick={() => {
                  markAsRead(activeAlert.id)
                  setActiveAlert(null)
                }}
              >
                <Button
                  size="sm"
                  className="h-7 text-xs px-3 bg-[#5e2b9d] hover:bg-[#4d2282] text-white rounded-md cursor-pointer font-medium"
                >
                  View Request
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* ======================================================== */}
      {/* 2. HEADER BELL POPOVER TRIGGER & CONTENT                 */}
      {/* ======================================================== */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all focus:outline-none cursor-pointer',
              isOpen && 'bg-gray-100 text-gray-900',
              hasNewAlertAnimation && 'animate-bounce text-[#5e2b9d]'
            )}
            title="Real-time Service Requests & Notifications"
            aria-label="Service Requests and Notifications"
          >
            <Bell className={cn('h-5 w-5', unreadCount > 0 && 'text-gray-700')} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#5e2b9d] text-[10px] font-bold text-white shadow-sm ring-2 ring-white leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[380px] sm:w-[440px] p-0 shadow-2xl rounded-lg border border-gray-200 overflow-hidden bg-white z-50"
        >
          {/* Popover Header */}
          <div className="p-3.5 bg-gray-50/80 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">
                  Service Requests
                </span>
                {unreadCount > 0 ? (
                  <Badge className="bg-[#5e2b9d] text-white text-[10px] px-1.5 py-0 h-4 font-semibold rounded-md">
                    {unreadCount} New
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-gray-500 px-1.5 py-0 h-4 rounded-md">
                    All Read
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#5e2b9d] cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-white"
                  title="Test Notification Sound & Alert"
                >
                  <Volume2 className="h-3 w-3" />
                  <span className="text-[10px]">Test Sound</span>
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#5e2b9d] hover:text-[#4d2282] cursor-pointer transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors cursor-pointer shrink-0',
                  activeTab === 'all'
                    ? 'bg-[#5e2b9d] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                )}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('food')}
                className={cn(
                  'px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1',
                  activeTab === 'food'
                    ? 'bg-[#5e2b9d] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                )}
              >
                <UtensilsCrossed className="h-3 w-3" />
                Food {foodCount > 0 && `(${foodCount})`}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('housekeeping')}
                className={cn(
                  'px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1',
                  activeTab === 'housekeeping'
                    ? 'bg-[#5e2b9d] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                )}
              >
                <Sparkles className="h-3 w-3" />
                Housekeeping {hkCount > 0 && `(${hkCount})`}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('maintenance')}
                className={cn(
                  'px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1',
                  activeTab === 'maintenance'
                    ? 'bg-[#5e2b9d] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                )}
              >
                <Wrench className="h-3 w-3" />
                Maintenance {maintCount > 0 && `(${maintCount})`}
              </button>
            </div>
          </div>

          {/* ====================================================== */}
          {/* 3. NOTIFICATION CARDS LIST (READ / UNREAD COLOR SHADES)*/}
          {/* ====================================================== */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-2 divide-y-0">
            {filteredList.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-500">No requests in this category</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Incoming requests from guests &amp; rooms will appear here in real time.
                </p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isRead = readIds.has(item.id)
                const meta = getCategoryMeta(item.category)

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-md p-3 transition-all relative border',
                      /* Unread card: distinct color shade card */
                      !isRead
                        ? 'bg-[#f8f4fe] border-[#dfcef6] border-l-4 border-l-[#5e2b9d] shadow-2xs hover:bg-[#f3eafd]'
                        : /* Read card: another color shade card */
                          'bg-white border-gray-200 hover:bg-gray-50/80 text-gray-600'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icon */}
                      <div
                        className={cn(
                          'p-2 rounded-md border shrink-0 mt-0.5',
                          !isRead ? meta.iconBg : 'bg-gray-100 border-gray-200'
                        )}
                      >
                        {meta.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                              !isRead
                                ? meta.badgeClass
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            )}
                          >
                            {meta.label}
                          </span>

                          {item.roomNumber && (
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                                !isRead
                                  ? 'bg-purple-100/70 text-[#5e2b9d] border-purple-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              )}
                            >
                              Room {item.roomNumber}
                            </span>
                          )}

                          {!isRead ? (
                            <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold text-[#5e2b9d] bg-[#eee4fa] px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#5e2b9d] animate-pulse" />
                              Unread
                            </span>
                          ) : (
                            <span className="ml-auto text-[9px] font-medium text-gray-400">
                              Read
                            </span>
                          )}
                        </div>

                        <Link
                          href={item.targetUrl}
                          onClick={() => {
                            markAsRead(item.id)
                            setIsOpen(false)
                          }}
                          className="block mt-1 group"
                        >
                          <p
                            className={cn(
                              'text-xs font-semibold leading-snug group-hover:text-[#5e2b9d] transition-colors',
                              !isRead ? 'text-gray-900 font-medium' : 'text-gray-700'
                            )}
                          >
                            {item.title}
                          </p>
                          <p
                            className={cn(
                              'text-[11px] mt-0.5 line-clamp-2 leading-relaxed',
                              !isRead ? 'text-gray-700' : 'text-gray-500'
                            )}
                          >
                            {item.description}
                          </p>
                        </Link>

                        {/* Bottom Row: Time + OK button ("on clik on ok mark that as read dont show again") */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/80">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(item.createdAt)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {!isRead && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(item.id)}
                                className="h-6 text-[10px] px-2 bg-white border-[#dfcef6] text-[#5e2b9d] hover:bg-[#5e2b9d] hover:text-white rounded cursor-pointer font-medium transition-colors"
                                title="Acknowledge and mark as read"
                              >
                                <Check className="h-3 w-3 mr-0.5" />
                                OK
                              </Button>
                            )}

                            <Link
                              href={item.targetUrl}
                              onClick={() => {
                                markAsRead(item.id)
                                setIsOpen(false)
                              }}
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#5e2b9d] hover:underline"
                            >
                              <span>View</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Popover Footer */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-center flex items-center justify-between text-xs">
            <Link
              href="/restaurant/food-requests"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-[#5e2b9d] hover:underline font-medium"
            >
              Food Orders &rarr;
            </Link>
            <Link
              href="/housekeeping"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-[#5e2b9d] hover:underline font-medium"
            >
              Housekeeping &rarr;
            </Link>
            <Link
              href="/maintenance"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-[#5e2b9d] hover:underline font-medium"
            >
              Maintenance &rarr;
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
