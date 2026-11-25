export function createFilmSound() {
  const Context = window.AudioContext ?? window.webkitAudioContext;
  if (!Context) return null;
  const context = new Context();
  const master = context.createGain();
  master.gain.value = 0.32;
  master.connect(context.destination);

  const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;

  const ambience = context.createBufferSource();
  const room = context.createBiquadFilter();
  const roomGain = context.createGain();
  ambience.buffer = buffer;
  ambience.loop = true;
  room.type = 'lowpass';
  room.frequency.value = 140;
  roomGain.gain.value = 0.1;
  ambience.connect(room).connect(roomGain).connect(master);
  ambience.start();

  function sweep(high, low, duration, volume) {
    const start = context.currentTime;
    const rustle = context.createBufferSource();
    const tone = context.createBiquadFilter();
    const envelope = context.createGain();
    rustle.buffer = buffer;
    tone.type = 'bandpass';
    tone.frequency.setValueAtTime(high, start);
    tone.frequency.exponentialRampToValueAtTime(low, start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.05);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    rustle.connect(tone).connect(envelope).connect(master);
    rustle.start(start, 0.7, duration + .02);
  }

  function bronze() {
    const start = context.currentTime;
    [183, 481, 749, 1109].forEach((frequency, index) => {
      const partial = context.createOscillator();
      const envelope = context.createGain();
      const end = start + 1.65 - index * 0.20;
      partial.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.21 / (index + 1), start + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.001, end);
      partial.connect(envelope).connect(master);
      partial.start(start);
      partial.stop(end + 0.01);
    });
  }

  return {
    resume: () => context.resume(),
    close: () => {
      master.disconnect();
      return context.close();
    },
    paper: () => sweep(1700, 480, .37, .32),
    screen: () => sweep(780, 230, .57, .22),
    bronze,
  };
}
