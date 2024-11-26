// =========================
// Global Variables
// =========================
let audioContext, analyser, dataArray, animationId;
let isPlaying = false; // Play-pause state
const playPauseButton = document.getElementById("play-pause");
const nowStreamingSection = document.getElementById("now-streaming");
const fileButton = document.getElementById("file-button");
const computerButton = document.getElementById("computer-button");

// Canvas and Context for Visualizer
const canvas = document.getElementById("audio-visualizer");
const ctx = canvas.getContext("2d");

// =========================
// Utility Functions
// =========================

/**
 * Dynamically resize the canvas to match its CSS dimensions.
 */
const resizeCanvas = () => {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
};
resizeCanvas(); // Call on initialization

/**
 * Create and initialize the audio element with the default source.
 */
const initializeAudioElement = () => {
  const defaultAudioPath = "../../assets/Animal_I_Have_Become_1716571270259703154.wav";
  const audioPath = selectedFilePath ? `file://${selectedFilePath}` : defaultAudioPath;

  audioElement = new Audio(audioPath); // Use selected file or default
  audioElement.currentTime = 0; // Start at the beginning
};

/**
 * Set up the audio context and connect the audio element to an analyser node.
 */
const setupAudioContext = () => {
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256; // Defines the resolution of frequency data

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Connect the audio element to the analyser and the audio destination
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

    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear the canvas for the new frame

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

// =========================
// Button Handlers
// =========================

/**
 * Handles the Play/Pause button click.
 */
playPauseButton.addEventListener("click", async () => {
  const ip = document.getElementById("ip").value;
  const port = parseInt(document.getElementById("port").value, 10);

  if (!ip || !port) {
    alert("Please enter a valid IP and port.");
    return;
  }

  if (isPlaying) {
    // Stop audio playback and broadcast
    try {
      audioElement.pause();
      audioElement.currentTime = 0; // Reset audio to the start

      if (audioContext && audioContext.state === "running") {
        await audioContext.close(); // Close the audio context
      }

      if (animationId) {
        cancelAnimationFrame(animationId); // Stop the animation loop
        animationId = null;
      }

      if (window.api.pauseBroadcast) {
        await window.api.stopBroadcast();
        console.log("Broadcast stopped.");
      }

      playPauseButton.classList.remove("paused");
      console.log("Playback and broadcast stopped.");
    } catch (error) {
      console.error("Error stopping playback or broadcast:", error);
    }

    isPlaying = false;
  } else {
    // Start audio playback and broadcast
    try {
      initializeAudioElement(); // Reset audio element
      console.log("This is what we are trying to push to startBroadcast: ", selectedFilePath)
      await window.api.startBroadcast({ ip, port, filePath: selectedFilePath, });
      console.log("Broadcast started.");

      setupAudioContext(); // Reinitialize the audio context
      visualizeAudio(); // Restart the visualizer

      audioElement.currentTime = 0; // Reset audio to the start
      await audioElement.play();

      playPauseButton.classList.add("paused");
      console.log("Playback and broadcast started.");
    } catch (error) {
      console.error("Error starting playback or broadcast:", error);
    }

    isPlaying = true;
  }
});
/**
 * Handles the File button click.
 */
fileButton.addEventListener("click", async () => {
  const filePath = await window.api.selectAudioFile();

  if (filePath) {
    selectedFilePath = filePath; // Save the selected file path globally
    const fileName = filePath.split("\\").pop(); // Extract file name for display

    nowStreamingSection.innerHTML = `
      <p>Now Playing:</p>
      <p>${fileName}</p>
    `;

    console.log("Selected file:", filePath);

    // Dynamically set the new audio source
    audioElement.src = `file://${filePath}`;
    audioElement.load(); // Reload the audio element with the new file
  } else {
    console.log("File selection canceled.");
  }
});


/**
 * Handles the computer button click.
 */
computerButton.addEventListener("click", async () => {
  try {
    await window.api.openAudioSourcesWindow(); // Call the IPC handler
    console.log("Audio sources window opened successfully.");
  } catch (error) {
    console.error("Error opening audio sources window:", error);
  }
});


// =========================
// Initialize Visualizer
// =========================
visualizeAudio();
