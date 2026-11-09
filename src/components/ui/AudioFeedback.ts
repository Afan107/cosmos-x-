/**
 * Procedural Web Audio Engine for COSMOS-X Telemetry
 * Generates real-time synthesized cosmic drone, tactical radar tick chirps,
 * and high-priority anomaly alarms without static audio dependencies.
 */

class TelemetryAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  public isMuted = true; // Start muted by default to comply with browser autoplay policies

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpaceDrone();
    } else {
      this.startSpaceDrone();
    }
  }

  public startSpaceDrone() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || this.ambientOsc) return;

    try {
      this.ambientOsc = ctx.createOscillator();
      this.ambientGain = ctx.createGain();

      this.ambientOsc.type = 'sine';
      // 48 Hz Low Cosmic Hum (resembling deep space radiometer background)
      this.ambientOsc.frequency.setValueAtTime(48.0, ctx.currentTime);

      // Subtle, non-intrusive volume
      this.ambientGain.gain.setValueAtTime(0.018, ctx.currentTime);

      this.ambientOsc.connect(this.ambientGain);
      this.ambientGain.connect(ctx.destination);
      this.ambientOsc.start();
    } catch {
      // AudioContext policy fallback
    }
  }

  public stopSpaceDrone() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch {
        // Safe ignore
      }
      this.ambientOsc = null;
      this.ambientGain = null;
    }
  }

  /** High-pitch tactical chirp on selection */
  public triggerTick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // AudioContext fallback
    }
  }

  /** Dual-tone anomaly alert klaxon for Dyson sphere or technosignature detection */
  public triggerAnomalyKlaxon() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(890, ctx.currentTime + 0.14);
      osc.frequency.linearRampToValueAtTime(620, ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.29);
    } catch {
      // AudioContext fallback
    }
  }

  /** Soft ping sweep for sector scan completion */
  public triggerPingSweep() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // AudioContext fallback
    }
  }

  /** Precision target telemetry lock chirp */
  public triggerLock() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // AudioContext fallback
    }
  }

  /** Celebratory harmonic sci-fi arpeggio on cryptographic SHA-256 ratification */
  public triggerCertifiedDiscoveryPing() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.07;
        const duration = 0.28;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.045, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // AudioContext fallback
    }
  }

  /**
   * Synthesize real-time frequency audio representations of space anomalies
   * (e.g. LIGO gravitational wave chirp, SETI Doppler tone, or transit dip)
   */
  public sonifySignal(anomalyType: string) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const typeKey = (anomalyType || '').toUpperCase();
      const now = ctx.currentTime;

      if (typeKey.includes('LIGO') || typeKey.includes('GRAVITATIONAL') || typeKey.includes('RIPPLE')) {
        // Classic LIGO Gravitational Wave Inspiral Chirp: 45 Hz rising to 550 Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(45, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.38);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.32);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      } else if (
        typeKey.includes('SETI') ||
        typeKey.includes('RADIO') ||
        typeKey.includes('TECHNOSIGNATURE') ||
        typeKey.includes('NARROWBAND')
      ) {
        // SETI Narrowband Radio Carrier with linear Doppler drift
        const carrier = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const gain = ctx.createGain();

        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(1040, now);
        carrier.frequency.linearRampToValueAtTime(985, now + 0.65); // -0.32 Hz/s Doppler emulation

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5.5, now); // 5.5 Hz atmospheric scintillation
        lfoGain.gain.setValueAtTime(4.0, now);

        lfo.connect(carrier.frequency);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
        gain.gain.setValueAtTime(0.05, now + 0.55);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

        carrier.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        carrier.start(now);
        lfo.stop(now + 0.7);
        carrier.stop(now + 0.7);
      } else if (
        typeKey.includes('DYSON') ||
        typeKey.includes('INFRARED') ||
        typeKey.includes('MEGASTRUCTURE')
      ) {
        // Deep thermal infrared waste heat resonance (dual harmonic detuned hum)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(120, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(180, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.exponentialRampToValueAtTime(750, now + 0.4);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.75);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
      } else if (
        typeKey.includes('OUMUAMUA') ||
        typeKey.includes('ASTEROID') ||
        typeKey.includes('INTERSTELLAR')
      ) {
        // Hyperbolic radar telemetry clicks
        for (let i = 0; i < 4; i++) {
          const t = now + i * 0.08;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400 + i * 180, t);

          gain.gain.setValueAtTime(0.05, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + 0.045);
        }
      } else {
        // Exoplanetary Transit Photometric Dip: Descending and recovering tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.linearRampToValueAtTime(460, now + 0.25);
        osc.frequency.linearRampToValueAtTime(580, now + 0.5);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.015, now + 0.25); // Transit depth attenuation
        gain.gain.linearRampToValueAtTime(0.04, now + 0.45);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.56);
      }
    } catch {
      // AudioContext fallback
    }
  }

  /** Synthesizes ion thruster burst when piloting rover or drone */
  public triggerThrusterPulse() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Safe fallback
    }
  }

  /** Synthesizes deep roaring ionization rumble during atmospheric re-entry */
  public triggerAtmosphericEntryRoar(intensity = 0.5) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.3);
      osc.frequency.linearRampToValueAtTime(50, now + 0.7);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      const vol = Math.min(0.05, 0.015 + intensity * 0.035);
      gain.gain.setValueAtTime(vol * 0.5, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.72);
    } catch {
      // Safe fallback
    }
  }

  /** Courtroom Gavel Strike sound effect when a verdict is sealed */
  public triggerGavelStrike() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Resonant woodblock / strike acoustic sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Safe fallback
    }
  }

  /** Cinematic Warp-Drive Star-Stretching Sound Effect */
  public triggerWarpDrive() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      // Low sub-bass building into high-frequency hyperspace streak
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.9);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.45);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.9);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.96);
    } catch {
      // Safe fallback
    }
  }

  /** Flashing Red Alert Klaxon when anomaly crosses 7.0-sigma Nobel threshold */
  public triggerRedAlertKlaxon() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.25;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(587, t + 0.1);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.21);
      }
    } catch {
      // Safe fallback
    }
  }

  /** Stella-Core Vegapunk Neural Network Synchronization Chime */
  public triggerNeuralSync() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880]; // A Major resonant harmonic chord
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);

        gain.gain.setValueAtTime(0.03, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.04 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.65);
      });
    } catch {
      // Safe fallback
    }
  }
}

export const soundFX = new TelemetryAudioEngine();

