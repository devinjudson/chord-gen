export interface Chord {
  name: string
  numeral: string
  notes: number[]
  rootNote: number
  duration: number // Duration in bars (1 = full bar, 0.5 = half bar, etc.)
}

export interface MelodyNote {
  note: number
  duration: number
  time: number
}

export type Mode = "major" | "minor"
export type PlaybackMode = "both" | "chords" | "melody"
export type ViewMode = "keyboard" | "pianoroll" 