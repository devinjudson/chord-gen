"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Keyboard } from "lucide-react"
import { PianoRoll as PianoRollIcon } from "./lucide-icons" // Renamed to PianoRollIcon
import PianoKeyboard from "./piano-keyboard"
import PianoRoll from "./piano-roll"
import { cn } from "@/lib/utils"

interface ViewSelectorProps {
  highlightedNotes?: number[]
  onNotePlay?: (note: number) => void
  chords: Array<{ notes: number[]; duration: number }>
  melodyNotes?: Array<{ note: number; time: number; duration: number }>
  showMelody?: boolean
  showChords?: boolean
  className?: string
}

export default function ViewSelector({
  highlightedNotes = [],
  onNotePlay,
  chords,
  melodyNotes = [],
  showMelody = true,
  showChords = true,
  className,
}: ViewSelectorProps) {
  const [activeView, setActiveView] = useState<"keyboard" | "pianoroll">("keyboard")

  // Add a console log to debug highlighted notes
  useEffect(() => {
    if (highlightedNotes.length > 0) {
      console.log("ViewSelector received highlighted notes:", highlightedNotes)
    }
  }, [highlightedNotes])

  return (
    <div className={cn("space-y-2", className)}>
      <Tabs
        defaultValue="keyboard"
        onValueChange={(value) => setActiveView(value as "keyboard" | "pianoroll")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-2">
          <TabsTrigger value="keyboard" className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            <span>Keyboard</span>
          </TabsTrigger>
          <TabsTrigger value="pianoroll" className="flex items-center gap-2">
            <PianoRollIcon className="h-4 w-4" />
            <span>Piano Roll</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="keyboard"
          className={cn(
            "transition-all duration-300 ease-in-out",
            activeView === "keyboard" ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden",
          )}
        >
          <div className="rounded-md overflow-hidden h-[120px] sm:h-[150px] md:h-[180px]">
            <PianoKeyboard highlightedNotes={highlightedNotes} onNotePlay={onNotePlay} />
          </div>
        </TabsContent>

        <TabsContent
          value="pianoroll"
          className={cn(
            "transition-all duration-300 ease-in-out",
            activeView === "pianoroll" ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden",
          )}
        >
          <div className="rounded-md overflow-hidden h-[120px] sm:h-[150px] md:h-[180px]">
            <PianoRoll
              chords={chords}
              melodyNotes={melodyNotes}
              showMelody={showMelody}
              showChords={showChords}
              className="h-full"
            />
            <div className="flex justify-end mt-1">
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#3B82F6] rounded-sm mr-1"></div>
                  <span>Chords</span>
                </div>
                {showMelody && melodyNotes.length > 0 && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#38BDF8] rounded-sm mr-1"></div>
                    <span>Melody</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
