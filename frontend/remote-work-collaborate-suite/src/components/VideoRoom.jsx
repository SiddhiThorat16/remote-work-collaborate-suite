import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function VideoRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const localVideoRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const socketRef = useRef();

  useEffect(() => {
    let isMounted = true;
    socketRef.current = io("http://localhost:5055");

    async function getLocalStream() {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        alert("Could not access camera or microphone.");
        return null;
      }
    }

    (async () => {
      const stream = await getLocalStream();
      if (!stream) return;

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play().catch(() => {});
      }

      socketRef.current.emit("join-room", roomId);

      socketRef.current.on("all-users", (users) => {
        if (!isMounted) return;
        users.forEach(createOffer);
      });

      socketRef.current.on("user-joined", createOffer);

      socketRef.current.on("offer", async ({ sdp, caller }) => {
        if (!isMounted) return;
        const pc = createPeerConnection(caller);
        await pc.setRemoteDescription(new window.RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current.emit("answer", { target: caller, sdp: pc.localDescription });
      });

      socketRef.current.on("answer", async ({ sdp, caller }) => {
        if (!isMounted) return;
        const pc = peersRef.current[caller];
        if (!pc) return;
        await pc.setRemoteDescription(new window.RTCSessionDescription(sdp));
      });

      socketRef.current.on("ice-candidate", async ({ candidate, from }) => {
        if (!isMounted) return;
        const pc = peersRef.current[from];
        if (!pc) return;
        try {
          await pc.addIceCandidate(new window.RTCIceCandidate(candidate));
        } catch {}
      });

      socketRef.current.on("user-left", cleanupPeer);
    })();

    return () => {
      isMounted = false;
      cleanupAll();
    };
  }, [roomId]);

  function createPeerConnection(peerId) {
    if (peersRef.current[peerId]) return peersRef.current[peerId];
    const pc = new window.RTCPeerConnection(ICE_SERVERS);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }
    pc.ontrack = e => {
      const [stream] = e.streams;
      setRemoteStreams(prev => prev.find(s => s.id === peerId) ? prev : [...prev, { id: peerId, stream }]);
    };
    pc.onicecandidate = event => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { target: peerId, candidate: event.candidate });
      }
    };
    peersRef.current[peerId] = pc;
    return pc;
  }

  async function createOffer(peerId) {
    const pc = createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("offer", { target: peerId, sdp: pc.localDescription });
  }

  function cleanupPeer(peerId) {
    const pc = peersRef.current[peerId];
    if (pc) { try { pc.close(); } catch {} delete peersRef.current[peerId]; }
    setRemoteStreams(prev => prev.filter(s => s.id !== peerId));
  }

  function cleanupAll() {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    Object.keys(peersRef.current).forEach(cleanupPeer);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setRemoteStreams([]);
  }

  function toggleMic() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !micEnabled);
    setMicEnabled(prev => !prev);
  }

  function toggleCam() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !camEnabled);
    setCamEnabled(prev => !prev);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-pink-200 flex flex-col items-center py-10 px-2">
      <div className="max-w-7xl w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
          <h2 className="text-3xl font-extrabold text-purple-700 mb-3 text-center md:text-left">
            Video Meeting Room <span className="text-sm font-semibold text-purple-400 ml-2">{roomId}</span>
          </h2>
          <div className="flex gap-3 items-center justify-center">
            <button
              onClick={toggleMic}
              className={`px-5 py-2 rounded-lg font-semibold border transition-all duration-150 ${micEnabled ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-red-100 border-red-400 text-red-700'} hover:bg-purple-200`}
            >{micEnabled ? "Mute Mic" : "Unmute Mic"}</button>
            <button
              onClick={toggleCam}
              className={`px-5 py-2 rounded-lg font-semibold border transition-all duration-150 ${camEnabled ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600'} hover:bg-pink-200`}
            >{camEnabled ? "Turn Camera Off" : "Turn Camera On"}</button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-lg font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-150"
            >Leave</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border-2 border-purple-200 bg-white py-3 px-3 shadow-lg flex flex-col items-center">
            <span className="font-bold text-purple-400 text-lg mb-2">You</span>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              className="rounded-xl border border-gray-200 bg-black w-full max-w-xs mx-auto aspect-video"
              muted
            />
          </div>
          {remoteStreams.map(r => (
            <div key={r.id} className="rounded-2xl border-2 border-pink-200 bg-white py-3 px-3 shadow-lg flex flex-col items-center">
              <span className="font-bold text-pink-400 text-lg mb-2">Peer: {r.id.slice(0, 8)}...</span>
              <video
                autoPlay
                playsInline
                ref={el => { if (el && r.stream) el.srcObject = r.stream; }}
                className="rounded-xl border border-gray-200 bg-black w-full max-w-xs mx-auto aspect-video"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
