"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] w-full px-4">
      <div className="p-6 bg-card rounded-lg shadow-lg border border-border max-w-md w-full">
        <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          We apologize for the inconvenience. An error occurred while loading the application.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
            Reload page
          </Button>
        </div>
      </div>
    </div>
  )
}
