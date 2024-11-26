const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");


class UdpBroadcast {
  constructor(broadcastIp = "172.17.3.255", port = 4455) {
    this.broadcastIp = broadcastIp;
    this.port = port;
    this.ffmpegProcess = null;
    
  }


  startBroadcast(filePath) {
    let isBroadcasting = false;
    
    if (isBroadcasting) {
      console.log("Broadcast is already running.");
      return;
    }
    console.log(`Starting RTP over UDP broadcast for ${filePath} to ${this.broadcastIp}:${this.port}`);

    this.ffmpegProcess = spawn(ffmpegPath, [
      "-re", "-stream_loop", "-1",   // Real-time input
      "-i", filePath,         // Input file
      "-ac", "1",             // Mono audio
      "-ar", "16000",         // Sample rate: 16 kHz
      "-acodec", "g722",      // Audio codec: G.722
      "-f", "rtp",            // RTP output format
      `udp://${this.broadcastIp}:${this.port}`, // Broadcast address for RTP over UDP
    ]);
    isBroadcasting = true; // Mark broadcast as active
    this.ffmpegProcess.on("close", () => {
      isBroadcasting = false; // Reset state when process exits
    });
    // Capture FFmpeg stdout and stderr for debugging
    this.ffmpegProcess.stdout.on("data", (data) => console.log(`ffmpeg output: ${data}`));
    this.ffmpegProcess.stderr.on("data", (data) => {
      const message = data.toString();
      if (!message.includes("frame size not set")) { // Suppress non-critical warning
        console.error(`ffmpeg error: ${message}`);
      }
    });

    // Handle process close and exit gracefully
    this.ffmpegProcess.on("close", (code, signal) => {
      if (signal === "SIGINT") {
        console.log("Broadcast stopped by user (SIGINT).");
      } else if (code === 0) {
        console.log("Broadcast finished successfully.");
      } else {
        console.error(`Broadcast process exited with code ${code}.`);
      }
    });
  }

  stopBroadcast() {
    if (this.ffmpegProcess) {
      console.log("Stopping broadcast...");
      this.ffmpegProcess.kill(); // Kill the FFmpeg process
      this.ffmpegProcess = null; // Clear the reference to the process
    } else {
      console.error("No active broadcast to stop.");
    }
  }
}  

module.exports = UdpBroadcast;
