'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Debounce timer ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage with debouncing
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value
        
        // Debounce localStorage write to prevent scroll jumping
        if (typeof window !== 'undefined') {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          timeoutRef.current = setTimeout(() => {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          }, 300) // 300ms debounce
        }
        
        return valueToStore
      })
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Force save on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [key, storedValue])

  return [storedValue, setValue]
}

// Hook for syncing state across tabs
export function useLocalStorageSync<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useLocalStorage<T>(key, initialValue)

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, setValue])

  return [value, setValue]
}
