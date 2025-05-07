"use client"

import { useMount } from "@/hooks/use-mount"
import { cn } from "@/lib/utils"
import ChordProgressionGenerator from "@/components/chord-progression-generator"

export default function ChordGeneratorClient() {
  const isMounted = useMount()

  return (
    <>
      <div className="flex flex-col items-center mb-2">
        <div className="relative">
          <h1
            className={cn(
              "text-3xl md:text-4xl font-bold text-center mb-0 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 fade-in animate-pulse-slow",
              isMounted && "show",
            )}
          >
            ChordGen
          </h1>
          <p
            className={cn("text-sm text-muted-foreground text-center max-w-md fade-in delay-100", isMounted && "show")}
          >
            Create stunning chord progressions and melodies with this powerful music generator
          </p>
        </div>
      </div>
      <div className={cn("fade-in delay-200 w-full px-3 md:px-6", isMounted && "show")}>
        <div className="w-full max-w-6xl mx-auto">
          <ChordProgressionGenerator />
        </div>
      </div>
    </>
  )
}
