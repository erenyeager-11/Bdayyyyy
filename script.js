const STORAGE_KEY = "birthday-alveera-send-ready-v1";
const OLD_STORAGE_KEYS = ["birthday-night-state-v1"];
const PHOTO_LIMIT = 9;

const defaults = {
  recipient: "Alveera",
  birthday: "2026-05-25",
  vibe: "Midnight fireworks",
  message: "A whole little universe of music, wishes, memories, gifts, confetti, and candlelight made specially for you today.",
  theme: "coral",
  liked: true,
  notes: [
    {
      id: "note-from-me",
      name: "From me",
      mood: "glowing",
      message: "Happy birthday, Alveera. I made this little birthday world so your day starts with music, wishes, cake, gifts, and a sky full of sparks.",
      created: "today"
    },
    {
      id: "note-birthday-night",
      name: "Birthday Page",
      mood: "sweet",
      message: "Every button here has one job: make Alveera smile a little bigger.",
      created: "today"
    }
  ],
  photos: []
};

const wishes = [
  "May your next year feel like a favorite song at full volume: warm, wild, bright, and completely yours.",
  "May every door you open this year have better light, better people, and a ridiculous amount of cake waiting inside.",
  "Here is to a year that gives you soft mornings, loud wins, brave choices, and friends who show up every time.",
  "May today remind you how deeply loved you are, and may tomorrow start acting like it got the memo.",
  "Another trip around the sun, another reason for the universe to show off a little harder for you.",
  "May your smile stay dangerous, your playlist stay elite, and your luck keep arriving early.",
  "For your birthday: more peace, more glow, more adventures, and exactly enough chaos to make great stories.",
  "May this year be packed with tiny miracles, huge laughs, and moments that feel handmade for your heart."
];

const themeOrder = ["coral", "teal", "gold", "berry"];
const lyricTimes = [0, 8, 16, 24];
const playlist = [
  { title: "Alveera's Birthday Anthem", artist: "Opening sparkle", src: "song1.mp3" },
  { title: "Cake Lights", artist: "Second surprise", src: "song2.mp3" },
  { title: "Midnight Wish", artist: "Soft glow mix", src: "song3.mp3" },
  { title: "Firework Smile", artist: "Party lift", src: "song4.mp3" },
  { title: "Memory Lane", artist: "Golden hour", src: "song5.mp3" },
  { title: "Gift Box Groove", artist: "Bright beat", src: "song6.mp3" },
  { title: "Candlelight Chorus", artist: "Wish scene", src: "song7.mp3" },
  { title: "Final Spark", artist: "Birthday finale", src: "song8.mp3" }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

let state = loadState();
let confettiParticles = [];
let fireworkParticles = [];
let fireworksAnimating = false;
let gameParticles = [];
let gameScore = 0;
let gameRunning = false;
let gameFrame = 0;
let lastSparkAt = 0;
let audioContext = null;
let analyser = null;
let analyserData = null;
let mediaSource = null;
let visualizerFrame = 0;
let sleepTimer = null;
let activeLyricIndex = 0;
let currentTrackIndex = 0;
let storageNoticeShown = false;
let activePlaylist = playlist.slice(0, 1);

const els = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  cleanupLegacyStorage();
  applyState();
  wireGlobalUi();
  wirePersonalForm();
  wireAudioPlayer();
  wireWishTools();
  wireCake();
  wirePhotoLab();
  wireGiftVault();
  wireGuestbook();
  wireSparkGame();
  setupCanvases();
  drawIdleVisualizer();
  setTimeout(() => document.body.classList.add("is-loaded"), 450);
}

function cleanupLegacyStorage() {
  try {
    OLD_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Some browsers block file-page storage. The site still works without persistence.
  }
}

function cacheElements() {
  els.body = document.body;
  els.topbar = $("[data-topbar]");
  els.loader = $("#loader");
  els.cursorGlow = $("[data-cursor-glow]");
  els.toastRegion = $("[data-toast-region]");
  els.confettiCanvas = $("#confettiCanvas");
  els.fireworkCanvas = $("#fireworkCanvas");
  els.visualizerCanvas = $("#visualizerCanvas");
  els.gameCanvas = $("#sparkGame");
  els.form = $("[data-personal-form]");
  els.recipientTargets = $$("[data-recipient-name]");
  els.messageTarget = $("[data-main-message]");
  els.vibeTarget = $("[data-party-vibe]");
  els.countdownLabel = $("[data-countdown-label]");
  els.days = $("[data-days]");
  els.hours = $("[data-hours]");
  els.minutes = $("[data-minutes]");
  els.seconds = $("[data-seconds]");
  els.audio = $("#birthdayAudio");
  els.progressRange = $("#progressRange");
  els.volumeRange = $("#volumeRange");
  els.currentTime = $("[data-current-time]");
  els.duration = $("[data-duration]");
  els.audioStatus = $("[data-audio-status]");
  els.playToggle = $("[data-play-toggle]");
  els.trackTitle = $("[data-track-title]");
  els.trackArtist = $("[data-track-artist]");
  els.queueList = $("[data-queue-list]");
  els.visualizer = $("#visualizerCanvas");
  els.lyrics = $$("[data-lyrics] li");
  els.wishOutput = $("[data-wish-output]");
  els.wishDialog = $("#wishDialog");
  els.privateWish = $("[data-private-wish]");
  els.photoGrid = $("[data-photo-grid]");
  els.dropZone = $("[data-drop-zone]");
  els.photoInput = $("[data-photo-input]");
  els.giftGrid = $("[data-gift-grid]");
  els.guestForm = $("[data-guest-form]");
  els.guestNotes = $("[data-guest-notes]");
  els.gameScore = $("[data-game-score]");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaults);
    const stored = JSON.parse(raw);
    return {
      ...structuredClone(defaults),
      ...stored,
      notes: Array.isArray(stored.notes) ? stored.notes : structuredClone(defaults.notes),
      photos: Array.isArray(stored.photos) ? stored.photos.slice(0, PHOTO_LIMIT) : []
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    try {
      OLD_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      state.photos = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      if (!storageNoticeShown) {
        storageNoticeShown = true;
        toast("Saved for this visit", "Your browser storage is full, but the birthday page will still work.");
      }
    }
  }
}

function applyState() {
  els.body.dataset.theme = state.theme;
  els.recipientTargets.forEach((target) => {
    target.textContent = state.recipient || defaults.recipient;
  });
  els.messageTarget.textContent = state.message || defaults.message;
  els.vibeTarget.textContent = state.vibe || defaults.vibe;

  if (els.form) {
    els.form.elements.recipient.value = state.recipient;
    els.form.elements.birthday.value = state.birthday;
    els.form.elements.vibe.value = state.vibe;
    els.form.elements.message.value = state.message;
  }

  $$("[data-theme]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === state.theme);
  });

  $("[data-like-track]")?.classList.toggle("is-active", state.liked);
  renderGuestNotes();
  renderPhotos();
  updateCountdown();
}

function wireGlobalUi() {
  window.addEventListener("scroll", () => {
    els.topbar.classList.toggle("is-scrolled", window.scrollY > 12);
  }, { passive: true });

  window.addEventListener("mousemove", (event) => {
    if (window.matchMedia("(pointer: fine)").matches) {
      els.body.classList.add("has-cursor");
      els.cursorGlow.style.transform = `translate3d(${event.clientX - 144}px, ${event.clientY - 144}px, 0)`;
    }
  }, { passive: true });

  $$("[data-confetti-burst]").forEach((button) => {
    button.addEventListener("click", () => {
      burstConfetti(window.innerWidth / 2, window.innerHeight * 0.34, 160);
      toast("Confetti launched", "The room is now officially more dramatic.");
    });
  });

  $("[data-start-party]")?.addEventListener("click", async () => {
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.32, 220);
    fireworksShow(3);
    await playAudio();
  });

  $("[data-jump-player]")?.addEventListener("click", () => {
    $("#music")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => els.playToggle?.focus(), 450);
  });

  $("[data-theme-cycle]")?.addEventListener("click", () => {
    const nextIndex = (themeOrder.indexOf(state.theme) + 1) % themeOrder.length;
    state.theme = themeOrder[nextIndex];
    saveState();
    applyState();
    toast("Theme changed", `${capitalize(state.theme)} mode is active.`);
  });

  $$("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.theme;
      saveState();
      applyState();
    });
  });

  $("[data-back-top]")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  setInterval(updateCountdown, 1000);
}

function wirePersonalForm() {
  els.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(els.form);
    state.recipient = cleanText(formData.get("recipient"), defaults.recipient, 28);
    state.birthday = formData.get("birthday")?.toString() || "";
    state.vibe = cleanText(formData.get("vibe"), defaults.vibe, 40);
    state.message = cleanText(formData.get("message"), defaults.message, 145);
    saveState();
    applyState();
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.25, 90);
    toast("Saved", `${state.recipient}'s birthday site has been updated.`);
  });
}

function wireAudioPlayer() {
  if (!els.audio) return;

  els.audio.volume = Number(els.volumeRange.value);
  selectTrack(0, { autoplay: false, announce: false });
  renderQueue();
  discoverAvailableTracks();

  els.playToggle?.addEventListener("click", () => {
    if (els.audio.paused) {
      playAudio();
    } else {
      pauseAudio();
    }
  });

  $("[data-prev-track]")?.addEventListener("click", () => previousTrack());
  $("[data-next-track]")?.addEventListener("click", () => nextTrack(true));

  $("[data-shuffle]")?.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle("is-active");
    burstConfetti(window.innerWidth * 0.76, window.innerHeight * 0.36, 45);
    toast("Shuffle mood", "The vibe order got a little less predictable.");
  });

  $("[data-repeat]")?.addEventListener("click", (event) => {
    const isActive = event.currentTarget.classList.toggle("is-active");
    els.audio.loop = isActive;
    toast("Repeat", isActive ? "The birthday anthem will loop." : "Looping is off.");
  });

  $("[data-like-track]")?.addEventListener("click", (event) => {
    state.liked = !state.liked;
    event.currentTarget.classList.toggle("is-active", state.liked);
    saveState();
    if (state.liked) burstConfetti(window.innerWidth * 0.86, window.innerHeight * 0.2, 55);
  });

  $("[data-sleep-timer]")?.addEventListener("click", (event) => {
    if (sleepTimer) {
      clearTimeout(sleepTimer);
      sleepTimer = null;
      event.currentTarget.classList.remove("is-active");
      toast("Sleep timer off", "Music will keep going.");
      return;
    }
    sleepTimer = setTimeout(() => {
      pauseAudio();
      sleepTimer = null;
      $("[data-sleep-timer]")?.classList.remove("is-active");
      toast("Sleep timer", "The song faded out for the night.");
    }, 15 * 60 * 1000);
    event.currentTarget.classList.add("is-active");
    toast("Sleep timer set", "The player will pause in 15 minutes.");
  });

  els.progressRange.addEventListener("input", () => {
    if (!Number.isFinite(els.audio.duration) || els.audio.duration <= 0) return;
    els.audio.currentTime = (Number(els.progressRange.value) / 1000) * els.audio.duration;
    updateProgress();
  });

  els.volumeRange.addEventListener("input", () => {
    els.audio.volume = Number(els.volumeRange.value);
  });

  els.audio.addEventListener("loadedmetadata", () => {
    els.duration.textContent = formatTime(els.audio.duration);
    updateStatus("ready");
  });

  els.audio.addEventListener("timeupdate", () => {
    updateProgress();
    updateLyricPulse();
  });

  els.audio.addEventListener("play", () => {
    document.body.classList.add("is-playing");
    updateStatus("playing");
    startVisualizer();
  });

  els.audio.addEventListener("pause", () => {
    document.body.classList.remove("is-playing");
    updateStatus("paused");
  });

  els.audio.addEventListener("ended", () => {
    document.body.classList.remove("is-playing");
    updateStatus("ended");
    fireworksShow(2);
    if (!els.audio.loop) nextTrack(true);
  });

  els.audio.addEventListener("error", () => {
    updateStatus("missing");
    toast("Birthday song unavailable", "The music did not load on this device, but the celebration is still live.");
  });
}

async function playAudio() {
  if (!els.audio) return;
  try {
    await prepareAudioGraph();
    await els.audio.play();
  } catch {
    document.body.classList.remove("is-playing");
    updateStatus("missing");
    toast("Song could not play", "The birthday song did not load on this device.");
  }
}

function pauseAudio() {
  els.audio?.pause();
}

function restartTrack(playAfter = false) {
  if (!els.audio) return;
  els.audio.currentTime = 0;
  updateProgress();
  burstConfetti(window.innerWidth * 0.5, window.innerHeight * 0.42, 35);
  if (playAfter || !els.audio.paused) playAudio();
}

function previousTrack() {
  if (!els.audio) return;
  if (els.audio.currentTime > 3) {
    restartTrack();
    return;
  }
  const nextIndex = (currentTrackIndex - 1 + activePlaylist.length) % activePlaylist.length;
  selectTrack(nextIndex, { autoplay: !els.audio.paused, announce: true });
}

function nextTrack(forcePlay = false) {
  if (!els.audio) return;
  const shuffleOn = $("[data-shuffle]")?.classList.contains("is-active");
  let nextIndex = (currentTrackIndex + 1) % activePlaylist.length;
  if (shuffleOn && activePlaylist.length > 1) {
    do {
      nextIndex = Math.floor(Math.random() * activePlaylist.length);
    } while (nextIndex === currentTrackIndex);
  }
  selectTrack(nextIndex, { autoplay: forcePlay || !els.audio.paused, announce: true });
}

function selectTrack(index, options = {}) {
  if (!els.audio || !activePlaylist.length) return;
  const track = activePlaylist[(index + activePlaylist.length) % activePlaylist.length];
  currentTrackIndex = activePlaylist.indexOf(track);
  els.audio.src = track.src;
  els.audio.load();
  activeLyricIndex = 0;
  els.progressRange.value = 0;
  els.currentTime.textContent = "0:00";
  els.duration.textContent = "0:00";
  els.trackTitle.textContent = track.title;
  els.trackArtist.textContent = track.artist;
  els.lyrics.forEach((line, lineIndex) => line.classList.toggle("is-active", lineIndex === 0));
  renderQueue();
  updateStatus("ready");
  if (options.announce) toast("Track selected", track.title);
  if (options.autoplay) playAudio();
}

function renderQueue() {
  if (!els.queueList) return;
  els.queueList.innerHTML = "";
  activePlaylist.forEach((track, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "queue-card";
    button.classList.toggle("is-active", index === currentTrackIndex);
    button.setAttribute("aria-label", `Play ${track.title}`);

    const number = document.createElement("span");
    number.className = "queue-card__number";
    number.textContent = String(index + 1).padStart(2, "0");

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = track.title;
    const artist = document.createElement("small");
    artist.textContent = track.artist;
    copy.append(title, artist);

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("icon", "icon--pulse");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#icon-music");
    icon.append(use);

    button.append(number, copy, icon);
    button.addEventListener("click", () => {
      selectTrack(index, { autoplay: true, announce: true });
    });
    els.queueList.append(button);
  });
}

async function discoverAvailableTracks() {
  const selectedSrc = activePlaylist[currentTrackIndex]?.src;
  const wasPlaying = els.audio && !els.audio.paused;
  const checks = await Promise.all(playlist.map(async (track) => ({
    track,
    available: await canLoadAudio(track.src)
  })));
  const available = checks.filter((item) => item.available).map((item) => item.track);
  activePlaylist = available.length ? available : playlist.slice(0, 1);
  const currentIndex = activePlaylist.findIndex((track) => track.src === selectedSrc);
  currentTrackIndex = currentIndex >= 0 ? currentIndex : 0;
  if (!wasPlaying) {
    selectTrack(currentTrackIndex, { autoplay: false, announce: false });
  }
  renderQueue();
}

function canLoadAudio(src) {
  return new Promise((resolve) => {
    const probe = new Audio();
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      probe.removeAttribute("src");
      probe.load();
      resolve(value);
    };
    probe.preload = "metadata";
    probe.addEventListener("loadedmetadata", () => done(true), { once: true });
    probe.addEventListener("error", () => done(false), { once: true });
    window.setTimeout(() => done(false), 3500);
    probe.src = src;
  });
}

async function prepareAudioGraph() {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!audioContext) {
    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    analyserData = new Uint8Array(analyser.frequencyBinCount);
  }
  if (!mediaSource) {
    mediaSource = audioContext.createMediaElementSource(els.audio);
    mediaSource.connect(analyser);
    analyser.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
}

function updateProgress() {
  if (!els.audio) return;
  const duration = els.audio.duration;
  if (Number.isFinite(duration) && duration > 0) {
    els.progressRange.value = Math.round((els.audio.currentTime / duration) * 1000);
    els.duration.textContent = formatTime(duration);
  } else {
    els.progressRange.value = 0;
  }
  els.currentTime.textContent = formatTime(els.audio.currentTime);
}

function updateStatus(status) {
  if (!els.audioStatus) return;
  els.audioStatus.textContent = status;
}

function updateLyricPulse() {
  if (!els.audio || !els.lyrics.length) return;
  const current = els.audio.currentTime || 0;
  let nextIndex = 0;
  lyricTimes.forEach((time, index) => {
    if (current >= time) nextIndex = index;
  });
  if (nextIndex === activeLyricIndex) return;
  activeLyricIndex = nextIndex;
  els.lyrics.forEach((line, index) => line.classList.toggle("is-active", index === activeLyricIndex));
}

function startVisualizer() {
  cancelAnimationFrame(visualizerFrame);
  drawVisualizer();
}

function drawVisualizer() {
  const canvas = els.visualizerCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (analyser && analyserData && !els.audio.paused) {
    analyser.getByteFrequencyData(analyserData);
  }

  const bars = analyserData || new Uint8Array(52).map((_, index) => 80 + Math.sin(Date.now() / 300 + index) * 35);
  const gap = 5;
  const barWidth = width / bars.length - gap;
  const accent = getCss("--accent");
  const accentTwo = getCss("--accent-2");
  const accentThree = getCss("--accent-3");

  for (let index = 0; index < bars.length; index += 1) {
    const value = bars[index] || 18;
    const barHeight = Math.max(10, (value / 255) * (height - 30));
    const x = index * (barWidth + gap);
    const y = height - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, height);
    gradient.addColorStop(0, accentThree);
    gradient.addColorStop(0.45, accent);
    gradient.addColorStop(1, accentTwo);
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, Math.max(2, barWidth), barHeight, 9);
    ctx.fill();
  }

  if (!els.audio.paused) {
    visualizerFrame = requestAnimationFrame(drawVisualizer);
  }
}

function drawIdleVisualizer() {
  drawVisualizer();
  if (!els.audio || els.audio.paused) {
    setTimeout(drawIdleVisualizer, 900);
  }
}

function wireWishTools() {
  $$("[data-generate-wish]").forEach((button) => {
    button.addEventListener("click", () => generateWish());
  });

  $$("[data-copy-wish]").forEach((button) => {
    button.addEventListener("click", async () => {
      const wish = els.wishOutput.textContent.trim();
      const copied = await copyText(wish);
      toast(copied ? "Wish copied" : "Wish ready", copied ? "Paste it wherever the birthday energy is needed." : wish);
    });
  });

  $$("[data-open-wish]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof els.wishDialog.showModal === "function") {
        els.wishDialog.showModal();
      } else {
        toast("Private wish", "Your browser does not support dialog popups.");
      }
    });
  });

  $("[data-launch-wish]")?.addEventListener("click", () => {
    const wish = cleanText(els.privateWish.value, "A silent birthday wish", 180);
    els.privateWish.value = "";
    els.wishDialog.close();
    fireworksShow(4);
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.25, 160);
    toast("Wish launched", wish);
  });
}

function generateWish() {
  const name = state.recipient || defaults.recipient;
  const wish = wishes[Math.floor(Math.random() * wishes.length)].replace("your", `${name}'s`);
  typeText(els.wishOutput, wish, 14);
  burstConfetti(window.innerWidth * 0.24, window.innerHeight * 0.42, 60);
}

function typeText(node, text, speed) {
  let index = 0;
  node.textContent = "";
  const tick = () => {
    node.textContent += text[index] || "";
    index += 1;
    if (index < text.length) {
      window.setTimeout(tick, speed);
    }
  };
  tick();
}

function wireCake() {
  $$("[data-candle]").forEach((candle) => {
    candle.addEventListener("click", () => {
      candle.classList.add("is-out");
      burstConfetti(window.innerWidth * 0.58, window.innerHeight * 0.45, 22);
      if ($$("[data-candle]").every((item) => item.classList.contains("is-out"))) {
        fireworksShow(5);
        toast("Candles out", "The birthday wish is officially airborne.");
      }
    });
  });

  $("[data-light-candles]")?.addEventListener("click", relightCandles);
  $("[data-fireworks]")?.addEventListener("click", () => fireworksShow(4));
}

function relightCandles() {
  $$("[data-candle]").forEach((candle) => candle.classList.remove("is-out"));
  toast("Candles relit", "Round two is ready.");
}

function wirePhotoLab() {
  if (!els.dropZone || !els.photoInput) return;

  ["dragenter", "dragover"].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, () => {
      els.dropZone.classList.remove("is-dragging");
    });
  });

  els.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    addPhotos(event.dataTransfer.files);
  });

  els.photoInput.addEventListener("change", (event) => {
    addPhotos(event.target.files);
    event.target.value = "";
  });
}

function addPhotos(fileList) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;

  const slots = Math.max(0, PHOTO_LIMIT - state.photos.length);
  files.slice(0, slots).forEach((file) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.photos.unshift({
        id: createId(),
        name: file.name,
        src: reader.result
      });
      state.photos = state.photos.slice(0, PHOTO_LIMIT);
      saveState();
      renderPhotos();
    });
    reader.readAsDataURL(file);
  });

  if (files.length > slots) {
    toast("Photo limit", `Only ${PHOTO_LIMIT} photos are kept so the page stays fast.`);
  } else {
    toast("Photos added", "The memory wall just got brighter.");
  }
}

function renderPhotos() {
  if (!els.photoGrid) return;
  els.photoGrid.innerHTML = "";
  if (!state.photos.length) {
    ["Alveera's smile", "Cake lights", "Birthday crew"].forEach((label) => {
      const tile = document.createElement("div");
      tile.className = "photo-tile photo-tile--placeholder";
      tile.textContent = label;
      els.photoGrid.append(tile);
    });
    return;
  }

  state.photos.forEach((photo) => {
    const tile = document.createElement("div");
    tile.className = "photo-tile";

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.name || "Birthday photo";

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Remove photo");
    button.textContent = "x";
    button.addEventListener("click", () => {
      state.photos = state.photos.filter((item) => item.id !== photo.id);
      saveState();
      renderPhotos();
    });

    tile.append(image, button);
    els.photoGrid.append(tile);
  });
}

function wireGiftVault() {
  $$("[data-gift]").forEach((gift) => {
    gift.addEventListener("click", () => {
      const wasOpen = gift.classList.toggle("is-open");
      if (wasOpen) {
        burstConfetti(gift.getBoundingClientRect().left + gift.offsetWidth / 2, gift.getBoundingClientRect().top + 100, 65);
        toast("Gift unlocked", gift.dataset.gift);
      }
    });
  });

  $("[data-reset-gifts]")?.addEventListener("click", resetGifts);
}

function resetGifts() {
  $$("[data-gift]").forEach((gift) => gift.classList.remove("is-open"));
  toast("Gift vault reset", "All boxes are closed again.");
}

function wireGuestbook() {
  els.guestForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(els.guestForm);
    const message = cleanText(formData.get("guestMessage"), "", 220);
    if (!message) {
      toast("Message needed", "Write a note first.");
      return;
    }
    state.notes.unshift({
      id: createId(),
      name: cleanText(formData.get("guestName"), "Friend", 24),
      mood: cleanText(formData.get("mood"), "glowing", 24),
      message,
      created: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    });
    state.notes = state.notes.slice(0, 12);
    saveState();
    renderGuestNotes();
    els.guestForm.reset();
    els.guestForm.elements.mood.value = "glowing";
    burstConfetti(window.innerWidth * 0.78, window.innerHeight * 0.55, 45);
  });
}

function renderGuestNotes() {
  if (!els.guestNotes) return;
  els.guestNotes.innerHTML = "";

  state.notes.forEach((note) => {
    const item = document.createElement("article");
    item.className = "note";

    const top = document.createElement("div");
    top.className = "note__top";

    const name = document.createElement("strong");
    name.textContent = note.name;

    const mood = document.createElement("small");
    mood.textContent = note.mood;

    const message = document.createElement("p");
    message.textContent = note.message;

    const time = document.createElement("small");
    time.textContent = note.created;

    top.append(name, mood);
    item.append(top, message, time);
    els.guestNotes.append(item);
  });
}

function wireSparkGame() {
  const canvas = els.gameCanvas;
  if (!canvas) return;

  canvas.addEventListener("click", (event) => {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const hitIndex = gameParticles.findIndex((spark) => distance(x, y, spark.x, spark.y) < spark.radius + 24);
    if (hitIndex !== -1) {
      const [hit] = gameParticles.splice(hitIndex, 1);
      gameScore += Math.ceil(hit.radius);
      els.gameScore.textContent = String(gameScore);
      burstConfetti(event.clientX, event.clientY, 18);
    }
  });

  $("[data-start-game]")?.addEventListener("click", () => {
    if (!gameRunning) {
      gameRunning = true;
      gameParticles = [];
      lastSparkAt = performance.now();
      animateGame();
      toast("Game started", "Catch sparks before they leave the stage.");
    }
  });

  $("[data-reset-game]")?.addEventListener("click", () => {
    gameScore = 0;
    els.gameScore.textContent = "0";
    gameParticles = [];
    drawGame();
  });

  drawGame();
}

function animateGame(now = performance.now()) {
  if (!gameRunning) return;
  if (now - lastSparkAt > 520) {
    lastSparkAt = now;
    gameParticles.push(newSpark());
  }
  gameParticles.forEach((spark) => {
    spark.y += spark.speed;
    spark.spin += spark.spinSpeed;
  });
  gameParticles = gameParticles.filter((spark) => spark.y < els.gameCanvas.height + 40);
  drawGame();
  gameFrame = requestAnimationFrame(animateGame);
}

function drawGame() {
  const canvas = els.gameCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#111017");
  bg.addColorStop(0.5, "#182a2d");
  bg.addColorStop(1, "#261829");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 70; i += 1) {
    const x = (i * 97) % canvas.width;
    const y = (i * 53) % canvas.height;
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 209, 102, 0.5)" : "rgba(255,255,255,0.18)";
    ctx.fillRect(x, y, 2, 2);
  }

  gameParticles.forEach((spark) => drawSpark(ctx, spark));
}

function newSpark() {
  return {
    x: random(28, els.gameCanvas.width - 28),
    y: -32,
    radius: random(13, 25),
    speed: random(1.8, 4.2),
    spin: random(0, Math.PI),
    spinSpeed: random(-0.06, 0.06),
    color: [getCss("--accent"), getCss("--accent-2"), getCss("--accent-3"), getCss("--accent-4")][Math.floor(Math.random() * 4)]
  };
}

function drawSpark(ctx, spark) {
  ctx.save();
  ctx.translate(spark.x, spark.y);
  ctx.rotate(spark.spin);
  ctx.fillStyle = spark.color;
  ctx.shadowColor = spark.color;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? spark.radius : spark.radius * 0.42;
    const angle = (Math.PI * 2 * i) / 10;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function setupCanvases() {
  resizeFxCanvases();
  window.addEventListener("resize", resizeFxCanvases, { passive: true });
}

function resizeFxCanvases() {
  [els.confettiCanvas, els.fireworkCanvas].forEach((canvas) => {
    if (!canvas) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * scale);
    canvas.height = Math.floor(window.innerHeight * scale);
    canvas.dataset.scale = String(scale);
  });
}

function burstConfetti(x, y, amount = 120) {
  const canvas = els.confettiCanvas;
  if (!canvas) return;
  const scale = Number(canvas.dataset.scale || 1);
  const colors = [getCss("--accent"), getCss("--accent-2"), getCss("--accent-3"), getCss("--accent-4"), "#ffffff"];

  for (let i = 0; i < amount; i += 1) {
    const angle = random(-Math.PI, 0);
    const speed = random(3, 12);
    confettiParticles.push({
      x: x * scale,
      y: y * scale,
      vx: Math.cos(angle) * speed * scale,
      vy: Math.sin(angle) * speed * scale - random(2, 8),
      gravity: random(0.12, 0.28) * scale,
      size: random(5, 12) * scale,
      rotation: random(0, Math.PI * 2),
      spin: random(-0.18, 0.18),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: random(70, 130)
    });
  }
  animateConfetti();
}

function animateConfetti() {
  const canvas = els.confettiCanvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiParticles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rotation += p.spin;
    p.life -= 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
    ctx.restore();
  });
  confettiParticles = confettiParticles.filter((p) => p.life > 0 && p.y < canvas.height + 60);
  if (confettiParticles.length) requestAnimationFrame(animateConfetti);
}

function fireworksShow(count = 3) {
  const canvas = els.fireworkCanvas;
  if (!canvas) return;
  const scale = Number(canvas.dataset.scale || 1);
  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => {
      createFirework(random(canvas.width * 0.18, canvas.width * 0.82), random(canvas.height * 0.16, canvas.height * 0.46), scale);
      if (!fireworksAnimating) animateFireworks();
    }, i * 280);
  }
}

function createFirework(x, y, scale) {
  const colors = [getCss("--accent"), getCss("--accent-2"), getCss("--accent-3"), getCss("--accent-4"), "#ffffff"];
  for (let i = 0; i < 72; i += 1) {
    const angle = (Math.PI * 2 * i) / 72;
    const speed = random(2.1, 7.2) * scale;
    fireworkParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.04 * scale,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: random(55, 95),
      size: random(1.6, 3.8) * scale
    });
  }
}

function animateFireworks() {
  const canvas = els.fireworkCanvas;
  const ctx = canvas.getContext("2d");
  fireworksAnimating = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  fireworkParticles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.988;
    p.vy *= 0.988;
    p.life -= 1;
    ctx.globalAlpha = Math.max(0, p.life / 95);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  fireworkParticles = fireworkParticles.filter((p) => p.life > 0);
  if (fireworkParticles.length) {
    requestAnimationFrame(animateFireworks);
  } else {
    fireworksAnimating = false;
  }
}

function updateCountdown() {
  if (!els.days) return;
  if (!state.birthday) {
    els.countdownLabel.textContent = "Birthday mode today";
    els.days.textContent = "00";
    els.hours.textContent = "00";
    els.minutes.textContent = "00";
    els.seconds.textContent = "00";
    return;
  }

  const now = new Date();
  const selected = new Date(`${state.birthday}T00:00:00`);
  const isBirthdayToday = selected.getMonth() === now.getMonth() && selected.getDate() === now.getDate();
  if (isBirthdayToday) {
    els.countdownLabel.textContent = "Birthday mode today";
    els.days.textContent = "00";
    els.hours.textContent = "00";
    els.minutes.textContent = "00";
    els.seconds.textContent = "00";
    return;
  }

  let target = new Date(now.getFullYear(), selected.getMonth(), selected.getDate(), 0, 0, 0);
  if (target < now) {
    target = new Date(now.getFullYear() + 1, selected.getMonth(), selected.getDate(), 0, 0, 0);
  }
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  els.countdownLabel.textContent = days === 0 ? "Birthday mode today" : `Next birthday in ${days} days`;
  els.days.textContent = String(days).padStart(2, "0");
  els.hours.textContent = String(hours).padStart(2, "0");
  els.minutes.textContent = String(minutes).padStart(2, "0");
  els.seconds.textContent = String(seconds).padStart(2, "0");
}

function toast(title, detail = "") {
  if (!els.toastRegion) return;
  const node = document.createElement("div");
  node.className = "toast";
  const strong = document.createElement("strong");
  strong.textContent = title;
  const span = document.createElement("span");
  span.textContent = detail;
  node.append(strong, span);
  els.toastRegion.append(node);
  setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateY(0.35rem)";
    setTimeout(() => node.remove(), 240);
  }, 3600);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function cleanText(value, fallback, maxLength) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return (text || fallback).slice(0, maxLength);
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function getCss(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim()
    || getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(gameFrame);
  cancelAnimationFrame(visualizerFrame);
}); 
