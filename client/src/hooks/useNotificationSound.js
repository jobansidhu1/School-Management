import { useEffect, useRef, useCallback } from "react";

/**
 * useNotificationSound
 * Creates and manages a Web Audio API oscillator-based notification sound.
 * Falls back gracefully when audio is blocked.
 */
const useNotificationSound = () => {
  const audioCtxRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn("[Sound] AudioContext not supported");
        return null;
      }
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Play a notification chime.
   * @param {"normal"|"important"|"urgent"} level
   */
  const playNotificationSound = useCallback(async (level = "normal") => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const now = ctx.currentTime;

      // Build a 3-tone chime depending on priority
      const tones = {
        normal: [523, 659, 784],      // C5 E5 G5 – soft pleasant
        important: [880, 1047, 880],   // A5 C6 A5 – alerting
        urgent: [1047, 784, 1047, 784, 1047], // rapid alarm
      };

      const sequence = tones[level] || tones.normal;
      const noteDuration = level === "urgent" ? 0.18 : 0.25;
      const gapBetween = level === "urgent" ? 0.05 : 0.08;

      sequence.forEach((freq, i) => {
        const startTime = now + i * (noteDuration + gapBetween);

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = level === "urgent" ? "sawtooth" : "sine";
        oscillator.frequency.setValueAtTime(freq, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
      });
    } catch (err) {
      console.warn("[Sound] Could not play notification sound:", err.message);
    }
  }, [getAudioContext]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  return { playNotificationSound };
};

export default useNotificationSound;
