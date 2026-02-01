"use client"

import { useEffect } from "react"

export default function SecurityProtection() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault()
        return false
      }
      // Ctrl+U
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault()
        return false
      }
      // Ctrl+S
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault()
        return false
      }
    }

    // Detect DevTools opening
    const detectDevTools = () => {
      const threshold = 160
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold = window.outerHeight - window.innerHeight > threshold
      
      if (widthThreshold || heightThreshold) {
        // DevTools detected - redirect or show warning
        document.body.innerHTML = ""
        window.location.href = "about:blank"
      }
    }

    // Anti-debugging: Detect debugger
    const antiDebug = () => {
      const start = performance.now()
      debugger // This line will pause if debugger is open
      const end = performance.now()
      
      // If debugger is open, the time difference will be significant
      if (end - start > 100) {
        window.location.href = "about:blank"
      }
    }

    // Disable console in production
    if (process.env.NODE_ENV === "production") {
      console.log = () => {}
      console.debug = () => {}
      console.info = () => {}
      console.warn = () => {}
      console.error = () => {}
    }

    // Clear console periodically
    const clearConsole = () => {
      if (process.env.NODE_ENV === "production") {
        console.clear()
      }
    }

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    
    // Run anti-debugging checks
    const devToolsInterval = setInterval(detectDevTools, 1000)
    const antiDebugInterval = setInterval(antiDebug, 1000)
    const clearConsoleInterval = setInterval(clearConsole, 100)

    // Prevent selection and copy
    document.body.style.userSelect = "none"
    document.body.style.webkitUserSelect = "none"

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      clearInterval(devToolsInterval)
      clearInterval(antiDebugInterval)
      clearInterval(clearConsoleInterval)
    }
  }, [])

  return null
}
