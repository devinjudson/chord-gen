/**
 * Utility functions for MIDI file creation
 */

// Simple MIDI file creation without external dependencies
export function createMIDIFile(notes: Array<{ note: number; time: number; duration: number }>, bpm = 120) {
  // MIDI file format constants
  const HEADER_CHUNK_TYPE = [0x4d, 0x54, 0x68, 0x64] // "MThd"
  const HEADER_CHUNK_LENGTH = [0x00, 0x00, 0x00, 0x06] // Header length (6 bytes)
  const HEADER_FORMAT = [0x00, 0x01] // Format 1 - multiple tracks
  const HEADER_TRACKS = [0x00, 0x02] // 2 tracks - one for tempo, one for notes
  const HEADER_DIVISION = [0x01, 0xe0] // 480 ticks per quarter note

  const TRACK_CHUNK_TYPE = [0x4d, 0x54, 0x72, 0x6b] // "MTrk"

  // Create tempo track
  const tempoTrack = []

  // Time signature event (4/4)
  tempoTrack.push(0x00) // Delta time
  tempoTrack.push(0xff, 0x58, 0x04) // Meta event: time signature
  tempoTrack.push(0x04, 0x02, 0x18, 0x08) // 4/4, 24 MIDI clocks per quarter, 8 32nd notes per quarter

  // Tempo event
  tempoTrack.push(0x00) // Delta time
  tempoTrack.push(0xff, 0x51, 0x03) // Meta event: tempo

  // Calculate microseconds per quarter note from BPM
  const microsecondsPerQuarterNote = Math.floor(60000000 / bpm)
  tempoTrack.push(
    (microsecondsPerQuarterNote >> 16) & 0xff,
    (microsecondsPerQuarterNote >> 8) & 0xff,
    microsecondsPerQuarterNote & 0xff,
  )

  // End of track
  tempoTrack.push(0x00, 0xff, 0x2f, 0x00)

  // Create note track
  const noteTrack = []

  // Set instrument to piano (program change)
  noteTrack.push(0x00) // Delta time
  noteTrack.push(0xc0, 0x00) // Program change to piano

  // Group notes by time to create proper chords
  const notesByTime: Record<number, Array<{ note: number; duration: number }>> = {}

  // Sort and group notes by their start time
  notes.forEach((note) => {
    if (!notesByTime[note.time]) {
      notesByTime[note.time] = []
    }
    notesByTime[note.time].push({ note: note.note, duration: note.duration })
  })

  // Sort time positions
  const timePositions = Object.keys(notesByTime)
    .map(Number)
    .sort((a, b) => a - b)

  let lastTime = 0

  // Process each time position
  timePositions.forEach((timePosition) => {
    const notesAtThisTime = notesByTime[timePosition]

    // Calculate delta time (time since last event)
    const noteTimeInTicks = Math.round(timePosition * 120)
    const deltaTime = noteTimeInTicks - lastTime
    lastTime = noteTimeInTicks

    // Write delta time as variable-length quantity
    writeVariableLengthQuantity(noteTrack, deltaTime)

    // Write all note-on events at this time position (with zero delta time between them)
    notesAtThisTime.forEach((note, index) => {
      if (index > 0) {
        // Zero delta time for subsequent notes in the chord
        writeVariableLengthQuantity(noteTrack, 0)
      }

      // Note on event
      noteTrack.push(0x90, note.note, 0x64) // Note on, note number, velocity
    })

    // Calculate the duration in ticks
    const durationInTicks = Math.round(notesAtThisTime[0].duration * 120)

    // Write delta time for note off
    writeVariableLengthQuantity(noteTrack, durationInTicks)

    // Write all note-off events (with zero delta time between them)
    notesAtThisTime.forEach((note, index) => {
      if (index > 0) {
        // Zero delta time for subsequent notes in the chord
        writeVariableLengthQuantity(noteTrack, 0)
      }

      // Note off event
      noteTrack.push(0x80, note.note, 0x40) // Note off, note number, velocity
    })

    // Update lastTime to include the duration
    lastTime += durationInTicks
  })

  // End of track
  noteTrack.push(0x00, 0xff, 0x2f, 0x00)

  // Calculate track chunk lengths
  const tempoTrackLength = tempoTrack.length
  const noteTrackLength = noteTrack.length

  // Create track chunk headers
  const tempoTrackHeader = [
    ...TRACK_CHUNK_TYPE,
    (tempoTrackLength >> 24) & 0xff,
    (tempoTrackLength >> 16) & 0xff,
    (tempoTrackLength >> 8) & 0xff,
    tempoTrackLength & 0xff,
  ]

  const noteTrackHeader = [
    ...TRACK_CHUNK_TYPE,
    (noteTrackLength >> 24) & 0xff,
    (noteTrackLength >> 16) & 0xff,
    (noteTrackLength >> 8) & 0xff,
    noteTrackLength & 0xff,
  ]

  // Combine all chunks
  const midiData = [
    ...HEADER_CHUNK_TYPE,
    ...HEADER_CHUNK_LENGTH,
    ...HEADER_FORMAT,
    ...HEADER_TRACKS,
    ...HEADER_DIVISION,
    ...tempoTrackHeader,
    ...tempoTrack,
    ...noteTrackHeader,
    ...noteTrack,
  ]

  return new Uint8Array(midiData)
}

// Helper function to write variable-length quantity
function writeVariableLengthQuantity(array: number[], value: number) {
  if (value < 0) value = 0

  if (value < 128) {
    array.push(value)
  } else {
    const buffer = []
    buffer.push(value & 0x7f)

    while ((value >>= 7)) {
      buffer.push((value & 0x7f) | 0x80)
    }

    for (let i = buffer.length - 1; i >= 0; i--) {
      array.push(buffer[i])
    }
  }
}

// Convert chord progression to MIDI notes
export function chordsToMIDINotes(chords: Array<{ notes: number[] }>, bpm: number) {
  const midiNotes = []

  // Each chord gets one measure (4 beats)
  const chordDuration = 16 // in 16th notes

  chords.forEach((chord, index) => {
    const startTime = index * chordDuration

    // Add each note in the chord
    chord.notes.forEach((note) => {
      midiNotes.push({
        note,
        time: startTime,
        duration: chordDuration,
      })
    })
  })

  return midiNotes
}

// Helper function to download data as a file
export function downloadBlob(data: Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
