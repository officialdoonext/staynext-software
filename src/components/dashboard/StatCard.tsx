import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  change?: number
  changeLabel?: string
  href?: string
  className?: string
  subtitle?: string
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  change,
  changeLabel,
  href,
  className,
  subtitle,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-3.5 sm:p-4 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between group min-h-[96px]',
        href && 'hover:border-indigo-300 hover:shadow-xs cursor-pointer',
        className
      )}
    >
      {/* Top Row: Title + Icon Badge aligned cleanly */}
      <div className="flex items-start justify-between gap-2 w-full">
        <span
          className="text-xs font-medium text-gray-500 leading-tight line-clamp-2 select-none group-hover:text-gray-700 transition-colors"
          title={title}
        >
          {title}
        </span>
        <div
          className={cn(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center shrink-0 border border-black/5 transition-transform group-hover:scale-105',
            iconBg || 'bg-indigo-50'
          )}
        >
          <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', iconColor || 'text-indigo-600')} />
        </div>
      </div>

      {/* Main Value Row: Full Width, never colliding with the icon badge */}
      <div className="mt-2.5 w-full">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 font-mono tabular-nums leading-none">
          {value}
        </div>

        {/* Change or trend indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-[11px] font-medium">
            <span className={cn(change >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
            <span className="text-gray-400 font-normal truncate">
              {changeLabel || 'vs prev'}
            </span>
          </div>
        )}
        {subtitle && (
          <p className="text-[11px] text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg">
        {content}
      </Link>
    )
  }
  return content
}
