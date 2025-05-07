"use client"

import { useState, useEffect } from "react"

export function useMount() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsMounted(true)
    }, 10) // Small delay to ensure DOM is ready

    return () => clearTimeout(timeout)
  }, [])

  return isMounted
}
