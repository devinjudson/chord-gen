"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Download, Play, Pause, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import SampleLoader from "./sample-loader"
import * as Tone from "tone"
import { createMIDIFile, downloadBlob } from "@/lib/midi-utils"
import { useMount } from "@/hooks/use-mount"
import PianoKeyboard from "./piano-keyboard"
import PianoRoll from "./piano-roll"
import { useAudio } from "../src/hooks/useAudio"

// Music theory data
const KEYS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"]
const MODES = ["major", "minor"]

// Roman numeral representation for chords
const MAJOR_NUMERALS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
const MINOR_NUMERALS = ["i", "ii°", "III", "iv", "v", "VI", "VII"]

// Common chord progressions
const COMMON_PROGRESSIONS = {
  major: [
    { name: "I-IV-V-I (Classic)", progression: [0, 3, 4, 0] },
    { name: "I-V-vi-IV (Pop)", progression: [0, 4, 5, 3] },
    { name: "ii-V-I (Jazz)", progression: [1, 4, 0] },
    { name: "I-vi-IV-V (50s)", progression: [0, 5, 3, 4] },
    { name: "I-IV-vi-V (Hopeful)", progression: [0, 3, 5, 4] },
  ],
  minor: [
    { name: "i-iv-v-i (Classic)", progression: [0, 3, 4, 0] },
    { name: "i-VI-III-VII (Epic)", progression: [0, 5, 2, 6] },
    { name: "i-iv-VII-III (Emotional)", progression: [0, 3, 6, 2] },
    { name: "i-VII-VI-VII (Rock)", progression: [0, 6, 5, 6] },
    { name: "i-v-VI-VII (Andalusian)", progression: [0, 4, 5, 6] },
  ],
}

// Chord types
const CHORD_TYPES = [
  { id: "triad", label: "Triads", intervals: [0, 4, 7] },
  { id: "seventh", label: "7th Chords", intervals: [0, 4, 7, 10] },
  { id: "major7", label: "Major 7th", intervals: [0, 4, 7, 11] },
  { id: "minor7", label: "Minor 7th", intervals: [0, 3, 7, 10] },
  { id: "sus4", label: "Sus4", intervals: [0, 5, 7] },
  { id: "add9", label: "Add9", intervals: [0, 4, 7, 14] },
]

// Melody rhythm patterns (in 16th notes, 16 = 1 measure)
const RHYTHM_PATTERNS = [
  { id: "varied", label: "Varied", pattern: [2, 2, 4, 2, 2, 4] },
  { id: "conjunct", label: "Conjunct (Stepwise)", pattern: [] },
  { id: "arpeggiation", label: "Arpeggiation", pattern: [] },
]

// Enhanced arpeggiation patterns
const ARPEGGIO_PATTERNS = [
  { id: "none", label: "No Arpeggiation" },
  { id: "ascending", label: "Ascending" },
  { id: "descending", label: "Descending" },
  { id: "ascending-descending", label: "Ascending-Descending" },
  { id: "descending-ascending", label: "Descending-Ascending" },
  { id: "inside-out", label: "Inside-Out" },
  { id: "outside-in", label: "Outside-In" },
  { id: "random", label: "Random" },
]

// Quantization options for melody notes
const QUANTIZE_OPTIONS = [
  { id: "quarter", label: "Quarter Notes", value: 4 },
  { id: "eighth", label: "Eighth Notes", value: 2 },
  { id: "sixteenth", label: "Sixteenth Notes", value: 1 },
]

// Note to frequency mapping (for one octave)
const NOTE_TO_MIDI: Record<string, number> = {
  C: 60,
  "C#": 61,
  Db: 61,
  D: 62,
  "D#": 63,
  Eb: 63,
  E: 64,
  F: 65,
  "F#": 66,
  Gb: 66,
  G: 67,
  "G#": 68,
  Ab: 68,
  A: 69,
  "A#": 70,
  Bb: 70,
  B: 71,
}

// Update the Chord interface to include duration
interface Chord {
  name: string
  numeral: string
  notes: number[]
  rootNote: number
  duration: number // Duration in bars (1 = full bar, 0.5 = half bar, etc.)
}

interface MelodyNote {
  note: number
  duration: number
  time: number
}

export default function ChordProgressionGenerator() {
  const isMounted = useMount()
  const [key, setKey] = useState("C")
  const [mode, setMode] = useState<"major" | "minor">("major")
  const [numChords, setNumChords] = useState(4)
  const [progression, setProgression] = useState<Chord[]>([])
  const [selectedChordTypes, setSelectedChordTypes] = useState<string[]>(["triad"])
  const [currentChord, setCurrentChord] = useState<Chord | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [melodyEnabled, setMelodyEnabled] = useState(false)
  const [melodyNotes, setMelodyNotes] = useState<MelodyNote[]>([])
  const [melodyComplexity, setMelodyComplexity] = useState(50)
  const [rhythmPattern, setRhythmPattern] = useState<string>("varied")
  const [currentMelodyNote, setCurrentMelodyNote] = useState<number | null>(null)
  const [playbackMode, setPlaybackMode] = useState<"both" | "chords" | "melody">("both")
  const [bpm, setBpm] = useState(120)
  const [usingSample, setUsingSample] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(false)
  const [sampleReady, setSampleReady] = useState(false)
  const [sampleError, setSampleError] = useState<string | null>(null)
  const [arpeggioPattern, setArpeggioPattern] = useState<string>("ascending")
  const [quantizeValue, setQuantizeValue] = useState<string>("eighth")
  const [currentChordIndex, setCurrentChordIndex] = useState<number>(-1)
  // Fixed values since UI controls were removed
  const [arpeggioOctaveRange] = useState<number>(2) // Default to 2 octaves for better range
  const [normalizeArpeggio] = useState<boolean>(true) // Always normalize chord notes
  const [usingPianoSampler, setUsingPianoSampler] = useState(false)
  const [volume, setVolumeState] = useState(75)
  const [isLooping, setIsLooping] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeView, setActiveView] = useState<"keyboard" | "pianoroll">("keyboard")
  const [debugPlaybackInfo, setDebugPlaybackInfo] = useState<string>("")

  const synth = useRef<Tone.PolySynth | null>(null)
  const melodySynth = useRef<Tone.Synth | null>(null)
  const sampler = useRef<Tone.Sampler | null>(null)
  const melodySampler = useRef<Tone.Sampler | null>(null)
  const progressionPlayer = useRef<any>(null)
  const scheduledEvents = useRef<number[]>([])

  const { playChord, setVolume } = useAudio()

  // Initialize audio
  const initializeAudio = () => {
    if (Tone.context.state !== "running") {
      Tone.start()
    }

    if (!synth.current) {
      synth.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "triangle8",
        },
        envelope: {
          attack: 0.002,
          decay: 1.2,
          sustain: 0.3,
          release: 1.8,
        },
        volume: -6,
      }).toDestination()

      // Add a compressor for more dynamic control
      const compressor = new Tone.Compressor({
        threshold: -20,
        ratio: 4,
        attack: 0.003,
        release: 0.25,
      }).toDestination()

      // Add a better reverb for more realistic space
      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0.2,
        preDelay: 0.01,
      }).toDestination()

      // Add a slight EQ to shape the tone
      const eq = new Tone.EQ3({
        low: -3,
        mid: 0,
        high: 2,
      }).toDestination()

      // Connect the signal chain
      synth.current.connect(compressor)
      compressor.connect(eq)
      eq.connect(reverb)
    }

    if (!melodySynth.current) {
      melodySynth.current = new Tone.Synth({
        oscillator: {
          type: "triangle8",
        },
        envelope: {
          attack: 0.001,
          decay: 1.0,
          sustain: 0.2,
          release: 1.4,
        },
        volume: -2,
      }).toDestination()

      // Add a subtle reverb for more depth
      const melodyReverb = new Tone.Reverb({
        decay: 1.2,
        wet: 0.15,
        preDelay: 0.01,
      }).toDestination()

      // Add a slight EQ to shape the tone
      const melodyEq = new Tone.EQ3({
        low: -2,
        mid: 1,
        high: 3, // Slightly brighter for melody notes
      }).toDestination()

      melodySynth.current.connect(melodyEq)
      melodyEq.connect(melodyReverb)
    }

    // Set initial volume
    const initialVolumeInDb = volume === 0 ? Number.NEGATIVE_INFINITY : -60 + (volume / 100) * 60
    synth.current.volume.value = initialVolumeInDb
    melodySynth.current.volume.value = initialVolumeInDb

    // Auto-load piano samples
    setTimeout(() => {
      loadPianoSamples()
    }, 500)

    setAudioInitialized(true)
  }

  // Handle sample loading
  const handleSampleLoaded = (audioBuffer: AudioBuffer) => {
    setSampleLoading(true)
    setSampleReady(false)
    setSampleError(null)

    try {
      // Create a base note for the sampler (C4 = MIDI note 60)
      const baseNote = "C4"

      // Dispose of existing samplers if they exist
      if (sampler.current) {
        sampler.current.dispose()
      }

      if (melodySampler.current) {
        melodySampler.current.dispose()
      }

      // Create a mapping of notes to the same buffer
      // This ensures all notes will play the sample at different pitches
      const noteMapping: Record<string, AudioBuffer> = {}

      // Map the sample to multiple octaves to ensure coverage
      for (let octave = 1; octave <= 7; octave++) {
        noteMapping[`C${octave}`] = audioBuffer
      }

      // Create a sampler for chords with longer release time
      sampler.current = new Tone.Sampler({
        urls: noteMapping,
        release: 1.5, // Add a longer release time to let samples fade out naturally
        attack: 0.01, // Quick attack for responsive playback
        onload: () => {
          // Create a sampler for melody with longer release time
          melodySampler.current = new Tone.Sampler({
            urls: noteMapping,
            release: 1.0, // Slightly shorter release for melody notes
            attack: 0.005, // Very quick attack for melody
            onload: () => {
              // Apply current volume setting
              const volumeInDb = volume === 0 ? Number.NEGATIVE_INFINITY : -60 + (volume / 100) * 60
              sampler.current!.volume.value = volumeInDb
              melodySampler.current!.volume.value = volumeInDb

              setSampleLoading(false)
              setSampleReady(true)
              setUsingSample(true)
            },
          }).toDestination()
          melodySampler.current.volume.value = 0
        },
      }).toDestination()
      sampler.current.volume.value = -3
    } catch (error) {
      console.error("Error creating samplers:", error)
      setSampleLoading(false)
      setSampleError("Failed to load sample")
      setUsingSample(false)
    }
  }

  // Handle piano sampler loading
  const handlePianoSamplerLoaded = (pianoSampler: Tone.Sampler, melodyPianoSampler: Tone.Sampler) => {
    // Dispose of existing samplers if they exist
    if (sampler.current) {
      sampler.current.dispose()
    }

    if (melodySampler.current) {
      melodySampler.current.dispose()
    }

    // Set the new samplers
    sampler.current = pianoSampler
    melodySampler.current = melodyPianoSampler

    // Apply current volume setting
    const volumeInDb = volume === 0 ? Number.NEGATIVE_INFINITY : -60 + (volume / 100) * 60
    pianoSampler.volume.value = volumeInDb
    melodyPianoSampler.volume.value = volumeInDb

    // Update state
    setSampleReady(true)
    setUsingSample(true)
    setUsingPianoSampler(true)
  }

  // Load piano samples
  const loadPianoSamples = async () => {
    if (!audioInitialized) return

    try {
      // Create a reverb effect for the piano
      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0.2,
        preDelay: 0.01,
      }).toDestination()

      // Create the main piano sampler for chords
      const pianoSampler = new Tone.Sampler({
        urls: {
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
        },
        release: 1.5,
        volume: -6,
        onload: () => {
          // Create a second sampler for melody with slightly different settings
          const melodyPianoSampler = new Tone.Sampler({
            urls: {
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
            },
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

              // Apply current volume setting
              const volumeInDb = volume === 0 ? Number.NEGATIVE_INFINITY : -60 + (volume / 100) * 60
              pianoSampler.volume.value = volumeInDb
              melodyPianoSampler.volume.value = volumeInDb

              // Notify that both samplers are ready
              handlePianoSamplerLoaded(pianoSampler, melodyPianoSampler)
            },
          }).toDestination()
        },
      }).toDestination()

      // Connect the piano sampler to the reverb
      pianoSampler.connect(reverb)
    } catch (error) {
      console.error("Error loading piano samples:", error)
    }
  }

  // Generate scale degrees based on key and mode
  const generateScaleDegrees = (rootKey: string, scaleMode: "major" | "minor") => {
    const chromaticScale = [...KEYS, ...KEYS] // Repeat to handle wrapping
    const rootIndex = KEYS.indexOf(rootKey)

    // Intervals for major and minor scales (whole and half steps)
    const majorIntervals = [0, 2, 4, 5, 7, 9, 11]
    const minorIntervals = [0, 2, 3, 5, 7, 8, 10]

    const intervals = scaleMode === "major" ? majorIntervals : minorIntervals

    return intervals.map((interval) => {
      const noteIndex = (rootIndex + interval) % 12
      return KEYS[noteIndex]
    })
  }

  // Generate all scale notes across multiple octaves
  const generateScaleNotes = (rootKey: string, scaleMode: "major" | "minor", octaves = 2): number[] => {
    const scaleDegrees = generateScaleDegrees(rootKey, scaleMode)
    const rootMidi = getNoteValue(rootKey)
    const scaleNotes: number[] = []

    // Generate notes for each octave
    for (let octave = 0; octave < octaves; octave++) {
      const octaveOffset = octave * 12
      const majorIntervals = [0, 2, 4, 5, 7, 9, 11]
      const minorIntervals = [0, 2, 3, 5, 7, 8, 10]
      const intervals = scaleMode === "major" ? majorIntervals : minorIntervals

      intervals.forEach((interval) => {
        scaleNotes.push(rootMidi + interval + octaveOffset)
      })
    }

    return scaleNotes
  }

  // Update the generateChord function to include duration (default to 1 bar)
  const generateChord = (scaleDegrees: string[], degree: number, chordType: string): Chord => {
    const rootNote = scaleDegrees[degree % scaleDegrees.length]
    const rootMidi = getNoteValue(rootNote)

    // Get the chord intervals based on chord type
    const chordTypeObj = CHORD_TYPES.find((type) => type.id === chordType)
    const intervals = chordTypeObj ? chordTypeObj.intervals : [0, 4, 7] // Default to triad

    // Calculate chord notes
    const notes = intervals.map((interval) => rootMidi + interval)

    // Get the numeral representation
    const numerals = mode === "major" ? MAJOR_NUMERALS : MINOR_NUMERALS
    const numeral = numerals[degree % numerals.length]

    return {
      name: `${rootNote}${getChordSuffix(degree, mode, chordType)}`,
      numeral,
      notes,
      rootNote: rootMidi,
      duration: 1, // Default duration, will be overridden in generateRandomProgression
    }
  }

  // Get chord suffix based on degree and mode
  const getChordSuffix = (degree: number, mode: "major" | "minor", chordType: string) => {
    // Basic suffix based on chord type
    let suffix = ""

    if (chordType === "seventh") suffix = "7"
    else if (chordType === "major7") suffix = "maj7"
    else if (chordType === "minor7") suffix = "m7"
    else if (chordType === "sus4") suffix = "sus4"
    else if (chordType === "add9") suffix = "add9"

    // Adjust for major/minor based on scale degree
    if (mode === "major") {
      // In major: 1, 4, 5 are major; 2, 3, 6 are minor; 7 is diminished
      if ([1, 2, 5].includes(degree) && !suffix.includes("m") && chordType === "triad") {
        suffix = "m" + suffix
      }
    } else {
      // In minor: 3, 6, 7 are major; 1, 4, 5 are minor; 2 is diminished
      if ([0, 3, 4].includes(degree) && !suffix.includes("m") && chordType === "triad") {
        suffix = "m" + suffix
      }
    }

    return suffix
  }

  // Get MIDI note value from note name
  const getNoteValue = (note: string): number => {
    // Handle notes with sharps/flats
    if (note.includes("/")) {
      const [sharp, flat] = note.split("/")
      return NOTE_TO_MIDI[sharp]
    }
    return NOTE_TO_MIDI[note]
  }

  // Convert MIDI note numbers to note names
  const getMidiNoteName = (midiNote: number): string => {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = Math.floor(midiNote / 12) - 1
    const noteName = noteNames[midiNote % 12]
    return `${noteName}${octave}`
  }

  // Add a new function to calculate chord durations
  const calculateChordDurations = (numChords: number): number[] => {
    // All progressions must total exactly 4 bars
    switch (numChords) {
      case 2:
        // For 2-chord progressions: [2, 2] bar structure
        return [2, 2]

      case 3:
        // For 3-chord progressions: [2, 1, 1] or [1, 1, 2] bar structure
        // Randomly choose between the two patterns
        if (Math.random() < 0.5) {
          return [2, 1, 1] // Pattern 1: 2-bar chord followed by two 1-bar chords
        } else {
          return [1, 1, 2] // Pattern 2: Two 1-bar chords followed by a 2-bar chord
        }

      case 4:
        // For 4-chord progressions: [1, 1, 1, 1] bar structure
        return [1, 1, 1, 1]

      default:
        // Fallback for any other number of chords (should not happen with UI constraints)
        console.warn(`Unexpected number of chords: ${numChords}. Using default distribution.`)
        const barPerChord = 4 / numChords
        return Array(numChords).fill(barPerChord)
    }
  }

  // Modify the generateRandomProgression function to distribute chord durations
  const generateRandomProgression = () => {
    // Stop any ongoing playback first
    if (isPlaying) {
      stopPlaying()
    }

    if (!audioInitialized) {
      initializeAudio()
    }

    const scaleDegrees = generateScaleDegrees(key, mode)
    const chords: Chord[] = []

    // Get a random progression template from common progressions
    const progressionTemplates = COMMON_PROGRESSIONS[mode]

    // Filter templates that have at least numChords chords, or use all templates if none have enough
    const eligibleTemplates = progressionTemplates.filter((template) => template.progression.length >= numChords)
    const templatesPool = eligibleTemplates.length > 0 ? eligibleTemplates : progressionTemplates

    const randomTemplate = templatesPool[Math.floor(Math.random() * templatesPool.length)]

    // Use the template to generate chords, but respect the numChords setting
    let degrees = [...randomTemplate.progression]

    // If the template doesn't have enough chords, extend it by repeating from the beginning
    while (degrees.length < numChords) {
      degrees = [...degrees, ...randomTemplate.progression]
    }

    // Now slice to get exactly numChords
    degrees = degrees.slice(0, numChords)

    // Calculate chord durations according to the specified patterns
    const chordDurations = calculateChordDurations(numChords)
    console.log(`Generated chord durations: [${chordDurations.join(", ")}] for ${numChords} chords`)

    // Verify the total duration is exactly 4 bars
    const totalDuration = chordDurations.reduce((sum, duration) => sum + duration, 0)
    if (Math.abs(totalDuration - 4) > 0.001) {
      console.warn(`Total chord duration (${totalDuration}) does not equal 4 bars. Adjusting...`)
      // Normalize durations to ensure total is exactly 4 bars
      const normalizationFactor = 4 / totalDuration
      for (let i = 0; i < chordDurations.length; i++) {
        chordDurations[i] *= normalizationFactor
      }
    }

    // Ensure we're generating exactly the requested number of chords
    for (let i = 0; i < numChords; i++) {
      const degree = degrees[i % degrees.length]
      // Randomly select one of the enabled chord types
      const randomChordType = selectedChordTypes[Math.floor(Math.random() * selectedChordTypes.length)]
      const chord = generateChord(scaleDegrees, degree, randomChordType)

      // Assign the duration from our calculated durations
      chord.duration = chordDurations[i]

      chords.push(chord)
    }

    console.log(`Generated ${chords.length} chords, requested ${numChords}`)
    setProgression(chords)
    setCurrentChord(null)
    setCurrentChordIndex(-1)

    // Generate melody if enabled
    if (melodyEnabled) {
      // If using arpeggiation rhythm but no pattern is selected, set a default

      if (rhythmPattern === "arpeggiation" && arpeggioPattern === "none") {
        setArpeggioPattern("ascending")
      }
      generateMelody(chords)
    } else {
      setMelodyNotes([])
    }
  }

  // Function to normalize chord notes to a consistent count (4 notes)
  const normalizeChordNotesForArpeggio = (chord: Chord, scaleNotes: number[]): number[] => {
    const baseChordNotes = [...chord.notes]

    // If we already have 4 or more notes, just return the first 4
    if (baseChordNotes.length >= 4) {
      return baseChordNotes.slice(0, 4)
    }

    // We need to add notes to reach 4 total
    const notesToAdd = 4 - baseChordNotes.length
    const result = [...baseChordNotes]

    // Get the chord type (major or minor) based on the chord name
    const isMinor = chord.name.includes("m") && !chord.name.includes("maj")

    // Get the root note of the chord
    const rootNote = chord.rootNote

    // Potential extensions to add based on chord type
    const extensions: number[] = []

    if (isMinor) {
      // For minor chords: add 9th, 11th, or 6th
      extensions.push(
        rootNote + 14, // 9th (2nd + octave)
        rootNote + 17, // 11th (4th + octave)
        rootNote + 9, // 6th
      )
    } else {
      // For major chords: add 9th, 6th, or maj7
      extensions.push(
        rootNote + 14, // 9th (2nd + octave)
        rootNote + 9, // 6th
        rootNote + 11, // maj7
      )
    }

    // Filter extensions to only include notes that are in the scale
    const validExtensions = extensions.filter((note) => {
      const noteInScale = scaleNotes.some((scaleNote) => scaleNote % 12 === note % 12)
      return noteInScale
    })

    // If we have valid extensions, use them
    if (validExtensions.length > 0) {
      // Sort by priority (we want to add the most harmonically pleasing notes first)
      validExtensions.sort((a, b) => {
        // Prioritize 9ths and 6ths over other extensions
        const aValue = a === rootNote + 14 || a === rootNote + 9 ? 0 : 1
        const bValue = b === rootNote + 14 || b === rootNote + 9 ? 0 : 1
        return aValue - bValue
      })

      // Add extensions until we reach 4 notes
      for (let i = 0; i < notesToAdd && i < validExtensions.length; i++) {
        result.push(validExtensions[i])
      }
    }

    // If we still don't have enough notes, duplicate existing notes in higher octaves
    while (result.length < 4) {
      // Add the root note an octave higher
      result.push(rootNote + 12)
    }

    return result
  }

  // Generate arpeggiated notes based on pattern
  const generateArpeggiatedNotes = (
    chord: Chord,
    startTime: number,
    endTime: number,
    quantizeValue: number,
    scaleNotes: number[],
  ): MelodyNote[] => {
    const notes: MelodyNote[] = []

    // Get the base chord notes
    let baseChordNotes = [...chord.notes]

    // If normalize is enabled, ensure we have a consistent number of notes (4)
    if (normalizeArpeggio) {
      baseChordNotes = normalizeChordNotesForArpeggio(chord, scaleNotes)
    }

    // Create an expanded set of notes for the pattern
    let expandedChordNotes: number[] = []

    // Add notes from lower and higher octaves based on the octave range
    // But limit to a reasonable range to avoid continuously rising notes
    for (let octave = 0; octave < arpeggioOctaveRange; octave++) {
      baseChordNotes.forEach((note) => {
        expandedChordNotes.push(note + octave * 12)
      })
    }

    // Sort the expanded notes
    expandedChordNotes.sort((a, b) => a - b)

    // Filter out notes that are too low or too high
    expandedChordNotes = expandedChordNotes.filter((note) => note >= 36 && note <= 84)

    // Find the highest and lowest chord notes to use as reference points
    const highestChordNote = Math.max(...chord.notes)
    const lowestChordNote = Math.min(...chord.notes)

    // Further constrain the range for arpeggios to avoid notes that are too high
    expandedChordNotes = expandedChordNotes.filter(
      (note) => note <= highestChordNote + 12 && note >= lowestChordNote - 7,
    )

    // Calculate how many notes we can fit
    const totalDuration = endTime - startTime
    const notesCount = Math.floor(totalDuration / quantizeValue)

    if (notesCount <= 0) return notes

    // Calculate how many notes should be in one pattern cycle
    // For quarter notes (quantizeValue = 4), we want exactly 4 notes per bar
    // For eighth notes (quantizeValue = 2), we want 8 notes per bar
    // For sixteenth notes (quantizeValue = 1), we want 16 notes per bar
    const notesPerBar = 16 / quantizeValue // How many notes fit in one bar
    const notesPerCycle = quantizeValue === 4 ? 4 : quantizeValue === 1 ? 4 : Math.ceil(notesPerBar / 2)

    // Ensure we have enough notes for the pattern
    // If we don't have enough notes in expandedChordNotes, repeat them
    while (expandedChordNotes.length < notesPerCycle) {
      expandedChordNotes = [...expandedChordNotes, ...expandedChordNotes.map((note) => note + 12)]
    }

    // Generate the arpeggiated pattern
    switch (arpeggioPattern) {
      case "ascending": {
        // Create a repeating ascending pattern
        // For sixteenth notes, we use exactly 4 notes and repeat them 4 times per bar
        const patternNotes = expandedChordNotes.slice(0, notesPerCycle)

        for (let i = 0; i < notesCount; i++) {
          const noteIndex = i % patternNotes.length
          notes.push({
            note: patternNotes[noteIndex],
            duration: quantizeValue,
            time: startTime + i * quantizeValue,
          })
        }
        break
      }

      case "descending": {
        // Create a repeating descending pattern
        // For sixteenth notes, we use exactly 4 notes and repeat them 4 times per bar
        const patternNotes = [...expandedChordNotes].reverse().slice(0, notesPerCycle)

        for (let i = 0; i < notesCount; i++) {
          const noteIndex = i % patternNotes.length
          notes.push({
            note: patternNotes[noteIndex],
            duration: quantizeValue,
            time: startTime + i * quantizeValue,
          })
        }
        break
      }

      case "ascending-descending": {
        // For quarter notes, use a simpler pattern to ensure 4 notes per bar
        if (quantizeValue === 4) {
          // Use the first 4 notes of the expanded chord notes
          const upNotes = expandedChordNotes.slice(0, 4)

          for (let i = 0; i < notesCount; i++) {
            const noteIndex = i % upNotes.length
            notes.push({
              note: upNotes[noteIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        } else {
          // For eighth and sixteenth notes, use the more complex pattern
          const upNotes = expandedChordNotes.slice(0, Math.min(expandedChordNotes.length, Math.ceil(notesPerCycle / 2)))
          const downNotes = [...upNotes].slice(1, -1).reverse() // Exclude first and last to avoid repetition
          const patternNotes = [...upNotes, ...downNotes]

          for (let i = 0; i < notesCount; i++) {
            const noteIndex = i % patternNotes.length
            notes.push({
              note: patternNotes[noteIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        }
        break
      }

      case "descending-ascending": {
        // For quarter notes, use a simpler pattern to ensure 4 notes per bar
        if (quantizeValue === 4) {
          // Use the first 4 notes of the expanded chord notes in reverse
          const downNotes = [...expandedChordNotes].reverse().slice(0, 4)

          for (let i = 0; i < notesCount; i++) {
            const noteIndex = i % downNotes.length
            notes.push({
              note: downNotes[noteIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        } else {
          // For eighth and sixteenth notes, use the more complex pattern
          const downNotes = [...expandedChordNotes]
            .reverse()
            .slice(0, Math.min(expandedChordNotes.length, Math.ceil(notesPerCycle / 2)))
          const upNotes = [...downNotes].slice(1, -1).reverse() // Exclude first and last to avoid repetition
          const patternNotes = [...downNotes, ...upNotes]

          for (let i = 0; i < notesCount; i++) {
            const noteIndex = i % patternNotes.length
            notes.push({
              note: patternNotes[noteIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        }
        break
      }

      case "inside-out":
        // For quarter notes, simplify to ensure 4 notes per bar
        if (quantizeValue === 4) {
          const patternNotes: number[] = []
          const middleIndex = Math.floor(expandedChordNotes.length / 2)

          // Add middle note
          patternNotes.push(expandedChordNotes[middleIndex])

          // Add note above middle
          if (middleIndex + 1 < expandedChordNotes.length) {
            patternNotes.push(expandedChordNotes[middleIndex + 1])
          } else {
            patternNotes.push(expandedChordNotes[0] + 12) // Add octave if needed
          }

          // Add note below middle
          if (middleIndex - 1 >= 0) {
            patternNotes.push(expandedChordNotes[middleIndex - 1])
          } else {
            patternNotes.push(expandedChordNotes[expandedChordNotes.length - 1] - 12) // Subtract octave if needed
          }

          // Add highest note
          patternNotes.push(expandedChordNotes[expandedChordNotes.length - 1])

          for (let i = 0; i < notesCount; i++) {
            const noteIndex = i % patternNotes.length
            notes.push({
              note: patternNotes[noteIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        } else {
          // Start from the middle and expand outward
          const middleIndex = Math.floor(expandedChordNotes.length / 2)
          const patternNotes: number[] = []

          // Build the pattern from the middle out (limited to notesPerCycle)
          for (let i = 0; i < Math.min(expandedChordNotes.length, notesPerCycle); i++) {
            if (i % 2 === 0) {
              // Add notes from the middle going up
              const upIndex = middleIndex + Math.ceil(i / 2)
              if (upIndex < expandedChordNotes.length) {
                patternNotes.push(expandedChordNotes[upIndex])
              }
            } else {
              // Add notes from the middle going down
              const downIndex = middleIndex - Math.ceil(i / 2)
              if (downIndex >= 0) {
                patternNotes.push(expandedChordNotes[downIndex])
              }
            }
          }

          for (let i = 0; i < notesCount; i++) {
            const noteIndex = i % patternNotes.length
            notes.push({
              note: patternNotes[noteIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        }
        break

      case "outside-in":
        // For quarter notes, simplify to ensure 4 notes per bar
        if (quantizeValue === 4) {
          const patternNotes: number[] = []

          // Add highest note
          patternNotes.push(expandedChordNotes[expandedChordNotes.length - 1])

          // Add lowest note
          patternNotes.push(expandedChordNotes[0])

          // Add second highest note
          if (expandedChordNotes.length > 2) {
            patternNotes.push(expandedChordNotes[expandedChordNotes.length - 2])
          } else {
            patternNotes.push(expandedChordNotes[expandedChordNotes.length - 1] - 1) // Slightly lower than highest
          }

          // Add second lowest note
          if (expandedChordNotes.length > 3) {
            patternNotes.push(expandedChordNotes[1])
          } else {
            patternNotes.push(expandedChordNotes[0] + 1) // Slightly higher than lowest
          }

          for (let i = 0; i < notesCount; i++) {
            const noteIndex = i % patternNotes.length
            notes.push({
              note: patternNotes[noteIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        } else {
          // Start from the outside and move inward
          const patternNotes: number[] = []

          // Build the pattern from outside in (limited to notesPerCycle)
          for (let i = 0; i < Math.min(Math.ceil(expandedChordNotes.length / 2), notesPerCycle); i++) {
            // Add highest note
            const highIndex = expandedChordNotes.length - 1 - i
            if (highIndex >= 0 && highIndex < expandedChordNotes.length) {
              patternNotes.push(expandedChordNotes[highIndex])
            }

            // Add lowest note (if not the same as highest)
            const lowIndex = i
            if (lowIndex < highIndex) {
              patternNotes.push(expandedChordNotes[lowIndex])
            }
          }

          for (let i = 0; i < notesCount; i++) {
            const noteIndex = i % patternNotes.length
            notes.push({
              note: patternNotes[noteIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        }
        break

      case "random":
        // For quarter notes, ensure we have exactly 4 different notes per bar
        if (quantizeValue === 4) {
          // Generate a new set of 4 random notes for each bar
          for (let bar = 0; bar < Math.ceil(notesCount / 4); bar++) {
            const barPatternNotes: number[] = []

            // Generate 4 unique random notes for this bar
            for (let i = 0; i < 4; i++) {
              const randomIndex = Math.floor(Math.random() * expandedChordNotes.length)
              barPatternNotes.push(expandedChordNotes[randomIndex])
            }

            // Add these notes to the sequence
            for (let i = 0; i < 4 && bar * 4 + i < notesCount; i++) {
              notes.push({
                note: barPatternNotes[i],
                duration: quantizeValue,
                time: startTime + (bar * 4 + i) * quantizeValue,
              })
            }
          }
        } else {
          // Create a random pattern from the available notes
          for (let i = 0; i < notesCount; i++) {
            const randomIndex = Math.floor(Math.random() * expandedChordNotes.length)
            notes.push({
              note: expandedChordNotes[randomIndex],
              duration: quantizeValue,
              time: startTime + i * quantizeValue,
            })
          }
        }
        break

      default: {
        // Default to repeating ascending pattern
        const patternNotes = expandedChordNotes.slice(0, notesPerCycle)

        for (let i = 0; i < notesCount; i++) {
          const noteIndex = i % patternNotes.length
          notes.push({
            note: patternNotes[noteIndex],
            duration: quantizeValue,
            time: startTime + i * quantizeValue,
          })
        }
      }
    }

    return notes
  }

  // Generate a melody based on the chord progression
  const generateMelody = (chords: Chord[]) => {
    if (!chords.length) return

    // Get all scale notes
    const scaleNotes = generateScaleNotes(key, mode, 2)

    // Get the quantization value
    const selectedQuantize = QUANTIZE_OPTIONS.find((q) => q.id === quantizeValue)?.value || 4

    const melody: MelodyNote[] = []
    let currentTime = 0

    // For each chord, generate melody notes
    chords.forEach((chord) => {
      // Each chord gets notes based on its duration
      // A full bar is 16 sixteenth notes
      const chordDurationInSixteenths = chord.duration * 16
      const chordEndTime = currentTime + chordDurationInSixteenths

      // Only use arpeggiation when both the rhythm pattern is set to arpeggiation AND arpeggioPattern is not none
      if (rhythmPattern === "arpeggiation") {
        // Use the arpeggioPattern setting to generate arpeggiated notes
        const arpeggioNotes = generateArpeggiatedNotes(chord, currentTime, chordEndTime, selectedQuantize, scaleNotes)
        melody.push(...arpeggioNotes)
      }
      // Add this new section for conjunct melody generation
      else if (rhythmPattern === "conjunct") {
        // Generate conjunct (stepwise) melody
        const notesPerChord = Math.floor(chordDurationInSixteenths / selectedQuantize)

        // Get chord tones and scale notes for better harmonization
        const chordTones = [...chord.notes]
        const rootNote = chord.rootNote

        // Find the highest and lowest chord notes to use as reference points
        const highestChordNote = Math.max(...chord.notes)
        const lowestChordNote = Math.min(...chord.notes)

        // Define the acceptable range for melody notes
        const maxAllowedNote = highestChordNote + 7 // Perfect fifth above highest chord note
        const minAllowedNote = lowestChordNote - 5 // Perfect fourth below lowest chord note

        // Filter scale notes to be within the acceptable range
        const rangeConstrainedScaleNotes = scaleNotes.filter((note) => note >= minAllowedNote && note <= maxAllowedNote)

        // Get the previous melody note (if any) to ensure stepwise motion
        const previousNote = melody.length > 0 ? melody[melody.length - 1].note : null

        // Start with a chord tone if there's no previous note
        let startingNote: number
        if (previousNote === null) {
          // Make sure chordTones is not empty
          if (chordTones.length === 0) {
            // Fallback to the root note if no chord tones are available
            startingNote = rootNote
          } else {
            // Start with a chord tone in the middle register
            startingNote = chordTones[Math.floor(Math.random() * chordTones.length)]
          }

          // Ensure it's in a comfortable register
          while (startingNote > highestChordNote + 4) {
            startingNote -= 12
          }
          while (startingNote < lowestChordNote - 2) {
            startingNote += 12
          }
        } else {
          startingNote = previousNote
        }

        // Generate the conjunct melody notes
        for (let i = 0; i < notesPerChord; i++) {
          // Calculate the exact time for this note based on quantization
          const noteTime = currentTime + i * selectedQuantize

          // Skip if we've exceeded the chord duration
          if (noteTime >= currentTime + chordDurationInSixteenths) break

          // Decide whether to play a note or rest based on complexity
          // Higher complexity = more notes, fewer rests
          const playNote = Math.random() * 100 < melodyComplexity

          if (playNote) {
            // When generating the first note for each chord, ensure we have a valid previous note
            if (i === 0) {
              // For the first note of this chord, use the starting note
              const note = startingNote

              // Add the note to the melody
              melody.push({
                note,
                duration: selectedQuantize,
                time: noteTime,
              })
              continue // Skip to the next iteration
            }

            // Get the previous note (which now definitely exists)
            // Make sure we have a valid previous note
            if (melody.length === 0) {
              // This shouldn't happen due to the continue above, but just in case
              continue
            }

            const prevNote = melody[melody.length - 1].note

            // Find notes that are within a step (1-2 semitones) of the previous note
            // and also within our constrained scale notes
            const stepwiseNotes = rangeConstrainedScaleNotes.filter((note) => {
              const interval = Math.abs(note - prevNote)
              // Primarily use stepwise motion (1-2 semitones)
              return interval <= 2
            })

            // Occasionally allow slightly larger intervals (3-4 semitones) for interest
            // but with lower probability
            const smallLeapNotes = rangeConstrainedScaleNotes.filter((note) => {
              const interval = Math.abs(note - prevNote)
              return interval > 2 && interval <= 4
            })

            // Combine the note options with appropriate weighting
            // 85% chance of stepwise motion, 15% chance of small leap
            const noteOptions = Math.random() < 0.85 || smallLeapNotes.length === 0 ? stepwiseNotes : smallLeapNotes

            // If we have valid note options, choose one
            let note: number
            if (noteOptions.length > 0) {
              // Select a note from the options
              note = noteOptions[Math.floor(Math.random() * noteOptions.length)]
            } else {
              // Fallback: find the closest scale note to the previous note
              const closestNote = rangeConstrainedScaleNotes.reduce((closest, current) => {
                return Math.abs(current - prevNote) < Math.abs(closest - prevNote) ? current : closest
              }, rangeConstrainedScaleNotes[0])
              note = closestNote
            }

            // Ensure the note harmonizes with the chord
            // Higher probability of chord tones on strong beats
            const isStrongBeat = i % 4 === 0
            if (isStrongBeat && Math.random() < 0.7) {
              // Find the closest chord tone to our selected note
              const closestChordTone = chordTones.reduce((closest, current) => {
                return Math.abs(current - note) < Math.abs(closest - note) ? current : closest
              }, chordTones[0])

              // 70% chance to use the chord tone on strong beats
              note = closestChordTone
            }

            // Add the note to the melody
            melody.push({
              note,
              duration: selectedQuantize,
              time: noteTime,
            })
          }
        }
      } else {
        // Original varied pattern logic remains unchanged
        // Get the selected rhythm pattern
        const selectedPattern = RHYTHM_PATTERNS.find((p) => p.id === rhythmPattern)?.pattern || [2, 2, 4, 2, 2, 4]

        // Create a rhythm generator based on the pattern
        const rhythmIndex = 0
        const currentNoteTime = currentTime

        // Get chord tones for better harmonization
        const chordTones = [...chord.notes]

        // Add chord extensions for more melodic options that still harmonize well
        const rootNote = chord.rootNote
        const chordType = chord.name.includes("m") ? "minor" : "major"

        // Add 9th, 11th, 13th extensions that fit the chord
        if (chordType === "major") {
          chordTones.push(rootNote + 14) // 9th
          chordTones.push(rootNote + 17) // 11th
          chordTones.push(rootNote + 21) // 13th
        } else {
          chordTones.push(rootNote + 14) // 9th
          chordTones.push(rootNote + 17) // 11th
          chordTones.push(rootNote + 21) // 13th
        }

        // Apply different melody generation strategies based on rhythm pattern
        // Varied pattern (default)
        // Declare notesPerChord here
        const notesPerChord = Math.floor(chordDurationInSixteenths / selectedQuantize)
        for (let i = 0; i < notesPerChord; i++) {
          // Calculate the exact time for this note based on quantization
          const noteTime = currentTime + i * selectedQuantize

          // Skip if we've exceeded the chord duration
          if (noteTime >= currentTime + chordDurationInSixteenths) break

          // Decide whether to play a note or rest based on complexity
          // Higher complexity = more notes, fewer rests
          const playNote = Math.random() * 100 < melodyComplexity

          if (playNote) {
            // Non-arpeggiated melody generation with improved harmonization
            // Higher probability of chord tones for better harmony
            const useChordTone = Math.random() < 0.85 // 85% chance of chord tone

            let note: number

            // Find the highest note in the chord to use as a reference
            const highestChordNote = Math.max(...chord.notes)

            if (useChordTone) {
              // Select a chord tone
              note = chordTones[Math.floor(Math.random() * chordTones.length)]

              // Limit octave transposition to ensure we don't go too high
              // Only transpose up if the note is more than 3 semitones below the highest chord note
              if (Math.random() < 0.3 && note < highestChordNote - 3) {
                // Transpose up, but ensure we don't go more than an octave above the highest chord note
                const transposedNote = note + 12
                if (transposedNote <= highestChordNote + 7) {
                  // Allow up to a perfect fifth above the highest chord note
                  note = transposedNote
                }
              }
            } else {
              // Select a scale tone that's not in the chord but harmonizes well
              // Filter scale notes to prefer those that sound good with the chord
              const harmonicScaleNotes = scaleNotes.filter((n) => {
                const interval = (n - rootNote) % 12
                // Prefer notes that form consonant intervals with the chord root
                return [0, 2, 4, 5, 7, 9, 11].includes(interval)
              })

              // Further filter to constrain the range
              const rangeConstrainedNotes = harmonicScaleNotes.filter(
                (n) =>
                  // Ensure notes are not more than an octave above the highest chord note
                  n <= highestChordNote + 12 &&
                  // And not more than an octave below the lowest chord note
                  n >= Math.min(...chord.notes) - 12,
              )

              if (rangeConstrainedNotes.length > 0) {
                note = rangeConstrainedNotes[Math.floor(Math.random() * rangeConstrainedNotes.length)]
              } else {
                // Fallback to a chord tone if no suitable scale notes are found
                note = chord.notes[Math.floor(Math.random() * chord.notes.length)]
              }
            }

            // Add the note to the melody
            melody.push({
              note,
              duration: selectedQuantize,
              time: noteTime,
            })
          }
        }
      }

      // Update the current time for the next chord
      currentTime += chordDurationInSixteenths
    })

    // Also modify the melodic smoothing section to ensure we don't have notes that are too high
    // Find the section after melody generation (around line 1150-1170)

    // Replace the melodic smoothing code with this improved version:

    // Apply melodic smoothing and range constraints
    if (arpeggioPattern === "none" && melody.length > 0) {
      // First pass: avoid large jumps
      for (let i = 1; i < melody.length; i++) {
        if (i - 1 >= 0 && i < melody.length) {
          const prevNote = melody[i - 1].note
          const currentNote = melody[i].note

          // If the interval is larger than an octave, try to bring it closer
          if (Math.abs(currentNote - prevNote) > 12) {
            // Move the note to a closer octave
            if (currentNote > prevNote) {
              melody[i].note -= 12
            } else {
              melody[i].note += 12
            }
          }
        }
      }

      // Second pass: ensure all notes are within a reasonable range
      if (chords.length > 0) {
        // Find the average chord note to use as a reference point
        const allChordNotes = chords.flatMap((chord) => chord.notes)
        const highestChordNote = Math.max(...allChordNotes)
        const lowestChordNote = Math.min(...allChordNotes)

        // Define the acceptable range (one octave above highest chord note and one octave below lowest)
        const maxAllowedNote = highestChordNote + 7 // Perfect fifth above highest chord note
        const minAllowedNote = lowestChordNote - 5 // Perfect fourth below lowest chord note

        // Constrain all notes to this range
        for (let i = 0; i < melody.length; i++) {
          let note = melody[i].note

          // If note is too high, bring it down by octaves until it's in range
          while (note > maxAllowedNote) {
            note -= 12
          }

          // If note is too low, bring it up by octaves until it's in range
          while (note < minAllowedNote) {
            note += 12
          }

          melody[i].note = note
        }
      }
    }

    // Ensure we always have at least some melody notes
    if (melody.length === 0 && chords.length > 0) {
      console.log("No melody notes were generated, adding fallback notes")

      // Get all scale notes
      const scaleNotes = generateScaleNotes(key, mode, 2)

      // Get the quantization value
      const selectedQuantize = QUANTIZE_OPTIONS.find((q) => q.id === quantizeValue)?.value || 4

      // Add at least one note per chord as a fallback
      let currentTime = 0

      chords.forEach((chord) => {
        // Each chord gets notes based on its duration
        const chordDurationInSixteenths = chord.duration * 16

        // Add at least one note at the start of each chord
        // Use a chord tone for better harmony
        const rootNote = chord.rootNote

        // Add the root note of the chord as a fallback
        melody.push({
          note: rootNote,
          duration: selectedQuantize,
          time: currentTime,
        })

        // If the chord is long enough, add another note in the middle
        if (chordDurationInSixteenths >= 8 && selectedQuantize <= 4) {
          const middleTime = currentTime + Math.floor(chordDurationInSixteenths / 2)

          // Use the fifth of the chord (7 semitones up from root) if it's in our scale
          const fifthNote = rootNote + 7
          melody.push({
            note: fifthNote,
            duration: selectedQuantize,
            time: middleTime,
          })
        }

        // Update the current time for the next chord
        currentTime += chordDurationInSixteenths
      })

      console.log(`Added ${melody.length} fallback melody notes`)
    }

    // Also add a check to ensure we have at least some notes when using arpeggiation
    if (rhythmPattern === "arpeggiation" && melody.length === 0) {
      // Force a different arpeggiation pattern if the current one failed
      const currentPatternIndex = ARPEGGIO_PATTERNS.findIndex((p) => p.id === arpeggioPattern)
      const newPatternIndex = (currentPatternIndex + 1) % ARPEGGIO_PATTERNS.length
      const newPattern = ARPEGGIO_PATTERNS[newPatternIndex].id

      console.log(`Arpeggiation pattern ${arpeggioPattern} produced no notes, trying ${newPattern}`)
      setArpeggioPattern(newPattern)

      // Try again with the new pattern
      let currentTime = 0
      chords.forEach((chord) => {
        const chordDurationInSixteenths = chord.duration * 16
        const chordEndTime = currentTime + chordDurationInSixteenths

        // Use a simple ascending pattern as fallback
        const notes = chord.notes.sort((a, b) => a - b)
        const selectedQuantize = QUANTIZE_OPTIONS.find((q) => q.id === quantizeValue)?.value || 4

        // Add each note of the chord in sequence
        for (let i = 0; i < notes.length; i++) {
          const noteTime = currentTime + i * selectedQuantize
          if (noteTime < chordEndTime) {
            melody.push({
              note: notes[i],
              duration: selectedQuantize,
              time: noteTime,
            })
          }
        }

        currentTime += chordDurationInSixteenths
      })
    }

    setMelodyNotes(melody)
  }

  // Replace the old playChord function with the new one from useAudio
  const handlePlayChord = (chord: Chord) => {
    playChord(chord, usingSample)
  }

  // Update volume state and audio service
  const handleVolumeChange = (value: number) => {
    setVolumeState(value)
    setVolume(value)
  }

  // Clear all scheduled events
  const clearScheduledEvents = () => {
    scheduledEvents.current.forEach((id) => {
      Tone.Transport.clear(id)
    })
    scheduledEvents.current = []
  }

  // Update the playProgression function to handle variable chord durations and samples
  const playProgression = () => {
    if (!audioInitialized) {
      initializeAudio()
    }

    // If we're paused, just resume playback
    if (isPaused) {
      setIsPaused(false)
      Tone.Transport.start()
      return
    }

    // If already playing and not paused, don't restart
    if (isPlaying && !isPaused) return

    // If using sample but it's not ready yet, don't proceed
    if (usingSample && !sampleReady) {
      console.warn("Sample not ready yet")
      return
    }

    // Reset state before starting new playback
    setIsPlaying(true)
    setIsPaused(false)
    setCurrentChordIndex(-1)
    setCurrentChord(null)
    setCurrentMelodyNote(null)

    // Reset transport and clear any scheduled events
    Tone.Transport.cancel()
    Tone.Transport.stop()
    clearScheduledEvents()

    // Set the tempo
    Tone.Transport.bpm.value = bpm

    // Calculate total duration of the progression in bars
    const totalDuration = progression.reduce((sum, chord) => sum + chord.duration, 0)

    // Configure looping
    if (isLooping) {
      // Set up a loop with the total duration
      Tone.Transport.setLoopPoints(0, `${totalDuration}m`)
      Tone.Transport.loop = true
    } else {
      Tone.Transport.loop = false
    }

    // Schedule the chords
    if (playbackMode === "both" || playbackMode === "chords") {
      let currentTime = 0 // Track the current time in bars

      // Use Tone.Transport.schedule with musical time notation
      progression.forEach((chord, index) => {
        // Schedule each chord at its time position using musical time notation
        const timePosition = `${currentTime}m`

        console.log(
          `Scheduling chord ${index}: ${chord.name} (${chord.numeral}) at position ${timePosition}, duration: ${chord.duration}m`,
        )

        const id = Tone.Transport.schedule((time) => {
          // Play the chord with the appropriate instrument
          if (usingSample && sampler.current && sampleReady) {
            try {
              // Use the sampler if a sample is loaded and ready
              const midiNotes = chord.notes.map((note) => Tone.Frequency(note, "midi").toNote())

              // Calculate the full duration in musical time
              const durationInMusicalTime = `${chord.duration}m`

              // Convert to seconds for the sampler
              const durationInSeconds = Tone.Time(durationInMusicalTime).toSeconds()

              // Play each note individually with the full duration
              midiNotes.forEach((note) => {
                sampler.current?.triggerAttackRelease(note, durationInSeconds, time)
              })

              // Debug log to track chord playback
              console.log(
                `Playing chord ${index}: ${chord.name} at position ${timePosition}, duration: ${chord.duration}m`,
              )
            } catch (error) {
              console.error("Error playing sampled chord in progression:", error)
              // Fallback to synth if there's an error with the sampler
              if (synth.current) {
                const frequencies = chord.notes.map((note) => Tone.Frequency(note, "midi").toFrequency())
                const durationInSeconds = Tone.Time(`${chord.duration}m`).toSeconds()
                synth.current.triggerAttackRelease(frequencies, durationInSeconds, time)
              }
            }
          } else if (synth.current) {
            // Use the default synth with normal behavior
            const frequencies = chord.notes.map((note) => Tone.Frequency(note, "midi").toFrequency())
            const durationInSeconds = Tone.Time(`${chord.duration}m`).toSeconds()
            synth.current.triggerAttackRelease(frequencies, durationInSeconds, time)
          }

          // Update UI - Use Tone.Draw to ensure UI updates are synchronized with audio
          Tone.Draw.schedule(() => {
            setCurrentChord(chord)
            setCurrentChordIndex(index)
          }, time)
        }, timePosition)

        scheduledEvents.current.push(id)

        // Increment the current time by this chord's duration
        currentTime += chord.duration
      })
    }

    // Update the melody playback to use the sampler if available
    if (melodyEnabled && melodyNotes.length > 0 && (playbackMode === "both" || playbackMode === "melody")) {
      // Schedule the melody notes with their absolute time positions in musical notation
      melodyNotes.forEach((note, index) => {
        // Convert the note's time (in 16th notes) to bars:quarters:sixteenths
        const totalSixteenths = note.time
        const measurePosition = Math.floor(totalSixteenths / 16)
        const remainingSixteenths = totalSixteenths % 16
        const quarterPosition = Math.floor(remainingSixteenths / 4)
        const finalSixteenths = remainingSixteenths % 4

        // Schedule the note using musical time notation
        const timePosition = `${measurePosition}:${quarterPosition}:${finalSixteenths}`

        const id = Tone.Transport.schedule((time) => {
          // Calculate duration in seconds based on musical time
          const noteDurationInMusicalTime = `0:0:${note.duration}`
          const durationInSeconds = Tone.Time(noteDurationInMusicalTime).toSeconds()

          if (usingSample && melodySampler.current && sampleReady) {
            try {
              // Use the melody sampler if a sample is loaded and ready
              const midiNote = Tone.Frequency(note.note, "midi").toNote()
              melodySampler.current.triggerAttackRelease(midiNote, durationInSeconds, time)
            } catch (error) {
              console.error("Error playing sampled melody note:", error)
              // Fallback to synth if there's an error with the sampler
              if (melodySynth.current) {
                melodySynth.current.triggerAttackRelease(
                  Tone.Frequency(note.note, "midi").toFrequency(),
                  durationInSeconds,
                  time,
                )
              }
            }
          } else if (melodySynth.current) {
            // Use the default melody synth
            melodySynth.current.triggerAttackRelease(
              Tone.Frequency(note.note, "midi").toFrequency(),
              durationInSeconds,
              time,
            )
          }

          // Update UI
          Tone.Draw.schedule(() => {
            setCurrentMelodyNote(note.note)
            // Clear the highlight after a short delay
            setTimeout(() => setCurrentMelodyNote(null), 100)
          }, time)
        }, timePosition)

        scheduledEvents.current.push(id)
      })
    }

    // If not looping, schedule stop at the end
    if (!isLooping) {
      const stopId = Tone.Transport.schedule((time) => {
        // Use Tone.Draw to ensure UI updates are synchronized with audio
        Tone.Draw.schedule(() => {
          stopPlaying()
        }, time)
      }, `${totalDuration}m`)

      scheduledEvents.current.push(stopId)
    } else {
      // For looping, add a reset event at the loop point to reset UI state
      const loopResetId = Tone.Transport.schedule((time) => {
        // Reset UI state at the loop point
        Tone.Draw.schedule(() => {
          setCurrentChordIndex(-1)
          setCurrentChord(null)
          setCurrentMelodyNote(null)
        }, time)
      }, `${totalDuration}m - 0:0:0.01`) // Slightly before the loop point

      scheduledEvents.current.push(loopResetId)
    }

    // Start the transport
    Tone.Transport.start()
  }

  // Stop playing
  const stopPlaying = () => {
    try {
      // Release all notes if using samplers
      if (usingSample) {
        if (sampler.current) {
          sampler.current.releaseAll()
        }
        if (melodySampler.current) {
          melodySampler.current.releaseAll()
        }
      }

      // Clear all scheduled events
      clearScheduledEvents()

      // Disable looping
      Tone.Transport.loop = false

      // Stop the transport
      Tone.Transport.stop()
      Tone.Transport.cancel()

      // Reset UI state
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentChord(null)
      setCurrentMelodyNote(null)
      setCurrentChordIndex(-1)
    } catch (error) {
      console.error("Error stopping playback:", error)
      // Still reset UI state
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentChord(null)
      setCurrentMelodyNote(null)
      setCurrentChordIndex(-1)
    }
  }

  // Handle chord type selection
  const toggleChordType = (chordTypeId: string) => {
    setSelectedChordTypes((prev) => {
      if (prev.includes(chordTypeId)) {
        // Don't allow deselecting if it's the last selected type
        if (prev.length === 1) return prev
        return prev.filter((id) => id !== chordTypeId)
      } else {
        return [...prev, chordTypeId]
      }
    })
  }

  // Toggle rhythm pattern selection
  const toggleRhythmPattern = (patternId: string) => {
    /*setSelectedRhythmPatterns((prev) => {
        if (prev.includes(patternId))
          {
            // Don't allow deselecting if it's the last selected pattern
            if (prev.length === 1) return prev
            return prev.filter((id) => id !== patternId)
          } else {
            return [...prev, patternId]
          }
        })*/
  }

  // Toggle melody generation
  const toggleMelody = (enabled: boolean) => {
    setMelodyEnabled(enabled)
    if (enabled && progression.length > 0) {
      // Make sure we have a rhythm pattern selected
      if (!rhythmPattern) {
        setRhythmPattern("varied")
      }
      // If using arpeggiation but no pattern is selected, set a default
      if (rhythmPattern === "arpeggiation" && arpeggioPattern === "none") {
        setArpeggioPattern("ascending")
      }

      // Generate the melody
      generateMelody(progression)

      // If no melody was generated, try again with different settings
      if (melodyNotes.length === 0) {
        console.log("Initial melody generation produced no notes, retrying with varied pattern")
        setRhythmPattern("varied")
        setTimeout(() => generateMelody(progression), 0)
      }
    } else {
      setMelodyNotes([])
    }
  }

  // Handle BPM change
  const handleBpmChange = (value: number) => {
    setBpm(value)
    if (Tone.Transport.state === "started") {
      Tone.Transport.bpm.value = value
    }
  }

  // Export chords as MIDI
  const exportChordsAsMIDI = () => {
    if (progression.length === 0) return

    // Convert chord progression to MIDI notes with variable durations
    const midiNotes = []
    let currentTime = 0

    progression.forEach((chord) => {
      // Each chord's duration in 16th notes
      const chordDuration = chord.duration * 16

      // Add each note in the chord
      chord.notes.forEach((note) => {
        midiNotes.push({
          note,
          time: currentTime,
          duration: chordDuration,
        })
      })

      // Update the current time
      currentTime += chordDuration
    })

    const midiData = createMIDIFile(midiNotes, bpm)

    // Generate filename with key and mode
    const filename = `chordlab-progression-${key}-${mode}.mid`

    // Download the MIDI file
    downloadBlob(midiData, filename, "audio/midi")
  }

  // Export melody as MIDI
  const exportMelodyAsMIDI = () => {
    if (melodyNotes.length === 0) return

    const midiData = createMIDIFile(melodyNotes, bpm)

    // Generate filename with key and mode
    const filename = `chordlab-melody-${key}-${mode}.mid`

    // Download the MIDI file
    downloadBlob(midiData, filename, "audio/midi")
  }

  // Generate initial progression
  useEffect(() => {
    generateRandomProgression()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      // Clean up Tone.js resources when component unmounts
      clearScheduledEvents()
      Tone.Transport.stop()
      Tone.Transport.cancel()

      if (synth.current) {
        try {
          // Disconnect from any effects first
          synth.current.disconnect()
          synth.current.dispose()
        } catch (e) {
          console.error("Error disposing synth:", e)
        }
      }

      if (melodySynth.current) {
        try {
          // Disconnect from any effects first
          melodySynth.current.disconnect()
          melodySynth.current.dispose()
        } catch (e) {
          console.error("Error disposing melody synth:", e)
        }
      }

      if (sampler.current) {
        try {
          sampler.current.dispose()
        } catch (e) {
          console.error("Error disposing sampler:", e)
        }
      }

      if (melodySampler.current) {
        try {
          melodySampler.current.dispose()
        } catch (e) {
          console.error("Error disposing melody sampler:", e)
        }
      }
    }
  }, [])

  // Add this useEffect after the other useEffects
  useEffect(() => {
    if (isPlaying && !isPaused) {
      // Update loop state if changed during playback
      Tone.Transport.loop = isLooping

      if (isLooping) {
        // Calculate total duration of the progression in bars
        const totalDuration = progression.reduce((sum, chord) => sum + chord.duration, 0)
        Tone.Transport.setLoopPoints(0, `${totalDuration}m`)
      }
    }
  }, [isLooping, isPlaying, isPaused, progression])

  // Get all highlighted notes (chord + melody)
  const getHighlightedNotes = () => {
    const notes: number[] = []

    // If we have a current chord, use its notes
    if (currentChord) {
      notes.push(...currentChord.notes)
    }
    // If we don't have a current chord but have a valid currentChordIndex, use that chord's notes
    else if (currentChordIndex >= 0 && currentChordIndex < progression.length) {
      notes.push(...progression[currentChordIndex].notes)
    }

    if (currentMelodyNote !== null) {
      notes.push(currentMelodyNote)
    }

    return notes
  }

  // Add this useEffect to ensure chord index and chord state stay in sync
  useEffect(() => {
    if (currentChordIndex >= 0 && currentChordIndex < progression.length) {
      // If we have a valid chord index but no current chord, update the current chord
      if (!currentChord || currentChord !== progression[currentChordIndex]) {
        setCurrentChord(progression[currentChordIndex])
      }
    } else if (currentChordIndex === -1) {
      // If chord index is reset to -1, also reset current chord
      setCurrentChord(null)
    }
  }, [currentChordIndex, progression, currentChord])

  // Format chord notes for display
  const formatChordNotes = (chord: Chord): string => {
    return chord.notes.map((note) => getMidiNoteName(note)).join(" - ")
  }

  // Handle note play for the keyboard
  const handleNotePlay = (note: number) => {
    if (audioInitialized) {
      if (usingSample && melodySampler.current && sampleReady) {
        try {
          const midiNote = Tone.Frequency(note, "midi").toNote()
          melodySampler.current.triggerAttackRelease(midiNote, "1n")
        } catch (error) {
          console.error("Error playing sampled note on keyboard:", error)
          // Fallback to synth
          if (melodySynth.current) {
            melodySynth.current.triggerAttackRelease(Tone.Frequency(note, "midi").toFrequency(), "8n")
          }
        }
      } else if (melodySynth.current) {
        melodySynth.current.triggerAttackRelease(Tone.Frequency(note, "midi").toFrequency(), "8n")
      }
    }
  }

  // Function to pause playback
  const pausePlayback = () => {
    Tone.Transport.pause()
    setIsPaused(true)
  }

  // Update the chord display in the UI to show duration
  return (
    <div className="flex flex-col p-4 glass-container rounded-xl mx-auto max-w-5xl">
      {!audioInitialized && (
        <div className="text-xs text-muted-foreground text-center mb-1">Click any button to enable audio</div>
      )}

      {/* Main layout with three sections */}
      <div className="grid grid-rows-[auto_1fr] gap-4 flex-1">
        {/* Top row: Chord Settings (left) and Melody Settings (right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top-left: Chord Settings */}
          <Card className="card-gradient border-primary/10 overflow-hidden flex flex-col">
            <div className="flex flex-col h-full">
              <CardContent className="p-3 overflow-y-auto flex-1 card-content-scroll">
                <div className="flex justify-between items-center mb-1 sticky top-0 z-10 py-1">
                  <h2 className="text-sm font-bold">Chord Settings</h2>
                  <p className="text-[9px] text-muted-foreground sm:hidden">
                    Some features available on larger screens
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="key" className="text-xs">
                        Key
                      </Label>
                      <Select value={key} onValueChange={setKey}>
                        <SelectTrigger id="key" className="h-7 text-xs">
                          <SelectValue placeholder="Select key" />
                        </SelectTrigger>
                        <SelectContent>
                          {KEYS.map((k) => (
                            <SelectItem key={k} value={k} className="text-xs">
                              {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="mode" className="text-xs">
                        Mode
                      </Label>
                      <Select value={mode} onValueChange={(value: "major" | "minor") => setMode(value)}>
                        <SelectTrigger id="mode" className="h-7 text-xs">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {MODES.map((m) => (
                            <SelectItem key={m} value={m} className="text-xs">
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Chords: {numChords}</Label>
                    <Slider
                      value={[numChords]}
                      min={2}
                      max={4}
                      step={1}
                      onValueChange={(value) => setNumChords(value[0])}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">BPM: {bpm}</Label>
                    <Slider
                      value={[bpm]}
                      min={60}
                      max={200}
                      step={1}
                      onValueChange={(value) => handleBpmChange(value[0])}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Chord Types</Label>
                    <div className="grid grid-cols-2 gap-1">
                      {CHORD_TYPES.map((type) => (
                        <div key={type.id} className="flex items-center space-x-1">
                          <div
                            className={`h-3 w-3 rounded-sm border ${
                              selectedChordTypes.includes(type.id) ? "bg-primary border-primary" : "border-input"
                            } cursor-pointer`}
                            onClick={() => toggleChordType(type.id)}
                          />
                          <label
                            onClick={() => toggleChordType(type.id)}
                            className="text-[10px] font-medium leading-none cursor-pointer"
                          >
                            {type.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample loader component */}
                  <div className="pt-1 border-t border-border hidden sm:block">
                    <SampleLoader onSampleLoaded={handleSampleLoaded} isAudioInitialized={audioInitialized} />
                    {sampleLoading && <p className="text-[10px] text-muted-foreground mt-1">Loading sample...</p>}
                    {sampleError && <p className="text-[10px] text-destructive mt-1">{sampleError}</p>}
                    {sampleReady && !usingPianoSampler && (
                      <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">Sample loaded</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="p-3 pt-0 mt-auto">
                <Button
                  onClick={exportChordsAsMIDI}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center h-7 text-xs"
                  disabled={progression.length === 0}
                >
                  <Download size={12} className="mr-1" />
                  <span>Export Chord MIDI</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Top-right: Melody Settings */}
          <Card className="card-gradient border-primary/10 overflow-hidden flex flex-col">
            <div className="flex flex-col h-full">
              <CardContent className="p-3 overflow-y-auto flex-1 relative card-content-scroll">
                {/* Melody settings header with title and toggle */}

                <div className="flex items-center justify-between mb-1 sticky top-0 z-10 py-1">
                  <h2 className="text-sm font-bold">Melody Settings</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Enable</span>
                    <Switch
                      id="melody-toggle"
                      checked={melodyEnabled}
                      onCheckedChange={toggleMelody}
                      className="data-[state=unchecked]:bg-primary/40 data-[state=unchecked]:opacity-100"
                    />
                  </div>
                </div>

                {/* Melody settings section - greyed out when disabled */}
                <div
                  className={cn("space-y-2 relative", !melodyEnabled && "opacity-30 pointer-events-none blur-[0.5px]")}
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Complexity: {melodyComplexity}%</Label>
                    <Slider
                      value={[melodyComplexity]}
                      min={10}
                      max={90}
                      step={10}
                      onValueChange={(value) => setMelodyComplexity(value[0])}
                      disabled={!melodyEnabled}
                    />
                    <p className="text-[8px] text-muted-foreground">Higher values create more dense melodies</p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="rhythm-pattern" className="text-xs">
                      Rhythm Pattern
                    </Label>
                    <Select value={rhythmPattern} onValueChange={setRhythmPattern} disabled={!melodyEnabled}>
                      <SelectTrigger id="rhythm-pattern" className="h-7 text-xs">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {RHYTHM_PATTERNS.map((pattern) => (
                          <SelectItem key={pattern.id} value={pattern.id} className="text-xs">
                            {pattern.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {rhythmPattern === "arpeggiation" && (
                    <div className="space-y-1">
                      <Label htmlFor="arpeggio-pattern" className="text-xs">
                        Arpeggiation Style
                      </Label>
                      <Select value={arpeggioPattern} onValueChange={setArpeggioPattern} disabled={!melodyEnabled}>
                        <SelectTrigger id="arpeggio-pattern" className="h-7 text-xs">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          {ARPEGGIO_PATTERNS.map((pattern) => (
                            <SelectItem key={pattern.id} value={pattern.id} className="text-xs">
                              {pattern.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="quantize-value" className="text-xs">
                      Note Alignment
                    </Label>
                    <Select value={quantizeValue} onValueChange={setQuantizeValue} disabled={!melodyEnabled}>
                      <SelectTrigger id="quantize-value" className="h-7 text-xs">
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUANTIZE_OPTIONS.map((option) => (
                          <SelectItem key={option.id} value={option.id} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Message when melody is disabled */}
                {!melodyEnabled && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                    style={{ top: "40px" }}
                  >
                    <p className="text-muted-foreground font-medium bg-background/95 px-4 py-2 rounded-md shadow-md border border-border/50 text-xs backdrop-blur-sm">
                      Toggle switch to enable melody
                    </p>
                  </div>
                )}
              </CardContent>
              <div className="p-3 pt-0 mt-auto">
                <Button
                  onClick={() => {
                    if (progression.length > 0 && melodyEnabled) {
                      generateMelody(progression)
                    }
                  }}
                  className="w-full btn-primary h-8 text-xs mb-2"
                  disabled={!melodyEnabled || progression.length === 0}
                >
                  Generate New Melody
                </Button>
                <Button
                  onClick={exportMelodyAsMIDI}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center h-7 text-xs"
                  disabled={!melodyEnabled || melodyNotes.length === 0}
                >
                  <Download size={12} className="mr-1" />
                  <span>Export Melody MIDI</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom row: Full-width Chord Progression and Keyboard/Piano Roll View */}
        <Card className="card-gradient border-primary/10 overflow-hidden flex flex-col">
          <CardContent className="p-3 flex flex-col max-h-[400px] overflow-hidden">
            <div className="flex items-center justify-between mb-2 sticky top-0 z-10">
              <h2 className="text-sm font-bold">Chord Progression</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs",
                    activeView === "keyboard" && "bg-secondary text-secondary-foreground",
                  )}
                  onClick={() => setActiveView("keyboard")}
                >
                  Keyboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs",
                    activeView === "pianoroll" && "bg-secondary text-secondary-foreground",
                  )}
                  onClick={() => setActiveView("pianoroll")}
                >
                  Piano Roll
                </Button>
              </div>
            </div>
            {/* Chord buttons */}
            <div className="flex flex-wrap gap-1 mb-2">
              {progression.map((chord, index) => (
                <Button
                  key={index}
                  variant={currentChordIndex === index ? "default" : "outline"}
                  className={cn(
                    "chord-button group relative py-1 h-auto min-h-0 flex-1",
                    currentChordIndex === index && "chord-button-active",
                    // Adjust width based on duration but keep all in one row
                    chord.duration === 2 && "flex-[2]",
                    chord.duration === 0.5 && "flex-[0.5]",
                  )}
                  onClick={() => handlePlayChord(chord)}
                >
                  <span className="text-sm font-bold">{chord.numeral}</span>
                  <span className="text-[10px]">{chord.name}</span>
                  <span className="text-[8px] text-muted-foreground">
                    {chord.duration === 1 ? "1 bar" : chord.duration === 0.5 ? "½ bar" : "2 bars"}
                  </span>

                  {/* Tooltip that appears on hover */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded-md text-xs shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap z-50 border border-border">
                    {formatChordNotes(chord)}
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-popover rotate-45 border-r border-b border-border"></div>
                  </div>
                </Button>
              ))}
            </div>
            {/* Keyboard or Piano Roll View based on active tab */}
            <div className="flex-grow h-[120px] sm:h-[150px] md:h-[180px] lg:h-[250px] overflow-hidden">
              {activeView === "keyboard" ? (
                <div className="h-full">
                  <PianoKeyboard highlightedNotes={getHighlightedNotes()} onNotePlay={handleNotePlay} />
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <PianoRoll
                    chords={progression}
                    melodyNotes={melodyNotes}
                    showMelody={melodyEnabled}
                    showChords={true}
                    className="flex-grow"
                  />
                  <div className="flex justify-end mt-1">
                    <div className="flex items-center space-x-3 text-[10px] text-muted-foreground">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-[#3B82F6] rounded-sm mr-1"></div>
                        <span>Chords</span>
                      </div>
                      {melodyEnabled && melodyNotes.length > 0 && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-[#38BDF8] rounded-sm mr-1"></div>
                          <span>Melody</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer with controls */}
      <div className="mt-4">
        {/* Improved mobile layout with inline controls */}
        <div className="flex flex-col gap-3">
          {/* Play controls and loop in a single row */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {isPlaying ? (
                <div className="flex gap-1">
                  {isPaused ? (
                    <Button onClick={playProgression} className="flex-1 bg-primary hover:bg-primary/90 h-8 text-xs">
                      <Play className="mr-1 h-3 w-3" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={pausePlayback} className="flex-1 bg-primary hover:bg-primary/90 h-8 text-xs">
                      <Pause className="mr-1 h-3 w-3" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={stopPlaying} variant="destructive" className="flex-1 h-8 text-xs">
                    <Square className="mr-1 h-3 w-3" />
                    Stop
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={playProgression}
                  disabled={!audioInitialized || progression.length === 0 || (usingSample && sampleLoading)}
                  className="w-full btn-primary h-8 text-xs"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Play {melodyEnabled ? (playbackMode === "both" ? "All" : playbackMode) : "Progression"}
                </Button>
              )}
            </div>

            {/* Loop toggle - now inline with play controls */}
            <div className="flex items-center min-w-[80px]">
              <Switch
                id="loop-toggle"
                checked={isLooping}
                onCheckedChange={setIsLooping}
                disabled={!audioInitialized || progression.length === 0}
              />
              <Label htmlFor="loop-toggle" className="text-xs ml-2 whitespace-nowrap">
                Loop
              </Label>
            </div>
          </div>

          {/* Generate button on its own row */}
          <Button onClick={generateRandomProgression} className="w-full btn-primary h-8 text-xs">
            Generate New Progression
          </Button>
        </div>
      </div>
      {/* Debug information removed */}
    </div>
  )
}
