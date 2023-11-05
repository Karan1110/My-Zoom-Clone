// Initialize socket.io
const socket = io("/")

// Get a reference to the video grid
const videoGrid = document.getElementById("video-grid")

// Initialize a Peer object for WebRTC communication
const myPeer = new Peer(undefined, {
  host: "/", // The host should be the server where your Peer server is running
  port: "42070", // The port for the Peer server
})

// Create a video element for the local user's video
const myVideo = document.createElement("video")
myVideo.muted = true // Mute the local user's video

// Get a reference to the microphone button and add a click event listener
const mic = document.getElementById("mic")
mic.addEventListener("click", () => {
  myVideo.muted = !myVideo.muted // Toggle audio mute/unmute
})

// Initialize an empty object to store connected peers
const peers = {}

// Get user media (audio and video)
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    // Add the local user's video stream to the grid
    addVideoStream(myVideo, stream)

    // Handle incoming calls
    myPeer.on("call", (call) => {
      call.answer(stream) // Answer the call with the local stream
      const video = document.createElement("video")
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream)
      })
    })

    // Listen for user-connected events
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream)
    })
  })

// Listen for cam-off events from other users
socket.on("cam-off", (userId) => {
  const userCam = document.getElementById(`video-${userId}`)
  // Replace the video element with a message indicating the camera is off
  if (userCam) {
    userCam.replaceWith(
      (document.createElement("p").textContent = `${userId} cam off`)
    )
  }
})

// Listen for user-disconnected events
socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close() // Close the Peer connection
  }
})

// Handle the "open" event from myPeer
myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id) // Emit a "join-room" event with the room ID and peer ID
})

let userId // Variable to store the user's ID

// Function to connect to a new user
function connectToNewUser(userId, stream) {
  userId = userId
  const call = myPeer.call(userId, stream) // Call the new user with the local stream
  const video = document.createElement("video")
  video.id = `video-${userId}`
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream)
  })
  call.on("close", () => {
    video.style.display = "none"
    video.remove()
  })

  peers[userId] = call // Store the call object in the peers object
}

// Get a reference to the camera button and add a click event listener
const cam = document.getElementById("cam")
cam.addEventListener("click", () => {
  socket.emit("cam-off", userId) // Emit a "cam-off" event with the user's ID
})

// Function to add a video stream to the grid
function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener("loadedmetadata", () => {
    video.play()
  })
  videoGrid.append(video)
}
