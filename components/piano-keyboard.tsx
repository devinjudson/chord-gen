"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface PianoKeyboardProps {
  highlightedNotes?: number[]
  onNotePlay?: (note: number) => void
}

// Piano key data
const KEYS = [
  { note: 60, type: "white", label: "C" },
  { note: 61, type: "black", label: "C#" },
  { note: 62, type: "white", label: "D" },
  { note: 63, type: "black", label: "D#" },
  { note: 64, type: "white", label: "E" },
  { note: 65, type: "white", label: "F" },
  { note: 66, type: "black", label: "F#" },
  { note: 67, type: "white", label: "G" },
  { note: 68, type: "black", label: "G#" },
  { note: 69, type: "white", label: "A" },
  { note: 70, type: "black", label: "A#" },
  { note: 71, type: "white", label: "B" },
  { note: 72, type: "white", label: "C" },
  { note: 73, type: "black", label: "C#" },
  { note: 74, type: "white", label: "D" },
  { note: 75, type: "black", label: "D#" },
  { note: 76, type: "white", label: "E" },
  { note: 77, type: "white", label: "F" },
  { note: 78, type: "black", label: "F#" },
  { note: 79, type: "white", label: "G" },
  { note: 80, type: "black", label: "G#" },
  { note: 81, type: "white", label: "A" },
  { note: 82, type: "black", label: "A#" },
  { note: 83, type: "white", label: "B" },
]

export default function PianoKeyboard({ highlightedNotes = [], onNotePlay }: PianoKeyboardProps) {
  const [activeNotes, setActiveNotes] = useState<number[]>([])
  const isMobile = useMobile()
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter keys based on screen size
  const [visibleKeys, setVisibleKeys] = useState(KEYS)

  // White keys only (for layout)
  const whiteKeys = visibleKeys.filter((key) => key.type === "white")

  // Handle key press
  const handleKeyPress = (note: number) => {
    setActiveNotes((prev) => [...prev, note])
    onNotePlay?.(note)

    // Remove the note after a short delay
    setTimeout(() => {
      setActiveNotes((prev) => prev.filter((n) => n !== note))
    }, 300)
  }

  // Update active notes when highlighted notes change
  useEffect(() => {
    if (highlightedNotes.length > 0) {
      console.log("PianoKeyboard received highlighted notes:", highlightedNotes)
      setActiveNotes(highlightedNotes)
    } else {
      setActiveNotes([])
    }
  }, [highlightedNotes])

  useEffect(() => {
    // Function to adjust visible keys based on screen width
    const adjustVisibleKeys = () => {
      const width = window.innerWidth
      // On very small screens, show more keys (C4 to G4)
      if (width < 480) {
        setVisibleKeys(KEYS.filter((key) => key.note >= 60 && key.note <= 72)) // C4 to C5 (one full octave)
      } else if (width < 768) {
        setVisibleKeys(KEYS.filter((key) => key.note >= 60 && key.note <= 76)) // C4 to E5 (one octave + third)
      } else {
        setVisibleKeys(KEYS) // Two octaves on desktop
      }
    }

    // Initial adjustment
    adjustVisibleKeys()

    // Listen for resize events
    window.addEventListener("resize", adjustVisibleKeys)

    // Cleanup
    return () => {
      window.removeEventListener("resize", adjustVisibleKeys)
    }
  }, [])

  // Calculate black key positions
  const getBlackKeyStyle = (note: number) => {
    // Find the index of this black key in the original KEYS array
    const keyIndex = KEYS.findIndex((k) => k.note === note)

    // Get the previous white key's note
    let prevWhiteKeyNote = null
    for (let i = keyIndex - 1; i >= 0; i--) {
      if (KEYS[i].type === "white") {
        prevWhiteKeyNote = KEYS[i].note
        break
      }
    }

    // Find the index of the previous white key in our filtered whiteKeys array
    const prevWhiteKeyIndex = whiteKeys.findIndex((k) => k.note === prevWhiteKeyNote)

    // Calculate position based on the previous white key
    const whiteKeyWidth = 100 / whiteKeys.length

    // Different offsets for different black keys
    let leftOffset = 0
    if ([61, 66, 73, 78].includes(note)) {
      // C# and F#
      leftOffset = 0.7
    } else {
      // D#, G#, A#
      leftOffset = 0.5
    }

    const leftPosition = (prevWhiteKeyIndex + leftOffset) * whiteKeyWidth

    return {
      left: `${leftPosition}%`,
      width: `${whiteKeyWidth * 0.65}%`,
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-lg border border-border">
      {/* White keys */}
      <div className="flex relative h-full">
        {whiteKeys.map((key) => (
          <div
            key={key.note}
            className={cn(
              "flex-1 bg-white dark:bg-gray-100 border-r border-gray-300 dark:border-gray-600 rounded-b-md",
              "piano-key transition-all duration-200 relative",
              activeNotes.includes(key.note) && "bg-primary/20 dark:bg-primary/30",
            )}
            style={{
              boxShadow: "inset 0 -6px 0 rgba(0, 0, 0, 0.1)",
              transform: activeNotes.includes(key.note) ? "translateY(3px)" : "none",
            }}
            onClick={() => handleKeyPress(key.note)}
          >
            <span className="absolute bottom-1 md:bottom-2 left-0 right-0 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {key.label}
            </span>
          </div>
        ))}
      </div>

      {/* Black keys */}
      {visibleKeys
        .filter((key) => key.type === "black")
        .map((key) => {
          const style = getBlackKeyStyle(key.note)
          return (
            <div
              key={key.note}
              className={cn(
                "absolute top-0 z-10 rounded-b-md",
                "piano-key transition-all duration-200",
                activeNotes.includes(key.note) && "bg-primary dark:bg-primary",
              )}
              style={{
                ...style,
                height: "55%", // Reduced from 60% to make it shorter
                backgroundColor: activeNotes.includes(key.note) ? "" : "#111",
                boxShadow: activeNotes.includes(key.note)
                  ? "inset 0 -1px 0 rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4)"
                  : "inset 0 -3px 0 rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.4)",
                transform: activeNotes.includes(key.note) ? "translateY(2px)" : "none", // Reduced from 3px to 2px
              }}
              onClick={() => handleKeyPress(key.note)}
            />
          )
        })}
    </div>
  )
}
