import { useEffect, useRef } from 'react'

/**
 * Custom hook to get the previous value of a state or prop
 * More modern alternative to manually managing prevRef
 * 
 * @example
 * const prevCount = usePrevious(count)
 * const prevIsOpen = usePrevious(isOpen)
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>()

    useEffect(() => {
        ref.current = value
    }, [value])

    return ref.current
}
