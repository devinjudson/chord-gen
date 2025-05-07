"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const links = [
    { href: "/", label: "Generator" },
    { href: "/about", label: "About" },
  ]

  return (
    <nav className="relative">
      {/* Mobile menu button - only visible on small screens */}
      <div className="md:hidden">
        <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1">
          <Menu size={20} />
          <span className="sr-only">Menu</span>
        </Button>
      </div>

      {/* Desktop navigation - hidden on mobile */}
      <ul className="hidden md:flex space-x-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile menu - only visible when open on small screens */}
      {isMenuOpen && (
        <ul className="absolute top-10 left-0 bg-background border border-border rounded-md shadow-md p-2 space-y-1 md:hidden z-50">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
