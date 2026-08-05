import { useEffect, useRef } from 'react'
import { Howl } from 'howler'

// Hub is served under /artifacts/, so paths must respect Vite's base.
const base = import.meta.env.BASE_URL

const SOUNDS = {
  menuSelect:      `${base}sounds/menu-select.mp3`,
  chimeSoft:       `${base}sounds/chime-soft.mp3`,
  chimeLoud:       `${base}sounds/chime-loud.mp3`,
  graceDiscovered: `${base}sounds/grace-discovered.mp3`,
  recalc:          `${base}sounds/recalc.mp3`,
}

export function useSounds() {
  const howls = useRef({})

  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, src]) => {
      howls.current[key] = new Howl({ src: [src], preload: true, volume: 0.7 })
    })
    return () => Object.values(howls.current).forEach((h) => h.unload())
  }, [])

  const play = (key) => () => howls.current[key]?.play()

  return {
    playMenuSelect:      play('menuSelect'),
    playChimeSoft:       play('chimeSoft'),
    playChimeLoud:       play('chimeLoud'),
    playGraceDiscovered: play('graceDiscovered'),
    playRecalc:          play('recalc'),
  }
}
