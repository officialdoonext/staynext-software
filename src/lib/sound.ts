/**
 * Web Audio API based notification chime for real-time alerts.
 * Generates an audio bell/chime directly in code — zero external assets, zero 404s, works reliably.
 */

let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return null
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx()
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }
    return sharedAudioCtx
  } catch (err) {
    console.warn('Unable to initialize AudioContext:', err)
    return null
  }
}

// Unlock audio on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    window.removeEventListener('click', unlockAudio)
    window.removeEventListener('keydown', unlockAudio)
    window.removeEventListener('touchstart', unlockAudio)
  }
  window.addEventListener('click', unlockAudio, { passive: true })
  window.addEventListener('keydown', unlockAudio, { passive: true })
  window.addEventListener('touchstart', unlockAudio, { passive: true })
}

/**
 * Play a hotel concierge chime notification sound:
 * 3 melodic bell notes with harmonics and exponential decay (D5 -> F#5 -> A5)
 */
export function playNotificationChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    // Chime notes: D5 (587.33Hz), F#5 (739.99Hz), A5 (880.00Hz)
    const notes = [
      { freq: 587.33, start: now + 0.0, duration: 0.35, gain: 0.25 },
      { freq: 739.99, start: now + 0.12, duration: 0.45, gain: 0.28 },
      { freq: 880.0, start: now + 0.24, duration: 0.8, gain: 0.35 },
    ]

    notes.forEach(({ freq, start, duration, gain: peakGain }) => {
      // Primary sine oscillator
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      // Bell envelope: instant attack, exponential decay
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

      // Soft harmonic overtone for metallic sparkle
      const overtoneOsc = ctx.createOscillator()
      const overtoneGain = ctx.createGain()
      overtoneOsc.type = 'triangle'
      overtoneOsc.frequency.setValueAtTime(freq * 2.02, start)
      overtoneGain.gain.setValueAtTime(0.001, start)
      overtoneGain.gain.linearRampToValueAtTime(peakGain * 0.2, start + 0.01)
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      overtoneOsc.connect(overtoneGain)
      overtoneGain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + duration)

      overtoneOsc.start(start)
      overtoneOsc.stop(start + duration * 0.6)
    })
  } catch (err) {
    console.warn('Failed to play notification chime:', err)
  }
}
