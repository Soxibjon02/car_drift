/**
 * DRIFTVERSE - Web Audio Automotive Sound Synthesizer
 * Generates dynamic engine revs, turbo blow-offs, shift pops, and UI acoustic feedback
 */
import { store } from "./store.js";

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isInitialized = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.25;
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return true;
  }

  isEnabled() {
    return store.soundEnabled;
  }

  // Sleek UI Micro-interaction click
  playClick(freq = 600) {
    if (!this.isEnabled() || !this.ensureContext()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // Realistic synthesized car revving + turbo spool
  playRev(soundType = "turbo-i6") {
    if (!this.isEnabled() || !this.ensureContext()) return;

    try {
      const t = this.ctx.currentTime;
      const duration = 1.6;

      // Base engine fundamental frequencies
      let baseFreq = 85;
      let peakFreq = 340;
      let isElectric = soundType === "electric-whine";

      if (soundType.includes("v10")) {
        baseFreq = 120;
        peakFreq = 540;
      } else if (soundType.includes("v12")) {
        baseFreq = 110;
        peakFreq = 500;
      } else if (soundType.includes("rotary")) {
        baseFreq = 140;
        peakFreq = 480;
      } else if (soundType.includes("2jz")) {
        baseFreq = 80;
        peakFreq = 380;
      } else if (soundType.includes("v8")) {
        baseFreq = 70;
        peakFreq = 290;
      }

      if (isElectric) {
        // High frequency futuristic electric hypercar inverter sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(2200, t + 0.8);
        osc.frequency.exponentialRampToValueAtTime(800, t + duration);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration);
        return;
      }

      // Internal combustion: Layer 1 (Crankshaft harmonics)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();

      osc1.type = "sawtooth";
      osc2.type = "triangle";
      subOsc.type = "sawtooth";

      // Throttle sweep envelope
      osc1.frequency.setValueAtTime(baseFreq, t);
      osc1.frequency.exponentialRampToValueAtTime(peakFreq, t + 0.45);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, t + 0.8);
      osc1.frequency.exponentialRampToValueAtTime(peakFreq * 1.15, t + 1.1);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq, t + duration);

      osc2.frequency.setValueAtTime(baseFreq * 1.5, t);
      osc2.frequency.exponentialRampToValueAtTime(peakFreq * 1.5, t + 0.45);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + duration);

      subOsc.frequency.setValueAtTime(baseFreq * 0.5, t);
      subOsc.frequency.exponentialRampToValueAtTime(peakFreq * 0.5, t + 0.45);
      subOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + duration);

      // Resonant Low-pass Filter for exhaust roar
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(3200, t + 0.45);
      filter.frequency.exponentialRampToValueAtTime(600, t + duration);
      filter.Q.value = 5.0;

      // Amplitude envelope
      const engineGain = this.ctx.createGain();
      engineGain.gain.setValueAtTime(0.01, t);
      engineGain.gain.linearRampToValueAtTime(0.2, t + 0.2);
      engineGain.gain.setValueAtTime(0.25, t + 0.45);
      engineGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      subOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      subOsc.start(t);
      osc1.stop(t + duration);
      osc2.stop(t + duration);
      subOsc.stop(t + duration);

      // Turbo blow-off valve flutter (white noise burst) at deceleration (t + 0.55)
      this.playTurboFlutter(t + 0.5);
    } catch (e) {
      console.warn("Rev sound synthesis error:", e);
    }
  }

  playTurboFlutter(startTime) {
    try {
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.value = 3500;
      bandpass.Q.value = 8.0;

      const flutterGain = this.ctx.createGain();
      flutterGain.gain.setValueAtTime(0.001, startTime);
      flutterGain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
      flutterGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      whiteNoise.connect(bandpass);
      bandpass.connect(flutterGain);
      flutterGain.connect(this.masterGain);

      whiteNoise.start(startTime);
      whiteNoise.stop(startTime + 0.35);
    } catch (e) {}
  }

  // Countdown acoustic cues (3... 2... 1... GO!)
  playCountdownBeep(count) {
    if (!this.isEnabled() || !this.ensureContext()) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (count === "GO" || count === 0) {
        // High pitched green flag launch tone + instant exhaust roar
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.25);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.4);

        // Immediate launch rev
        this.playRev("turbo-v6");
      } else {
        // Red staging light tone
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, t);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
      }
    } catch (e) {}
  }

  // --- HIDDEN YOUTUBE AUDIO ENGINE (PURE SOUND WITHOUT VIDEO) ---
  playYoutubeAudio(youtubeUrlOrId, durationSec = 12, startSec = 0) {
    if (!this.isEnabled()) return;
    if (!youtubeUrlOrId) return;

    let youtubeId = youtubeUrlOrId.trim();
    if (youtubeId.includes("youtube.com") || youtubeId.includes("youtu.be")) {
      const match = youtubeId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match) youtubeId = match[1];
    }

    if (!youtubeId || !/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
      // Fallback to synthesized rev if invalid
      this.playRev("v8-supercharged");
      return;
    }

    let hiddenContainer = document.getElementById("driftverse-hidden-audio-wrap");
    if (!hiddenContainer) {
      hiddenContainer = document.createElement("div");
      hiddenContainer.id = "driftverse-hidden-audio-wrap";
      hiddenContainer.style.cssText = "position:fixed; width:1px; height:1px; top:-9999px; left:-9999px; opacity:0; pointer-events:none; z-index:-9999; overflow:hidden;";
      document.body.appendChild(hiddenContainer);
    }

    if (this._ytAudioTimeout) {
      clearTimeout(this._ytAudioTimeout);
    }

    hiddenContainer.innerHTML = `
      <iframe 
        id="driftverse-hidden-yt-audio" 
        src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${startSec}&controls=0&playsinline=1&enablejsapi=1" 
        allow="autoplay"
        style="width:1px; height:1px; border:0;"
      ></iframe>
    `;

    window.dispatchEvent(new CustomEvent("driftverse:toast", {
      detail: { message: "🔊 YouTube stream orqali haqiqiy dvigatel tovushi yangramoqda..." }
    }));

    this._ytAudioTimeout = setTimeout(() => {
      this.stopYoutubeAudio();
    }, durationSec * 1000);
  }

  stopYoutubeAudio() {
    if (this._ytAudioTimeout) {
      clearTimeout(this._ytAudioTimeout);
      this._ytAudioTimeout = null;
    }
    const hiddenContainer = document.getElementById("driftverse-hidden-audio-wrap");
    if (hiddenContainer) {
      hiddenContainer.innerHTML = "";
    }
  }

  // Play Car Audio (prioritizes YouTube audio link if available)
  playCarAudio(car) {
    if (!this.isEnabled()) return;
    if (car && (car.youtube_audio || car.youtube_sound_url)) {
      this.playYoutubeAudio(car.youtube_audio || car.youtube_sound_url, 14);
    } else if (car && car.soundType) {
      this.playRev(car.soundType);
    } else {
      this.playRev("turbo-v6");
    }
  }
}

export const soundEngine = new SoundEngine();
