const audioSourcesList = document.getElementById("audio-sources-list");
const selectButton = document.getElementById("select-button");
let selectedDevice = null;

// Fetch audio devices from main process
window.api.getAudioDevices().then((devices) => {
  if (devices.length === 0) {
    audioSourcesList.innerHTML = "<p>No audio devices found.</p>";
    return;
  }

  devices.forEach((device) => {
    const listItem = document.createElement("li");
    listItem.textContent = device;
    listItem.addEventListener("click", () => {
      document.querySelectorAll("li").forEach((item) => item.classList.remove("selected"));
      listItem.classList.add("selected");
      selectedDevice = device;
      selectButton.disabled = false; // Enable the select button
    });
    audioSourcesList.appendChild(listItem);
  });
});

// Handle selection
selectButton.addEventListener("click", () => {
  if (selectedDevice) {
    console.log("Selected device:", selectedDevice);
    // You can send the selected device back to the main process or renderer here
    window.close(); // Close the audio sources window
  }
});
