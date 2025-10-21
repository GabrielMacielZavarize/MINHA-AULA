"use client"

import { useState, useRef, useCallback } from "react"
import { RefreshCw } from 'lucide-react'
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  className?: string
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)
  const scrollElement = useRef<HTMLDivElement>(null)

  const threshold = 80

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollElement.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - startY.current) * 0.5)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }, [isPulling, isRefreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return

    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  const refreshProgress = Math.min(pullDistance / threshold, 1)
  const showRefreshIndicator = pullDistance > 20 || isRefreshing

  return (
    <div 
      ref={scrollElement}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10",
          showRefreshIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
          transform: `translateY(-${Math.max(0, 60 - pullDistance)}px)`
        }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <RefreshCw 
            className={cn(
              "h-6 w-6 transition-transform duration-200",
              isRefreshing && "animate-spin",
              !isRefreshing && `rotate-${Math.floor(refreshProgress * 360)}deg`
            )}
          />
          <span className="text-sm">
            {isRefreshing 
              ? "Atualizando..." 
              : pullDistance >= threshold 
                ? "Solte para atualizar" 
                : "Puxe para atualizar"
            }
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  )
}
