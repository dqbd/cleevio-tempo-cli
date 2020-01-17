import { useEffect, useRef } from 'react'

export function useIsMounted() {
	const isMounted = useRef(false)
	useEffect(() => {
		isMounted.current = true
		return () => (isMounted.current = false)
	}, [])
	return isMounted
}

export function useInterval(callback, delay) {
	const savedCallback = useRef()

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback
	}, [callback])

	// Set up the interval.
	useEffect(() => {
		function tick() {
			savedCallback.current()
		}
		if (delay !== null) {
			let id = setInterval(tick, delay)
			return () => clearInterval(id)
		}
	}, [delay])
}
