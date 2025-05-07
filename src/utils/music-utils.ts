import { Chord, Mode } from "../types/music"
import { KEYS, NOTE_TO_MIDI } from "../constants/music"

export const getNoteValue = (note: string): number => {
  if (note.includes("/")) {
    const [sharp] = note.split("/")
    return NOTE_TO_MIDI[sharp]
  }
  return NOTE_TO_MIDI[note]
}

export const getMidiNoteName = (midiNote: number): string => {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const octave = Math.floor(midiNote / 12) - 1
  const noteName = noteNames[midiNote % 12]
  return `${noteName}${octave}`
}

export const generateScaleDegrees = (rootKey: string, scaleMode: Mode): string[] => {
  const chromaticScale = [...KEYS, ...KEYS]
  const rootIndex = KEYS.indexOf(rootKey)

  const majorIntervals = [0, 2, 4, 5, 7, 9, 11]
  const minorIntervals = [0, 2, 3, 5, 7, 8, 10]

  const intervals = scaleMode === "major" ? majorIntervals : minorIntervals

  return intervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12
    return KEYS[noteIndex]
  })
}

export const generateScaleNotes = (rootKey: string, scaleMode: Mode, octaves = 2): number[] => {
  const scaleDegrees = generateScaleDegrees(rootKey, scaleMode)
  const rootMidi = getNoteValue(rootKey)
  const scaleNotes: number[] = []

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

export const formatChordNotes = (chord: Chord): string => {
  return chord.notes.map((note) => getMidiNoteName(note)).join(" - ")
}

export const calculateChordDurations = (numChords: number): number[] => {
  switch (numChords) {
    case 2:
      return [2, 2]
    case 3:
      return Math.random() < 0.5 ? [2, 1, 1] : [1, 1, 2]
    case 4:
      return [1, 1, 1, 1]
    default:
      console.warn(`Unexpected number of chords: ${numChords}. Using default distribution.`)
      const barPerChord = 4 / numChords
      return Array(numChords).fill(barPerChord)
  }
} 