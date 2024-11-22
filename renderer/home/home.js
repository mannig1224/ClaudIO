const audioElement = new Audio("../../assets/Animal_I_Have_Become_1716571270259703154.wav");

// Variables for audio context and visualizer
let audioContext, analyser, dataArray, animationId;

// Get the canvas and context for rendering the visualizer
const canvas = document.getElementById("audio-visualizer");
const ctx = canvas.getContext("2d");

// Dynamically resize the canvas to match its CSS dimensions
const resizeCanvas = () => {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
};

resizeCanvas(); // Call on initialization

/**
 * Set up the audio context and connect the audio element to an analyser node.
 */
const setupAudioContext = () => {
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256; // Defines the resolution of frequency data

  // Create a data array to hold frequency data
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Connect the audio element to the analyser node and audio destination
  const source = audioContext.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
};

/**
 * Visualize the audio data dynamically.
 * Includes both static default squares and dynamic frequency-based squares.
 */
const visualizeAudio = () => {
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const SQUARE_SIZE = 4;
  const MAX_SQUARES = 60;
  const GAP = 2;
  const BAR_WIDTH = 8;
  const BAR_SPACING = 3;
  const REFLECTION_OPACITY = 0.3;

  /**
   * Draws the static visualizer squares that remain visible even if audio is not playing.
   */
  const drawStaticVisualizer = () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear the canvas
    const barCount = Math.floor(WIDTH / (BAR_WIDTH + BAR_SPACING));

    for (let i = 0; i < barCount; i++) {
      const x = i * (BAR_WIDTH + BAR_SPACING);

      // Draw the top static square
      const y = HEIGHT / 2 - SQUARE_SIZE - GAP;
      ctx.fillStyle = `rgb(50, 100, 200)`;
      ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);

      // Draw the reflected static square
      const reflectionY = HEIGHT / 2 + SQUARE_SIZE + GAP;
      ctx.fillStyle = `rgba(50, 100, 200, ${REFLECTION_OPACITY})`;
      ctx.fillRect(x, reflectionY, SQUARE_SIZE, SQUARE_SIZE);
    }
  };

  /**
   * Dynamically draws the audio-based visualizer when the audio is playing.
   */
  const drawDynamicVisualizer = () => {
    animationId = requestAnimationFrame(drawDynamicVisualizer);

    // Fetch the frequency data
    analyser.getByteFrequencyData(dataArray);

    // Clear the canvas for new frame
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const barCount = Math.floor(WIDTH / (BAR_WIDTH + BAR_SPACING));
    const scaledData = dataArray.slice(0, barCount);

    for (let i = 0; i < barCount; i++) {
      const barHeight = scaledData[i] / 2;
      const squareCount = Math.max(1, Math.floor((barHeight / 256) * MAX_SQUARES)); // At least one square visible

      for (let j = 0; j < squareCount; j++) {
        const x = i * (BAR_WIDTH + BAR_SPACING);
        const y = HEIGHT / 2 - (j + 1) * (SQUARE_SIZE + GAP);

        // Draw the top dynamic square
        ctx.fillStyle = `rgb(50, ${100 + j * 10}, 200)`;
        ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);

        // Draw the reflected dynamic square
        const reflectionY = HEIGHT / 2 + (j + 1) * (SQUARE_SIZE + GAP);
        ctx.fillStyle = `rgba(50, ${100 + j * 10}, 200, ${REFLECTION_OPACITY})`;
        ctx.fillRect(x, reflectionY, SQUARE_SIZE, SQUARE_SIZE);
      }
    }
  };

  drawStaticVisualizer(); // Always show static squares

  if (audioContext && audioContext.state === "running") {
    drawDynamicVisualizer(); // Start dynamic visualization if audio is playing
  }
};

// Render static visualizer initially
visualizeAudio();

// Play-pause button logic
const playPauseButton = document.getElementById("play-pause");
let isPlaying = false;

playPauseButton.addEventListener("click", async () => {
  const ip = document.getElementById("ip").value;
  const port = parseInt(document.getElementById("port").value, 10);

  if (!ip || !port) {
    alert("Please enter a valid IP and port.");
    return;
  }

  if (isPlaying) {
    // Stop audio playback and visualizer
    await window.api.stopBroadcast();
    audioElement.pause();
    console.log("Audio playback stopped.");

    if (animationId) cancelAnimationFrame(animationId);
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    playPauseButton.classList.remove("paused");
  } else {
    // Start audio playback and visualizer
    await window.api.startBroadcast({ ip, port });

    try {
      audioElement.currentTime = 0;
      await audioElement.play();
      console.log("Audio playback started.");

      if (!audioContext) {
        setupAudioContext();
        visualizeAudio();
      } else if (audioContext.state === "suspended") {
        audioContext.resume();
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }

    playPauseButton.classList.add("paused");
  }

  isPlaying = !isPlaying; // Toggle play state
});
