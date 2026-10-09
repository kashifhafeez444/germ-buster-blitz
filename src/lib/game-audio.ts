let audio: AudioContext | undefined;
export function unlockAudio() {
  audio ??= new AudioContext();
  void audio.resume();
}
export function playGameSound(type: "kill" | "hit" | "start" | "end", enabled: boolean) {
  if (!enabled || !audio) return;
  const ctx = audio;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.type = type === "hit" ? "sawtooth" : "triangle";
  const frequencies = { kill: [700, 80], hit: [150, 45], start: [440, 880], end: [880, 440] };
  const [from, to] = frequencies[type];
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(to, now + 0.22);
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  oscillator.start(now);
  oscillator.stop(now + 0.3);
  if (type === "kill" || type === "hit") {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.2;
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start();
  }
}