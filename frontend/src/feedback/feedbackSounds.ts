/**
 * AH-POS notification cues. Generated locally with Web Audio (no remote
 * downloads, audio assets or data transmission).
 *
 * Browser autoplay policies require an interaction: we unlock AudioContext on
 * the first pointer or keyboard action. If audio remains blocked, toast colors
 * and aria-live announcements are still the primary feedback.
 */
export type FeedbackTone = 'success' | 'error' | 'warning' | 'info'

type CueNote = readonly [frequency: number, startSeconds: number, durationSeconds: number, gain: number]
const patterns: Record<FeedbackTone, readonly CueNote[]> = {
  success: [[659.25, 0, 0.10, 0.055], [880, 0.12, 0.16, 0.07]],
  error: [[330, 0, 0.16, 0.085], [246.94, 0.18, 0.25, 0.095]],
  warning: [[440, 0, 0.11, 0.055], [440, 0.18, 0.15, 0.055]],
  info: [[523.25, 0, 0.12, 0.035]],
}

let context: AudioContext | null = null
let lastTone: FeedbackTone | null = null
let lastPlayedAt = 0

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null
  try {
    context ??= new window.AudioContext()
    return context
  } catch {
    return null
  }
}

export function unlockFeedbackAudio(): void {
  const audio = getContext()
  if (audio?.state === 'suspended') {
    void audio.resume().catch(() => undefined)
  }
}

export function playFeedbackCue(tone: FeedbackTone): void {
  const audio = getContext()
  if (!audio) return
  // Avoid a barrage of identical cues when one API error produces multiple
  // notices; never suppress the visual toast itself.
  const now = Date.now()
  if (lastTone === tone && now - lastPlayedAt < 450) return
  lastTone = tone
  lastPlayedAt = now

  const schedule = () => {
    if (audio.state !== 'running') return
    const base = audio.currentTime + 0.012
    for (const [frequency, offset, duration, volume] of patterns[tone]) {
      const oscillator = audio.createOscillator()
      const envelope = audio.createGain()
      oscillator.type = tone === 'error' ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(frequency, base + offset)
      envelope.gain.setValueAtTime(0.0001, base + offset)
      envelope.gain.exponentialRampToValueAtTime(volume, base + offset + 0.018)
      envelope.gain.exponentialRampToValueAtTime(0.0001, base + offset + duration)
      oscillator.connect(envelope)
      envelope.connect(audio.destination)
      oscillator.start(base + offset)
      oscillator.stop(base + offset + duration + 0.015)
      oscillator.onended = () => {
        oscillator.disconnect()
        envelope.disconnect()
      }
    }
  }
  if (audio.state === 'running') schedule()
  else void audio.resume().then(schedule).catch(() => undefined)
}
