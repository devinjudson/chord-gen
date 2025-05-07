import * as Tone from "tone"
import { Chord } from "../types/music"

export class AudioService {
  private synth: Tone.PolySynth | null = null
  private melodySynth: Tone.Synth | null = null
  private sampler: Tone.Sampler | null = null
  private melodySampler: Tone.Sampler | null = null
  private scheduledEvents: number[] = []
  private volume: number = 75

  initialize() {
    if (Tone.context.state !== "running") {
      Tone.start()
    }

    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth, {
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

      const compressor = new Tone.Compressor({
        threshold: -20,
        ratio: 4,
        attack: 0.003,
        release: 0.25,
      }).toDestination()

      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0.2,
        preDelay: 0.01,
      }).toDestination()

      const eq = new Tone.EQ3({
        low: -3,
        mid: 0,
        high: 2,
      }).toDestination()

      this.synth.connect(compressor)
      compressor.connect(eq)
      eq.connect(reverb)
    }

    if (!this.melodySynth) {
      this.melodySynth = new Tone.Synth({
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

      const melodyReverb = new Tone.Reverb({
        decay: 1.2,
        wet: 0.15,
        preDelay: 0.01,
      }).toDestination()

      const melodyEq = new Tone.EQ3({
        low: -2,
        mid: 1,
        high: 3,
      }).toDestination()

      this.melodySynth.connect(melodyEq)
      melodyEq.connect(melodyReverb)
    }

    this.setVolume(this.volume)
  }

  setVolume(value: number) {
    this.volume = value
    const volumeInDb = value === 0 ? Number.NEGATIVE_INFINITY : -60 + (value / 100) * 60

    if (this.synth) this.synth.volume.value = volumeInDb
    if (this.melodySynth) this.melodySynth.volume.value = volumeInDb
    if (this.sampler) this.sampler.volume.value = volumeInDb
    if (this.melodySampler) this.melodySampler.volume.value = volumeInDb
  }

  playChord(chord: Chord, usingSample: boolean = false) {
    try {
      if (!this.synth && !this.sampler) {
        this.initialize()
      }

      const frequencies = chord.notes.map((note) => Tone.Frequency(note, "midi").toFrequency())
      const durationInSeconds = Tone.Time(`${chord.duration}m`).toSeconds()

      if (usingSample && this.sampler) {
        const midiNotes = chord.notes.map((note) => Tone.Frequency(note, "midi").toNote())
        midiNotes.forEach((note) => {
          if (this.sampler && !this.sampler.disposed) {
            this.sampler.triggerAttackRelease(note, durationInSeconds)
          }
        })
      } else if (this.synth && !this.synth.disposed) {
        this.synth.triggerAttackRelease(frequencies, durationInSeconds)
      }
    } catch (error) {
      console.error("Error playing chord:", error)
      this.initialize()
      try {
        if (this.synth && !this.synth.disposed) {
          const frequencies = chord.notes.map((note) => Tone.Frequency(note, "midi").toFrequency())
          const durationInSeconds = Tone.Time(`${chord.duration}m`).toSeconds()
          this.synth.triggerAttackRelease(frequencies, durationInSeconds)
        }
      } catch (retryError) {
        console.error("Failed to play chord after reinitialization:", retryError)
      }
    }
  }

  cleanup() {
    this.clearScheduledEvents()
    Tone.Transport.stop()
    Tone.Transport.cancel()

    if (this.synth) {
      try {
        this.synth.disconnect()
        this.synth.dispose()
      } catch (e) {
        console.error("Error disposing synth:", e)
      }
    }

    if (this.melodySynth) {
      try {
        this.melodySynth.disconnect()
        this.melodySynth.dispose()
      } catch (e) {
        console.error("Error disposing melody synth:", e)
      }
    }

    if (this.sampler) {
      try {
        this.sampler.dispose()
      } catch (e) {
        console.error("Error disposing sampler:", e)
      }
    }

    if (this.melodySampler) {
      try {
        this.melodySampler.dispose()
      } catch (e) {
        console.error("Error disposing melody sampler:", e)
      }
    }
  }

  private clearScheduledEvents() {
    this.scheduledEvents.forEach((id) => {
      Tone.Transport.clear(id)
    })
    this.scheduledEvents = []
  }
} 