import { useEffect, useContext, useRef, useState } from "react"
import { StdinContext } from "ink"

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

export const useActiveInput = (inputHandler, { active = true } = {}) => {
  const { stdin, setRawMode } = useContext(StdinContext)

  useEffect(() => {
    if (!active) {
      return
    }

    setRawMode(true)

    return () => {
      setRawMode(false)
    }
  }, [active, setRawMode])

  useEffect(() => {
    if (!active) {
      return
    }

    const handleData = (data) => {
      let input = String(data)
      const key = {
        upArrow: input === "\u001B[A",
        downArrow: input === "\u001B[B",
        leftArrow: input === "\u001B[D",
        rightArrow: input === "\u001B[C",
        return: input === "\r",
        escape: input === "\u001B",
        ctrl: false,
        shift: false,
        meta: false,
      }

      // Copied from `keypress` module
      if (input <= "\u001A" && !key.return) {
        input = String.fromCharCode(input.charCodeAt(0) + "a".charCodeAt(0) - 1)
        key.ctrl = true
      }

      if (input[0] === "\u001B") {
        input = input.slice(1)
        key.meta = true
      }

      const isLatinUppercase = input >= "A" && input <= "Z"
      const isCyrillicUppercase = input >= "А" && input <= "Я"
      if (input.length === 1 && (isLatinUppercase || isCyrillicUppercase)) {
        key.shift = true
      }

      inputHandler(input, key, String(data))
    }

    stdin.on("data", handleData)

    return () => {
      stdin.off("data", handleData)
    }
  }, [active, stdin, inputHandler])

  return 
}

export const useAsyncEffect = (callback, deps) => {
  useEffect(() => {
    ;(async () => {
      await callback()
    })()
  }, deps)
}
