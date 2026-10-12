import bgMusic from "@/assets/bg-music.mp3.asset.json";
import blastSound from "@/assets/blast-sound.mp3.asset.json";

let audio: AudioContext | undefined;
let music: HTMLAudioElement | undefined;
let blastBuffer: AudioBuffer | undefined;
let blastLoading = false;

export function unlockAudio() {
  audio ??= new AudioContext();
  void audio.resume();
  if (!blastBuffer && !blastLoading) {
    blastLoading = true;
    void fetch(blastSound.url)
      .then((response) => response.arrayBuffer())
      .then((bytes) => audio!.decodeAudioData(bytes))
      .then((buffer) => { blastBuffer = buffer; })
      .catch(() => { blastLoading = false; });
  }
}

export function startMusic(enabled: boolean) {
  music ??= new Audio(bgMusic.url);
  music.loop = true;
  music.volume = 0.35;
  if (enabled) {
    if (music.paused) {
      music.currentTime = 0;
      void music.play().catch(() => {});
    }
  } else {
    music.pause();
  }
}

export function stopMusic() {
  if (music && !music.paused) music.pause();
}

function playBlast() {
  if (!audio || !blastBuffer) return;
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  source.buffer = blastBuffer;
  gain.gain.value = 0.8;
  source.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

export function playGameSound(type: "kill" | "hit" | "start" | "end", enabled: boolean) {
  if (!enabled || !audio) return;
  if (type === "kill" || type === "hit") {
    playBlast();
    return;
  }
  const ctx = audio;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.type = "triangle";
  const frequencies = { start: [440, 880], end: [880, 440] } as const;
  const [from, to] = frequencies[type];
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(to, now + 0.22);
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  oscillator.start(now);
  oscillator.stop(now + 0.3);
}
