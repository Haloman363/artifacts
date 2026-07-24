const LORE_PHRASES = {
  left: 'Seek the path left, Tarnished.',
  right: 'Bear right, Tarnished.',
  straight: 'Press onward, Tarnished.',
  arrived: 'A Site of Grace draws near.',
  recalc: 'The path is lost. Seek guidance anew.',
  'turn-left': 'Seek the path left, Tarnished.',
  'turn-right': 'Bear right, Tarnished.',
  'turn-sharp-left': 'Sharp left, Tarnished. Do not falter.',
  'turn-sharp-right': 'Sharp right, Tarnished. Do not falter.',
  'turn-slight-left': 'Bear slightly left, Tarnished.',
  'turn-slight-right': 'Bear slightly right, Tarnished.',
  'merge': 'Merge into the greater path, Tarnished.',
  'roundabout': 'Enter the ring, Tarnished.',
  'rotary': 'Enter the ring, Tarnished.',
  'fork-left': 'Take the left fork, Tarnished.',
  'fork-right': 'Take the right fork, Tarnished.',
  'off-ramp-left': 'Depart left, Tarnished.',
  'off-ramp-right': 'Depart right, Tarnished.',
  'uturn': 'Turn back, Tarnished. Turn back.',
}

function getPhrase(maneuverType, modifier) {
  const key = modifier ? `${maneuverType}-${modifier}`.replace(' ', '-') : maneuverType
  return LORE_PHRASES[key] || LORE_PHRASES[modifier] || 'Seek guidance, Tarnished.'
}

export function useVoice() {
  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.85
    utt.pitch = 0.9
    window.speechSynthesis.speak(utt)
  }

  function speakStep(step) {
    const { type, modifier } = step.maneuver
    speak(getPhrase(type, modifier))
  }

  function speakArrived() { speak(LORE_PHRASES.arrived) }
  function speakRecalc() { speak(LORE_PHRASES.recalc) }

  return { speak, speakStep, speakArrived, speakRecalc }
}
