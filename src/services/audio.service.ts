import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isInitialized = false;

  // Sequencer State
  private nextNoteTime = 0;
  private noteIndex = 0;
  
  // Scales (Frequencies in Hz)
  // C Minor Pentatonic extended
  private readonly melody = [
    261.63, 311.13, 392.00, 523.25, // C4, Eb4, G4, C5
    466.16, 392.00, 311.13, 196.00, // Bb4, G4, Eb4, G3
    261.63, 392.00, 523.25, 783.99, // C4, G4, C5, G5
    698.46, 622.25, 523.25, 466.16  // F5, Eb5, C5, Bb4
  ];

  constructor() {}

  init() {
    if (this.isInitialized) return;
    
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.osc = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();
      this.filterNode = this.audioCtx.createBiquadFilter();

      // Signal chain: Oscillator -> Filter -> Gain -> Destination
      this.osc.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      // Defaults
      this.osc.type = 'triangle';
      this.osc.frequency.value = 261.63;
      
      this.filterNode.type = 'lowpass';
      this.filterNode.Q.value = 5; 

      this.gainNode.gain.value = 0; 

      this.osc.start();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  update(intensity: number) {
    if (!this.isInitialized || !this.audioCtx || !this.osc || !this.gainNode || !this.filterNode) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;

    // Filter Logic: Opens up with intensity
    const targetFilter = 200 + (intensity * 4000);
    this.filterNode.frequency.setTargetAtTime(targetFilter, now, 0.1);

    // If intensity is very low, go silent
    if (intensity < 0.02) {
        this.gainNode.gain.setTargetAtTime(0, now, 0.2);
        this.nextNoteTime = now; // Reset sequencer
        return;
    }

    // Melodic Sequencer
    if (now >= this.nextNoteTime) {
        this.scheduleNote(intensity, now);
    }
  }

  private scheduleNote(intensity: number, time: number) {
      if (!this.osc || !this.gainNode) return;

      // Duration decreases as intensity increases (faster tempo)
      // Range: 0.4s (slow) down to 0.08s (fast)
      const stepDuration = Math.max(0.08, 0.4 - (intensity * 0.35));
      this.nextNoteTime = time + stepDuration;

      // Pick Note
      const baseFreq = this.melody[this.noteIndex % this.melody.length];
      this.noteIndex++;

      let freq = baseFreq;

      // Sound Design Changes based on Chaos
      if (intensity > 0.6) {
          // Chaotic Mode
          this.osc.type = 'square'; // Harsh 8-bit sound
          this.filterNode.Q.value = 15; // Resonant
          
          // Random Octave Jumping
          const rand = Math.random();
          if (rand > 0.6) freq *= 2;      // Octave up
          else if (rand > 0.8) freq /= 2; // Octave down
          
          // Slight Detune
          this.osc.detune.setValueAtTime((Math.random() - 0.5) * 50, time);

      } else {
          // Melodic Mode
          this.osc.type = 'triangle'; // Smooth flute-like
          this.filterNode.Q.value = 5;
          this.osc.detune.setValueAtTime(0, time);
      }

      this.osc.frequency.setValueAtTime(freq, time);

      // Envelope (ADSR-ish)
      // Attack
      this.gainNode.gain.cancelScheduledValues(time);
      this.gainNode.gain.setValueAtTime(0, time);
      
      const volume = Math.min(intensity * 0.8, 0.5);
      this.gainNode.gain.linearRampToValueAtTime(volume, time + 0.02);
      
      // Decay/Release
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.9);
  }
}