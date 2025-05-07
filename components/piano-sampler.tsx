"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Piano } from "lucide-react"
import { cn } from "@/lib/utils"
import * as Tone from "tone"

interface PianoSamplerProps {
  onSamplerLoaded: (sampler: Tone.Sampler, melodySampler: Tone.Sampler) => void
  isAudioInitialized: boolean
  autoLoad?: boolean
}

// Piano sample URLs - using Salamander Grand Piano samples
const PIANO_SAMPLES = {
  A0: "https://tonejs.github.io/audio/salamander/A0.mp3",
  C1: "https://tonejs.github.io/audio/salamander/C1.mp3",
  "D#1": "https://tonejs.github.io/audio/salamander/Ds1.mp3",
  "F#1": "https://tonejs.github.io/audio/salamander/Fs1.mp3",
  A1: "https://tonejs.github.io/audio/salamander/A1.mp3",
  C2: "https://tonejs.github.io/audio/salamander/C2.mp3",
  "D#2": "https://tonejs.github.io/audio/salamander/Ds2.mp3",
  "F#2": "https://tonejs.github.io/audio/salamander/Fs2.mp3",
  A2: "https://tonejs.github.io/audio/salamander/A2.mp3",
  C3: "https://tonejs.github.io/audio/salamander/C3.mp3",
  "D#3": "https://tonejs.github.io/audio/salamander/Ds3.mp3",
  "F#3": "https://tonejs.github.io/audio/salamander/Fs3.mp3",
  A3: "https://tonejs.github.io/audio/salamander/A3.mp3",
  C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
  "D#4": "https://tonejs.github.io/audio/salamander/Ds4.mp3",
  "F#4": "https://tonejs.github.io/audio/salamander/Fs4.mp3",
  A4: "https://tonejs.github.io/audio/salamander/A4.mp3",
  C5: "https://tonejs.github.io/audio/salamander/C5.mp3",
  "D#5": "https://tonejs.github.io/audio/salamander/Ds5.mp3",
  "F#5": "https://tonejs.github.io/audio/salamander/Fs5.mp3",
  A5: "https://tonejs.github.io/audio/salamander/A5.mp3",
  C6: "https://tonejs.github.io/audio/salamander/C6.mp3",
  "D#6": "https://tonejs.github.io/audio/salamander/Ds6.mp3",
  "F#6": "https://tonejs.github.io/audio/salamander/Fs6.mp3",
  A6: "https://tonejs.github.io/audio/salamander/A6.mp3",
  C7: "https://tonejs.github.io/audio/salamander/C7.mp3",
  "D#7": "https://tonejs.github.io/audio/salamander/Ds7.mp3",
  "F#7": "https://tonejs.github.io/audio/salamander/Fs7.mp3",
  A7: "https://tonejs.github.io/audio/salamander/A7.mp3",
  C8: "https://tonejs.github.io/audio/salamander/C8.mp3",
}

export default function PianoSampler({ onSamplerLoaded, isAudioInitialized, autoLoad = false }: PianoSamplerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add useEffect to auto-load piano samples when initialized
  useEffect(() => {
    if (autoLoad && isAudioInitialized && !isLoaded && !isLoading) {
      loadPianoSamples()
    }
  }, [autoLoad, isAudioInitialized, isLoaded, isLoading])

  const loadPianoSamples = async () => {
    if (!isAudioInitialized) {
      setError("Please initialize audio first")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create a reverb effect for the piano
      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0.2,
        preDelay: 0.01,
      }).toDestination()

      // Create the main piano sampler for chords
      const pianoSampler = new Tone.Sampler({
        urls: PIANO_SAMPLES,
        release: 1.5,
        volume: -6,
        onload: () => {
          // Create a second sampler for melody with slightly different settings
          const melodyPianoSampler = new Tone.Sampler({
            urls: PIANO_SAMPLES,
            release: 1.2,
            volume: -3,
            onload: () => {
              // Add a slight EQ to shape the melody tone
              const melodyEq = new Tone.EQ3({
                low: -2,
                mid: 1,
                high: 3, // Slightly brighter for melody notes
              }).toDestination()

              melodyPianoSampler.connect(melodyEq)
              melodyEq.connect(reverb)

              // Notify parent component that both samplers are ready
              onSamplerLoaded(pianoSampler, melodyPianoSampler)
              setIsLoading(false)
              setIsLoaded(true)
            },
          }).toDestination()
        },
      }).toDestination()

      // Connect the piano sampler to the reverb
      pianoSampler.connect(reverb)
    } catch (error) {
      console.error("Error loading piano samples:", error)
      setError("Failed to load piano samples")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Label className="mb-2 block">Piano Sound</Label>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          isLoaded ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-border",
          !isAudioInitialized && "opacity-50 cursor-not-allowed",
        )}
      >
        {isLoaded ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Piano className="h-5 w-5 mr-2 text-primary" />
              <span className="text-sm font-medium">High-Quality Piano Loaded</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Piano className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Load High-Quality Piano Samples</p>
            <p className="text-xs text-muted-foreground mb-2">Salamander Grand Piano (12MB)</p>
            <Button variant="outline" size="sm" onClick={loadPianoSamples} disabled={!isAudioInitialized || isLoading}>
              {isLoading ? "Loading Piano..." : "Load Piano Samples"}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      <p className="text-xs text-muted-foreground mt-2">
        Uses the Salamander Grand Piano samples for realistic piano sound
      </p>
    </div>
  )
}
