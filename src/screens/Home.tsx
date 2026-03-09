import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Play } from 'lucide-react';

export default function Home({ setRoom, userName, setUserName }: any) {
  const { socket } = useSocket();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    socket?.emit('createRoom', { userName }, (response: any) => {
      if (response.success) {
        setRoom(response.room);
      } else {
        setError(response.message);
      }
    });
  };

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomIdInput.trim()) {
      setError('Please enter a room code');
      return;
    }
    socket?.emit('joinRoom', { roomId: roomIdInput.toUpperCase(), userName }, (response: any) => {
      if (response.success) {
        setRoom(response.room);
      } else {
        setError(response.message);
      }
    });
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl shadow-2xl">
        <h1 className="text-4xl font-black text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">ArcaneEXAMS</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
              placeholder="Enter your name..."
            />
          </div>

          {error && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</div>}

          <div className="pt-4 space-y-4">
            <button
              onClick={handleCreateRoom}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
            >
              <Users size={20} />
              Create New Room (Host)
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-700/50"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-slate-700/50"></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="flex-1 bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase transition-all placeholder:text-slate-500 text-center sm:text-left tracking-widest"
                placeholder="ROOM CODE"
              />
              <button
                onClick={handleJoinRoom}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
              >
                <Play size={20} />
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
