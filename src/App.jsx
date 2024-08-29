import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';

const socket = io(import.meta.env.VITE_BACKEND_SERVER);

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerInstance = useRef();

  useEffect(() => {
    // PeerJS setup
    const peer = new Peer();
    peerInstance.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
    });

    peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localVideoRef.current.srcObject = stream;
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            remoteVideoRef.current.srcObject = remoteStream;
          });
        });
    });

    // Socket.io message handling
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

  }, []);

  const sendMessage = () => {
    socket.emit('message', message);
    setMessage('');
  };

  const callPeer = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        const call = peerInstance.current.call(remotePeerId, stream);
        call.on('stream', (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
        });
      });
  };

  return (
    <div className="App">
      <h1>Simple Chat & Video App</h1>

      <div>
        <h2>Messages</h2>
        <div>
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      <div>
        <h2>PeerJS Video Call</h2>
        <p>Your ID: {peerId}</p>
        <input
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
          placeholder="Enter remote peer ID..."
        />
        <button onClick={callPeer}>Call</button>

        <div style={{ display: 'flex', marginTop: '20px' }}>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px' }} />
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', marginLeft: '20px' }} />
        </div>
      </div>
    </div>
  );
}

export default App;
