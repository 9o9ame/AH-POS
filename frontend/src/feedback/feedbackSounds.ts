/**
 * AH-POS short feedback sounds.
 *
 * Prefer bundled, local MP3 files (verified in frontend/public/sounds); if
 * media playback fails because of unsupported decoding / browser restrictions,
 * try a louder synthesized Web Audio cue. Both paths are best effort and must
 * never prevent the toast or a POS action.
 *
 * Sound cannot override a muted Chrome tab, muted operating system, or a
 * browser's autoplay policy. First pointer/keyboard action unlocks audio.
 */
export type FeedbackTone = 'success' | 'error' | 'warning' | 'info'

const sources: Record<FeedbackTone, string> = {
  error: '/sounds/error-notification.mp3',
  success: '/sounds/notifications/universfield-new-notification-050-494248.mp3',
  warning: '/sounds/notifications/universfield-new-notification-057-494255.mp3',
  info: '/sounds/notifications/universfield-new-notification-024-370048.mp3',
}

type CueNote = readonly [frequency: number, delay: number, duration: number, volume: number]
const cues: Record<FeedbackTone, readonly CueNote[]> = {
  success: [[659.25, 0, 0.12, 0.23], [880, 0.13, 0.19, 0.27]],
  error: [[392, 0, 0.19, 0.30], [261.63, 0.21, 0.25, 0.33]],
  warning: [[440, 0, 0.14, 0.25], [440, 0.20, 0.15, 0.25]],
  info: [[523.25, 0, 0.15, 0.19]],
}

let audioContext: AudioContext | null = null
const media = new Map<FeedbackTone, HTMLAudioElement>()
let lastTone: FeedbackTone | null = null
let lastPlayedAt = 0

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null
  try {
    audioContext ??= new window.AudioContext()
    return audioContext
  } catch {
    return null
  }
}

function getMedia(tone: FeedbackTone): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  const existing = media.get(tone)
  if (existing) return existing
  try {
    const clip = new Audio(sources[tone])
    clip.preload = 'auto'
    clip.volume = 0.8
    media.set(tone, clip)
    return clip
  } catch {
    return null
  }
}

/** Called directly by the first real user gesture, before any toast. */
export function unlockFeedbackAudio(): void {
  const ctx = getAudioContext()
  if (ctx?.state === 'suspended') {
    void ctx.resume().catch(() => undefined)
  }
  // Prepare bundled media while the page is user-activated; don't force a
  // silent play that could itself get rejected or alter the notification.
  for (const tone of ['success', 'error', 'warning', 'info'] as const) {
    getMedia(tone)?.load()
  }
}

function synthesizeCue(tone: FeedbackTone): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const play = () => {
    if (ctx.state !== 'running') return
    const base = ctx.currentTime + 0.015
    for (const [frequency, delay, duration, volume] of cues[tone]) {
      try {
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        oscillator.type = tone === 'error' ? 'triangle' : 'sine'
        oscillator.frequency.setValueAtTime(frequency, base + delay)
        gain.gain.setValueAtTime(0.0001, base + delay)
        gain.gain.exponentialRampToValueAtTime(volume, base + delay + 0.018)
        gain.gain.exponentialRampToValueAtTime(0.0001, base + delay + duration)
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.start(base + delay)
        oscillator.stop(base + delay + duration + 0.015)
        oscillator.onended = () => {
          oscillator.disconnect()
          gain.disconnect()
        }
      } catch {
        // An audio engine error is never a POS failure.
      }
    }
  }
  if (ctx.state === 'running') play()
  else void ctx.resume().then(play).catch(() => undefined)
}

export function playFeedbackCue(tone: FeedbackTone): void {
  const now = Date.now()
  if (lastTone === tone && now - lastPlayedAt < 500) return
  lastTone = tone
  lastPlayedAt = now

  const clip = getMedia(tone)
  if (!clip) {
    synthesizeCue(tone)
    return
  }
  try {
    clip.pause()
    clip.currentTime = 0
    void clip.play().catch(() => synthesizeCue(tone))
  } catch {
    synthesizeCue(tone)
  }
}
