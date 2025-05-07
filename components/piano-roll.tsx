"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface Note {
  note: number
  time: number
  duration: number
  type: "chord" | "melody"
}

interface PianoRollProps {
  chords: Array<{ notes: number[]; duration: number }>
  melodyNotes?: Array<{ note: number; time: number; duration: number }>
  totalBars?: number
  showMelody?: boolean
  showChords?: boolean
  className?: string
}

export default function PianoRoll({
  chords,
  melodyNotes = [],
  totalBars = 4,
  showMelody = true,
  showChords = true,
  className,
}: PianoRollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pianoKeysRef = useRef<HTMLDivElement>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [containerWidth, setContainerWidth] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  // Add a new state for note height:
  const [noteHeight, setNoteHeight] = useState(10)

  // Define the range of notes to display (C2 to C6)
  const MIN_NOTE = 48 // C3 (changed from C2/36 to C3/48)
  const MAX_NOTE = 84 // C6
  const TOTAL_NOTES = MAX_NOTE - MIN_NOTE + 1

  // Update the NOTE_HEIGHT constant to use the state value:
  const NOTE_HEIGHT = noteHeight

  // Calculate the grid height
  const GRID_HEIGHT = TOTAL_NOTES * NOTE_HEIGHT

  // Theme-aware colors
  const colors = {
    background: isDarkTheme ? "rgb(17, 24, 39)" : "rgb(243, 244, 246)",
    keysBackground: isDarkTheme ? "rgb(31, 41, 55)" : "rgb(229, 231, 235)",
    gridLine: isDarkTheme ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    measureLine: isDarkTheme ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)",
    whiteKey: isDarkTheme ? "white" : "white",
    blackKey: isDarkTheme ? "black" : "black",
    keyBorder: isDarkTheme ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.2)",
    keyText: isDarkTheme ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.7)",
    chordFill: isDarkTheme ? "#3B82F6" : "#2563EB",
    chordStroke: isDarkTheme ? "#2563EB" : "#1D4ED8",
    melodyFill: isDarkTheme ? "#38BDF8" : "#0EA5E9",
    melodyStroke: isDarkTheme ? "#0EA5E9" : "#0284C7",
  }

  // Process chords and melody notes into a unified format
  useEffect(() => {
    const processedNotes: Note[] = []

    // Process chord notes
    if (showChords) {
      let currentTime = 0
      chords.forEach((chord) => {
        chord.notes.forEach((note) => {
          // Only include notes within our visible range
          if (note >= MIN_NOTE && note <= MAX_NOTE) {
            processedNotes.push({
              note,
              time: currentTime,
              duration: chord.duration * 16, // Convert to 16th notes
              type: "chord",
            })
          }
        })
        currentTime += chord.duration * 16 // Convert to 16th notes
      })
    }

    // Process melody notes
    if (showMelody) {
      melodyNotes.forEach((note) => {
        // Only include notes within our visible range
        if (note.note >= MIN_NOTE && note.note <= MAX_NOTE) {
          processedNotes.push({
            note: note.note,
            time: note.time,
            duration: note.duration,
            type: "melody",
          })
        }
      })
    }

    setNotes(processedNotes)
  }, [chords, melodyNotes, showChords, showMelody])

  // Update container dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        // Calculate key widths based on screen size
        const whiteKeyWidth = containerRef.current?.clientWidth
          ? containerRef.current.clientWidth < 480
            ? 20
            : containerRef.current.clientWidth < 768
              ? 25
              : 30
          : 30
        const blackKeyWidth = whiteKeyWidth * 0.65

        // Get the width of the container minus the piano keys width
        setContainerWidth(containerRef.current.clientWidth - whiteKeyWidth)
        // Adjust note height based on screen width
        const width = window.innerWidth
        if (width < 480) {
          // Smaller note height on very small screens
          setNoteHeight(4) // Reduced from 6 to 4
        } else if (width < 768) {
          // Medium note height on tablets
          setNoteHeight(6) // Reduced from 8 to 6
        } else {
          // Default note height on desktop
          setNoteHeight(8) // Reduced from 10 to 8
        }
      }
    }

    updateDimensions()

    // Create a ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [])

  // Sync scroll position between grid and piano keys
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current && pianoKeysRef.current) {
        const scrollPosition = scrollContainerRef.current.scrollTop
        setScrollTop(scrollPosition)
        pianoKeysRef.current.scrollTop = scrollPosition
      }
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  // Calculate the total duration in 16th notes
  const totalDuration = totalBars * 16

  // Generate grid lines for measures and beats
  const renderGridLines = () => {
    const lines = []

    // Measure lines (every 16 sixteenth notes)
    for (let i = 0; i <= totalBars; i++) {
      const position = (i * 16 * containerWidth) / totalDuration
      lines.push(
        <line
          key={`measure-${i}`}
          x1={position}
          y1={0}
          x2={position}
          y2={GRID_HEIGHT}
          stroke={colors.measureLine}
          strokeWidth={i % 4 === 0 ? 2 : 1}
        />,
      )
    }

    // Beat lines (every 4 sixteenth notes)
    for (let i = 1; i < totalBars * 4; i++) {
      if (i % 4 !== 0) {
        // Skip measure lines
        const position = (i * 4 * containerWidth) / totalDuration
        lines.push(
          <line
            key={`beat-${i}`}
            x1={position}
            y1={0}
            x2={position}
            y2={GRID_HEIGHT}
            stroke={colors.gridLine}
            strokeWidth={1}
          />,
        )
      }
    }

    // Horizontal lines for each note
    for (let i = 0; i <= TOTAL_NOTES; i++) {
      const position = i * NOTE_HEIGHT
      lines.push(
        <line
          key={`note-${i}`}
          x1={0}
          y1={position}
          x2={containerWidth}
          y2={position}
          stroke={colors.gridLine}
          strokeWidth={1}
        />,
      )
    }

    return lines
  }

  // Render piano keys on the left
  const renderPianoKeys = () => {
    const keys = []
    // Calculate key widths based on screen size
    const whiteKeyWidth = containerRef.current?.clientWidth
      ? containerRef.current.clientWidth < 480
        ? 20
        : containerRef.current.clientWidth < 768
          ? 25
          : 30
      : 30
    const blackKeyWidth = whiteKeyWidth * 0.65

    // Create an array to map MIDI note numbers to their positions in the piano roll
    const notePositions = {}
    for (let i = 0; i < TOTAL_NOTES; i++) {
      const note = MAX_NOTE - i
      notePositions[note] = i * NOTE_HEIGHT
    }

    // First render white keys as the background
    for (let note = MIN_NOTE; note <= MAX_NOTE; note++) {
      const isWhiteKey = ![1, 3, 6, 8, 10].includes(note % 12)
      if (isWhiteKey) {
        const y = notePositions[note]
        keys.push(
          <rect
            key={`white-key-${note}`}
            x={0}
            y={y}
            width={whiteKeyWidth}
            height={NOTE_HEIGHT}
            fill={colors.whiteKey}
            stroke={colors.keyBorder}
            strokeWidth={1}
          />,
        )

        // Add note name for C notes
        if (note % 12 === 0) {
          const octave = Math.floor(note / 12) - 1 // Subtract 1 to get the correct octave
          keys.push(
            <text key={`text-${note}`} x={5} y={y + NOTE_HEIGHT - 1} fontSize={6} fill={colors.keyText}>
              C{octave}
            </text>,
          )
        }
      }
    }

    // Then render black keys on top
    for (let note = MIN_NOTE; note <= MAX_NOTE; note++) {
      const isBlackKey = [1, 3, 6, 8, 10].includes(note % 12)
      if (isBlackKey) {
        const y = notePositions[note]
        keys.push(
          <rect
            key={`black-key-${note}`}
            x={0}
            y={y}
            width={blackKeyWidth}
            height={NOTE_HEIGHT}
            fill={colors.blackKey}
            stroke={colors.keyBorder}
            strokeWidth={1}
          />,
        )
      }
    }

    return keys
  }

  // Render the notes
  const renderNotes = () => {
    return notes.map((note, index) => {
      const x = (note.time * containerWidth) / totalDuration
      const width = Math.max((note.duration * containerWidth) / totalDuration, 4) // Ensure minimum width
      const y = (MAX_NOTE - note.note) * NOTE_HEIGHT

      return (
        <rect
          key={`note-${index}`}
          x={x}
          y={y}
          width={width}
          height={NOTE_HEIGHT - 1}
          rx={1.5}
          ry={1.5}
          fill={note.type === "chord" ? colors.chordFill : colors.melodyFill}
          stroke={note.type === "chord" ? colors.chordStroke : colors.melodyStroke}
          strokeWidth={0.5}
          opacity={0.8}
        />
      )
    })
  }

  // Calculate key widths based on screen size
  const whiteKeyWidth = containerRef.current?.clientWidth
    ? containerRef.current.clientWidth < 480
      ? 20
      : containerRef.current.clientWidth < 768
        ? 25
        : 30
    : 30

  const blackKeyWidth = whiteKeyWidth * 0.65

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full rounded-md overflow-hidden", className)}
      style={{ backgroundColor: colors.background }}
    >
      <div className="absolute inset-0 flex">
        {/* Piano keys column - now in a scrollable container */}
        <div
          ref={pianoKeysRef}
          className="h-full shadow-md overflow-hidden"
          style={{
            backgroundColor: colors.keysBackground,
            width: `${whiteKeyWidth}px`,
          }}
        >
          <div style={{ height: GRID_HEIGHT }}>
            <svg width={whiteKeyWidth} height={GRID_HEIGHT}>
              {renderPianoKeys()}
            </svg>
          </div>
        </div>

        {/* Grid and notes area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div style={{ height: GRID_HEIGHT }}>
            <svg width={containerWidth} height={GRID_HEIGHT}>
              {renderGridLines()}
              {renderNotes()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
