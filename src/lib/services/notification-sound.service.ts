import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private ctx: AudioContext | null = null;

  play(): void {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // iPhone-style tri-tone: three quick ascending bell pings
      const notes = [
        { freq: 1175, start: 0, dur: 0.15 },   // D6
        { freq: 1397, start: 0.18, dur: 0.15 }, // F6
        { freq: 1760, start: 0.36, dur: 0.25 }, // A6 (slightly longer, resolves)
      ];

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = note.freq;

        // Bell-like envelope: instant attack, smooth decay
        gain.gain.setValueAtTime(0.35, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur);
      }
    } catch {}
  }
}
