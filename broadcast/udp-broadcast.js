const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

class UdpBroadcast {
  constructor(broadcastIp = "172.17.3.255", port = 5555) {
    this.broadcastIp = broadcastIp;
    this.port = port;
    this.ffmpegProcess = null;
    
  }

  // // Generate the SDP file needed for receivers to interpret the stream
  // generateSdpFile() {
  //   const sdpContent = `
  // v=0
  // o=- 0 0 IN IP4 ${this.broadcastIp}
  // s=Audio Broadcast
  // c=IN IP4 ${this.broadcastIp}
  // t=0 0
  // m=audio ${this.port} RTP/AVP 9
  // b=AS:128
  // a=rtpmap:9 G722/16000/1
  // `.trim();
  //   fs.writeFileSync(this.sdpFilePath, sdpContent);
  //   console.log(`Generated SDP file at ${this.sdpFilePath}:\n${sdpContent}`);
  // }
  

  startBroadcast(filePath) {
    // Generate SDP file before starting the broadcast
    // this.generateSdpFile();

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
      console.log("Stopping RTP broadcast.");
      this.ffmpegProcess.kill("SIGINT");
      this.ffmpegProcess = null;
    }
  }
}

module.exports = UdpBroadcast;
