"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useMount } from "@/hooks/use-mount"
import { cn } from "@/lib/utils"

export default function AboutPage() {
  const isMounted = useMount()

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className={cn("fade-in", isMounted && "show")}>
        <div className="max-w-3xl w-full bg-card rounded-lg shadow-lg p-4 md:p-8 border border-border">
          <h1
            className={cn(
              "text-2xl md:text-3xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400",
            )}
          >
            About ChordGen
          </h1>

          <div className={cn("space-y-4 text-muted-foreground fade-in delay-100", isMounted && "show")}>
            <p>
              ChordGen is an advanced music generation tool that helps musicians, composers, and music enthusiasts
              create beautiful chord progressions and melodies with ease.
            </p>

            <p>
              Built with modern web technologies including Next.js, Tone.js, and React, ChordGen provides a powerful yet
              intuitive interface for music creation.
            </p>

            <h2 className="text-lg md:text-xl font-semibold text-foreground mt-4 md:mt-6 mb-2">Features</h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Generate chord progressions in any key and mode</li>
              <li>Create complementary melodies with adjustable complexity</li>
              <li>Real-time playback with high-quality piano samples</li>
              <li>Visualize your music with interactive piano roll and keyboard</li>
              <li>Export your creations as MIDI files</li>
              <li>Use custom audio samples for unique sounds</li>
            </ul>
          </div>

          <div className={cn("mt-8 flex justify-center fade-in delay-200", isMounted && "show")}>
            <Link href="/">
              <Button>Return to Generator</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
