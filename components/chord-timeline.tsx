"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

interface Chord {
  name: string
  numeral: string
  duration: number
}

interface ChordTimelineProps {
  chords: Chord[]
  currentChordIndex?: number
  className?: string
}

export default function ChordTimeline({
  chords,
  currentChordIndex: initialCurrentChordIndex = -1,
  className,
}: ChordTimelineProps) {
  if (!chords.length) return null

  // Calculate total duration
  const totalDuration = chords.reduce((sum, chord) => sum + chord.duration, 0)

  const [currentChordIndex, setCurrentChordIndex] = useState(initialCurrentChordIndex)

  return (
    <div className={cn("w-full h-12 bg-muted rounded-md overflow-hidden", className)}>
      <div className="relative w-full h-full flex">
        {chords.map((chord, index) => {
          // Calculate width percentage based on duration
          const widthPercent = (chord.duration / totalDuration) * 100

          return (
            <div
              key={index}
              className={cn(
                "h-full flex flex-col items-center justify-center border-r border-background transition-colors",
                index === currentChordIndex && "bg-primary/15",
              )}
              style={{ width: `${widthPercent}%` }}
            >
              <span className="text-sm font-medium">{chord.numeral}</span>
              <span className="text-xs text-muted-foreground">{chord.name}</span>
            </div>
          )
        })}

        {/* Playhead indicator */}
        {currentChordIndex >= 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-primary z-10"
            style={{
              left: `${chords
                .slice(0, currentChordIndex)
                .reduce((sum, chord) => sum + (chord.duration / totalDuration) * 100, 0)}%`,
            }}
          />
        )}
      </div>
    </div>
  )
}
