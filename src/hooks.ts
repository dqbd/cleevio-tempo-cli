import React, { useEffect, useContext, useRef, useState } from "react"
import { StdinContext } from "ink"

export function usePrevious<T>(value: T) {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export function useIsMounted() {
  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    return () => void (isMounted.current = false)
  }, [])
  return isMounted
}

export function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef<() => void>()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current?.()
    }
    if (delay !== null) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
    return void 0
  }, [delay])
}

interface InputKey {
  upArrow: boolean
  downArrow: boolean
  leftArrow: boolean
  rightArrow: boolean
  return: boolean
  escape: boolean
  ctrl: boolean
  shift: boolean
  meta: boolean
}

interface InputHandler {
  (input: string, keys: InputKey, data: string): void
}

export const useActiveInput = (
  inputHandler: InputHandler,
  { active = true } = {}
) => {
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

    const handleData = (data: Buffer) => {
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

interface LockFlags {
  all?: boolean
  x?: boolean
  y?: boolean
  leftArrow?: boolean
  rightArrow?: boolean
  upArrow?: boolean
  downArrow?: boolean
}

export interface LockCallback {
  (locks: LockFlags): void
}

export const useLockableInput = (inputHandler: InputHandler): LockCallback => {
  const [locks, setLocks] = useState<LockFlags>({})

  const arrows = ["leftArrow", "rightArrow", "upArrow", "downArrow"] as const
  useActiveInput(
    (input, key, data) => {
      const parsedLocks = {
        leftArrow: locks.all || locks.x || locks.leftArrow,
        rightArrow: locks.all || locks.x || locks.rightArrow,
        upArrow: locks.all || locks.y || locks.upArrow,
        downArrow: locks.all || locks.y || locks.downArrow,
      }

      if (arrows.some((arrowKey) => parsedLocks[arrowKey] && key[arrowKey])) {
        return
      }

      inputHandler(input, key, data)
    },
    {
      active: true,
    }
  )

  return setLocks
}

export const useAsyncEffect = (
  callback: React.EffectCallback,
  deps?: React.DependencyList
): void => {
  useEffect(() => {
    ;(async () => {
      await callback()
    })()
  }, deps)
}
