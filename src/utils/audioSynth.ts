// Web Audio API Synthesizer & Audio Loader for Travel Ringtone
import defaultRingtoneUrl from "../assets/brazil_ringtone.mp3";

let audioCtx: AudioContext | null = null;
let currentCustomAudio: HTMLAudioElement | null = null;

// Initialize Audio Context lazily to satisfy browser autoplay policy
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

// Play a synthesized beautiful tropical bell/marimba arpeggio ringtone (as a super safe backup backup)
export function playSyntheticRingtone() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const melody = [
      { note: 523.25, time: 0.0, duration: 0.15 }, // C5
      { note: 659.25, time: 0.15, duration: 0.15 }, // E5
      { note: 783.99, time: 0.3, duration: 0.15 },  // G5
      { note: 1046.5, time: 0.45, duration: 0.25 }, // C6
      { note: 880.0, time: 0.7, duration: 0.15 },  // A5
      { note: 783.99, time: 0.85, duration: 0.2 },  // G5
      { note: 1046.5, time: 1.1, duration: 0.5 },   // C6
    ];

    melody.forEach((item) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(item.note, now + item.time);
      
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(item.note * 2, now + item.time);

      gainNode.gain.setValueAtTime(0, now + item.time);
      gainNode.gain.linearRampToValueAtTime(0.3, now + item.time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + item.time + item.duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now + item.time);
      osc1.stop(now + item.time + item.duration);
      osc2.start(now + item.time);
      osc2.stop(now + item.time + item.duration);
    });
  } catch (err) {
    console.error("Audio synthesis failed:", err);
  }
}

// Handles user uploading their own custom ringtone file
export function storeCustomRingtone(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (base64Data) {
        try {
          localStorage.setItem("custom_ringtone", base64Data);
          resolve(base64Data);
        } catch (error) {
          reject(new Error("El archivo de audio es muy grande para guardar en el navegador. Intenta con uno menor a 2MB."));
        }
      } else {
        reject(new Error("Error al leer el archivo de audio"));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer archivo"));
    reader.readAsDataURL(file);
  });
}

// Retrieve custom ringtone from localStorage if any exists
export function getCustomRingtoneData(): string | null {
  return localStorage.getItem("custom_ringtone");
}

// Warm up / unlock the audio element on mobile/Safari under a synchronous user gesture
export function prepareAudio() {
  const customData = getCustomRingtoneData();
  const audioSrc = customData || defaultRingtoneUrl;
  
  try {
    if (!currentCustomAudio) {
      currentCustomAudio = new Audio(audioSrc);
    }
    if (currentCustomAudio.src !== audioSrc) {
      currentCustomAudio.src = audioSrc;
    }
    
    // Play slightly and immediately pause/mute to unlock the AudioContext / HTMLAudioElement
    currentCustomAudio.volume = 0;
    const playPromise = currentCustomAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        currentCustomAudio?.pause();
        if (currentCustomAudio) {
          currentCustomAudio.volume = 0.8;
          currentCustomAudio.currentTime = 0;
        }
      }).catch((err) => {
        console.log("Audio prepared:", err.message);
      });
    }
  } catch (e) {
    console.warn("Could not prepare audio ahead of time:", e);
  }
}

// Play either custom uploaded ringtone, default Copacabana MP3, or the synthetic backup
export function playRingtone() {
  const customData = getCustomRingtoneData();
  const audioSrc = customData || defaultRingtoneUrl;
  
  try {
    if (currentCustomAudio) {
      currentCustomAudio.pause();
      currentCustomAudio.currentTime = 0;
    } else {
      currentCustomAudio = new Audio(audioSrc);
    }
    
    // Make sure source is correctly set to current target (custom vs default)
    if (currentCustomAudio.src !== audioSrc) {
      currentCustomAudio.src = audioSrc;
    }
    
    currentCustomAudio.volume = 0.8;
    currentCustomAudio.play().catch((err) => {
      console.warn("Autoplay blocked, user interaction required.", err);
      // Let's do a fallback attempt to synthetic
      playSyntheticRingtone();
    });
  } catch (e) {
    console.error("Failed to play custom ringtone, fallback to synthesis:", e);
    playSyntheticRingtone();
  }
}

// Check if custom or default audio is currently playing
export function isRingtonePlaying(): boolean {
  if (currentCustomAudio) {
    return !currentCustomAudio.paused && !currentCustomAudio.ended && currentCustomAudio.currentTime > 0;
  }
  return false;
}

// Pause ringtone
export function pauseRingtone() {
  if (currentCustomAudio) {
    currentCustomAudio.pause();
  }
}

// Toggle play/pause state for ringtone, returns the new play state
export function toggleRingtone(): boolean {
  const customData = getCustomRingtoneData();
  const audioSrc = customData || defaultRingtoneUrl;

  try {
    if (!currentCustomAudio) {
      currentCustomAudio = new Audio(audioSrc);
    }
    
    // Sync current audio source file
    if (currentCustomAudio.src !== audioSrc) {
      currentCustomAudio.src = audioSrc;
    }

    if (isRingtonePlaying()) {
      currentCustomAudio.pause();
      return false;
    } else {
      currentCustomAudio.volume = 0.8;
      currentCustomAudio.play().catch((err) => {
        console.warn("Playback blocked, triggering synthetic alternative", err);
        playSyntheticRingtone();
      });
      return true;
    }
  } catch (err) {
    console.error("Error toggling ringtone:", err);
    playSyntheticRingtone();
    return true;
  }
}


