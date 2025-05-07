"use client"

import type { LucideIcon } from "lucide-react"

export const PianoRoll: LucideIcon = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Main container */}
      <rect x="2" y="2" width="20" height="20" rx="2" />

      {/* Piano keys section on left */}
      <line x1="6" y1="2" x2="6" y2="22" strokeWidth="1.5" />

      {/* Horizontal lines representing note rows */}
      <line x1="2" y1="5" x2="6" y2="5" strokeWidth="0.75" />
      <line x1="2" y1="8" x2="6" y2="8" strokeWidth="0.75" />
      <line x1="2" y1="11" x2="6" y2="11" strokeWidth="0.75" />
      <line x1="2" y1="14" x2="6" y2="14" strokeWidth="0.75" />
      <line x1="2" y1="17" x2="6" y2="17" strokeWidth="0.75" />
      <line x1="2" y1="20" x2="6" y2="20" strokeWidth="0.75" />

      {/* Note bars of different lengths */}
      <rect x="7" y="3.5" width="5" height="2" fill="currentColor" />
      <rect x="13" y="3.5" width="7" height="2" fill="currentColor" />

      <rect x="7" y="6.5" width="8" height="2" fill="currentColor" />
      <rect x="16" y="6.5" width="4" height="2" fill="currentColor" />

      <rect x="7" y="9.5" width="3" height="2" fill="currentColor" />
      <rect x="11" y="9.5" width="9" height="2" fill="currentColor" />

      <rect x="7" y="12.5" width="6" height="2" fill="currentColor" />
      <rect x="14" y="12.5" width="6" height="2" fill="currentColor" />

      <rect x="7" y="15.5" width="10" height="2" fill="currentColor" />

      <rect x="7" y="18.5" width="4" height="2" fill="currentColor" />
      <rect x="12" y="18.5" width="8" height="2" fill="currentColor" />
    </svg>
  )
}
