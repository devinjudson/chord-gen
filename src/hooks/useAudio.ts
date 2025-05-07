import { useEffect, useRef } from "react"
import { AudioService } from "../audio/audio-service"
import { Chord } from "../types/music"

export const useAudio = () => {
  const audioServiceRef = useRef<AudioService | null>(null)

  useEffect(() => {
    audioServiceRef.current = new AudioService()
    audioServiceRef.current.initialize()

    return () => {
      if (audioServiceRef.current) {
        audioServiceRef.current.cleanup()
      }
    }
  }, [])

  const playChord = (chord: Chord, usingSample: boolean = false) => {
    if (audioServiceRef.current) {
      audioServiceRef.current.playChord(chord, usingSample)
    }
  }

  const setVolume = (value: number) => {
    if (audioServiceRef.current) {
      audioServiceRef.current.setVolume(value)
    }
  }

  return {
    playChord,
    setVolume,
  }
} 