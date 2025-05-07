"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Music, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SampleLoaderProps {
  onSampleLoaded: (audioBuffer: AudioBuffer) => void
  isAudioInitialized: boolean
}

export default function SampleLoader({ onSampleLoaded, isAudioInitialized }: SampleLoaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [sampleName, setSampleName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  // Process the dropped or selected file
  const processFile = useCallback(
    async (file: File) => {
      if (!isAudioInitialized) {
        setError("Please initialize audio first")
        return
      }

      // Check if file is an audio file
      if (!file.type.startsWith("audio/")) {
        setError("Please upload an audio file")
        return
      }

      setIsLoading(true)
      setError(null)
      setSampleName(file.name)

      try {
        // Read the file as an ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()

        // Create an AudioContext to decode the audio
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Pass the decoded audio to the parent component
        onSampleLoaded(audioBuffer)

        setIsLoading(false)
      } catch (err) {
        console.error("Error loading audio sample:", err)
        setError("Failed to load audio sample")
        setIsLoading(false)
        setSampleName(null)
      }
    },
    [isAudioInitialized, onSampleLoaded],
  )

  // Handle drop event
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        processFile(file)
      }
    },
    [processFile],
  )

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        processFile(file)
      }
    },
    [processFile],
  )

  // Trigger file input click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Clear the loaded sample
  const clearSample = () => {
    setSampleName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full">
      <Label className="mb-1 block text-xs">Sample Sound</Label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className="hidden"
        disabled={!isAudioInitialized}
      />

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-3 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          !isAudioInitialized && "opacity-50 cursor-not-allowed",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {sampleName ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Music className="h-4 w-4 mr-2 text-primary" />
              <span className="text-xs font-medium truncate max-w-[150px]">{sampleName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSample} className="h-6 w-6 p-0" disabled={isLoading}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-medium mb-1">Drag & drop a sample</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              disabled={!isAudioInitialized || isLoading}
              className="h-7 text-xs"
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {isLoading && <p className="text-xs text-muted-foreground mt-1">Loading sample...</p>}
    </div>
  )
}
