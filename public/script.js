const socket = io("/")
const videoGrid = document.getElementById("video-grid")
const myPeer = new Peer(undefined, {
  host: "/",
  port: "42070",
})
const myVideo = document.createElement("video")
myVideo.title = "titlo"
myVideo.muted = true
const peers = {}
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    if (!myVideo.muted) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = false
      })
    }
    stream.getAudioTracks().forEach((track) => {
      track.enabled = false
    })
    addVideoStream(myVideo, stream)

    myPeer.on("call", (call) => {
      call.answer(stream)
      const video = document.createElement("video")
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream)
      })
    })

    socket.on("user-connected", (userId) => {
      // user is joining`
      setTimeout(() => {
        // user joined
        connectToNewUser(userId, stream)
      }, 2000)
    })
  })

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement("video")
  video.title = "titlo"
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream)
  })
  call.on("close", () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener("loadedmetadata", () => {
    video.play()
  })
  videoGrid.append(video)
}
