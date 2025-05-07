export const KEYS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"]
export const MODES = ["major", "minor"]

export const MAJOR_NUMERALS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
export const MINOR_NUMERALS = ["i", "ii°", "III", "iv", "v", "VI", "VII"]

export const CHORD_TYPES = [
  { id: "triad", label: "Triads", intervals: [0, 4, 7] },
  { id: "seventh", label: "7th Chords", intervals: [0, 4, 7, 10] },
  { id: "major7", label: "Major 7th", intervals: [0, 4, 7, 11] },
  { id: "minor7", label: "Minor 7th", intervals: [0, 3, 7, 10] },
  { id: "sus4", label: "Sus4", intervals: [0, 5, 7] },
  { id: "add9", label: "Add9", intervals: [0, 4, 7, 14] },
]

export const RHYTHM_PATTERNS = [
  { id: "varied", label: "Varied", pattern: [2, 2, 4, 2, 2, 4] },
  { id: "conjunct", label: "Conjunct (Stepwise)", pattern: [] },
  { id: "arpeggiation", label: "Arpeggiation", pattern: [] },
]

export const ARPEGGIO_PATTERNS = [
  { id: "none", label: "No Arpeggiation" },
  { id: "ascending", label: "Ascending" },
  { id: "descending", label: "Descending" },
  { id: "ascending-descending", label: "Ascending-Descending" },
  { id: "descending-ascending", label: "Descending-Ascending" },
  { id: "inside-out", label: "Inside-Out" },
  { id: "outside-in", label: "Outside-In" },
  { id: "random", label: "Random" },
]

export const QUANTIZE_OPTIONS = [
  { id: "quarter", label: "Quarter Notes", value: 4 },
  { id: "eighth", label: "Eighth Notes", value: 2 },
  { id: "sixteenth", label: "Sixteenth Notes", value: 1 },
]

export const NOTE_TO_MIDI: Record<string, number> = {
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