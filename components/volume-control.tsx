"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import * as Tone from "tone"

export function VolumeControl() {
  const [volume, setVolume] = useState<number>(75) // Default volume at 75%
  const [showSlider, setShowSlider] = useState(false)

  // Apply volume changes to Tone.js master output
  const handleVolumeChange = (value: number) => {
    setVolume(value)

    // Convert percentage to decibels (0-100% to -60-0 dB)
    // -60dB is near silence, 0dB is full volume
    const volumeInDb = value === 0 ? Number.NEGATIVE_INFINITY : -60 + (value / 100) * 60

    // Set the master volume for all Tone.js sounds
    Tone.Destination.volume.value = volumeInDb
  }

  // Initialize volume on component mount
  useEffect(() => {
    if (Tone.context.state === "running") {
      const volumeInDb = volume === 0 ? Number.NEGATIVE_INFINITY : -60 + (volume / 100) * 60
      Tone.Destination.volume.value = volumeInDb
    }
  }, [volume])

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSlider(!showSlider)}
        className="rounded-full w-8 h-8 md:w-10 md:h-10 transition-all hover:bg-accent"
        aria-label="Adjust volume"
      >
        <VolumeIcon volume={volume} />
      </Button>

      {showSlider && (
        <div
          className="absolute right-0 top-10 bg-background border border-border rounded-md p-2 md:p-3 shadow-md z-50 w-36 md:w-48"
          onMouseLeave={() => setShowSlider(false)}
        >
          <div className="flex items-center gap-2">
            <VolumeIcon volume={volume} className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => handleVolumeChange(value[0])}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-7 text-right">{volume}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Dynamic volume icon that changes based on volume level
function VolumeIcon({ volume, className = "h-5 w-5" }: { volume: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      {volume > 0 && (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          {volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
        </>
      )}
    </svg>
  )
}
