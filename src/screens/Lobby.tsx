import React, { useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Upload, Play, Copy, Check, FileText, Settings } from 'lucide-react';

const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const questions = [];
  let startIndex = 0;
  if (lines.length > 0) {
    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.startsWith('id') || firstLineLower.startsWith('question')) startIndex = 1;
  }
  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(';').map(c => c.trim());
    if (cols.length < 2) continue;
    const id = cols[0];
    const text = cols[1];
    const optionsRaw = cols[2] || '';
    const correctAnswer = cols[3] || '';
    const imageUrl = cols[4] || undefined;
    const explanation = cols[5] || '';
    const category = cols[6] || 'General';
    const difficulty = cols[7] || 'Medium';
    let options: string[] = [];
    let isEssay = false;
    if (optionsRaw.toUpperCase() === 'ESSAY' || !optionsRaw) {
      isEssay = true;
    } else {
      options = optionsRaw.includes('|') ? optionsRaw.split('|').map(o => o.trim()) : optionsRaw.split(',').map(o => o.trim());
    }
    questions.push({ id, text, options, correctAnswer, imageUrl, explanation, isEssay, category, difficulty });
  }
  return questions;
};

export default function Lobby({ room, userName }: any) {
  const { socket } = useSocket();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isHost = room.hostId === socket?.id;
  const [copied, setCopied] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  
  const [durationMinutes, setDurationMinutes] = useState(room.examData?.settings?.durationMinutes || 30);
  const [randomizeQuestions, setRandomizeQuestions] = useState(room.examData?.settings?.randomizeQuestions ?? true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        loadQuestions(text);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteSubmit = () => {
    if (pasteContent.trim()) {
      loadQuestions(pasteContent);
      setShowPaste(false);
      setPasteContent('');
    }
  };

  const loadQuestions = (text: string) => {
    const questions = parseCSV(text);
    if (questions.length === 0) {
      alert("No valid questions found. Please check the format.");
      return;
    }
    const examData = {
      questions,
      settings: {
        durationMinutes,
        randomizeQuestions
      }
    };
    socket?.emit('updateExam', { roomId: room.id, examData });
  };

  const updateSettings = (newDuration: number, newRandomize: boolean) => {
    setDurationMinutes(newDuration);
    setRandomizeQuestions(newRandomize);
    if (room.examData) {
      const examData = {
        ...room.examData,
        settings: {
          durationMinutes: newDuration,
          randomizeQuestions: newRandomize
        }
      };
      socket?.emit('updateExam', { roomId: room.id, examData });
    }
  };

  const handleStartExam = () => {
    if (!room.examData || room.examData.questions.length === 0) {
      alert('Please upload an exam first!');
      return;
    }
    socket?.emit('startExam', { roomId: room.id });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-6 rounded-3xl shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Lobby</h2>
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-600/50 w-full sm:w-auto">
                <span className="text-slate-400 text-sm whitespace-nowrap">Room Code:</span>
                <span className="font-mono font-bold text-indigo-400 tracking-wider text-lg truncate">{room.id}</span>
                <button onClick={copyRoomId} className="ml-auto sm:ml-2 text-slate-400 hover:text-white transition-colors flex-shrink-0">
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {isHost ? (
              <div className="space-y-6">
                <div className="p-6 border-2 border-dashed border-indigo-500/30 rounded-2xl text-center bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                  <Upload className="mx-auto mb-4 text-slate-400" size={32} />
                  <h3 className="text-lg font-medium mb-2">Upload Exam CSV</h3>
                  <p className="text-sm text-slate-400 mb-4">Format: ID;Question;Options;Answer;Image;Explanation;Category;Difficulty</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg"
                    >
                      Select File
                    </button>
                    <button 
                      onClick={() => setShowPaste(true)}
                      className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-white px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <FileText size={18} />
                      Paste Text
                    </button>
                  </div>
                </div>

                {showPaste && (
                  <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-600/50 shadow-inner">
                    <h4 className="font-bold mb-2 text-indigo-300">Paste CSV Content</h4>
                    <p className="text-xs text-slate-400 mb-4">Format: ID;Question;Options(separated by |);Answer;Image;Explanation;Category;Difficulty</p>
                    <textarea 
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      className="w-full h-48 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none mb-4 text-slate-300"
                      placeholder="1;What is 2+2?;A) 2|B) 3|C) 4|D) 5;C) 4;;Basic math;Math;Easy"
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <button 
                        onClick={() => { setShowPaste(false); setPasteContent(''); }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handlePasteSubmit}
                        disabled={!pasteContent.trim()}
                        className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25"
                      >
                        Load Questions
                      </button>
                    </div>
                  </div>
                )}

                {room.examData && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-emerald-400">Exam Loaded Successfully</h4>
                      <p className="text-sm text-emerald-400/70">{room.examData.questions.length} questions ready</p>
                    </div>
                    <button 
                      onClick={handleStartExam}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
                    >
                      <Play size={20} /> Start Exam
                    </button>
                  </div>
                )}

                <div className="glass p-6 rounded-3xl shadow-xl">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Settings size={20} className="text-indigo-400" />
                    Exam Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Duration (Minutes)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="180" 
                        value={durationMinutes} 
                        onChange={(e) => updateSettings(parseInt(e.target.value) || 30, randomizeQuestions)}
                        className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-between bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-sm font-medium text-slate-300">Randomize Questions</label>
                      <input 
                        type="checkbox" 
                        checked={randomizeQuestions} 
                        onChange={(e) => updateSettings(durationMinutes, e.target.checked)}
                        className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 glass rounded-3xl shadow-xl">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">Waiting for Host...</h3>
                <p className="text-slate-400">The host is setting up the exam.</p>
                {room.examData && (
                  <div className="mt-8 space-y-4">
                    <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 px-6 py-3 rounded-xl text-emerald-400 text-sm font-medium shadow-lg shadow-emerald-500/5">
                      Exam loaded! Waiting for host to start.
                    </div>
                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 text-left max-w-xs mx-auto shadow-inner">
                      <h4 className="font-bold text-sm mb-3 text-indigo-300">Exam Details:</h4>
                      <ul className="text-sm text-slate-300 space-y-2">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> {room.examData.questions.length} Questions</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> {room.examData.settings.durationMinutes} Minutes</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> {room.examData.settings.randomizeQuestions ? 'Randomized' : 'Sequential'} Order</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users size={20} className="text-indigo-400" />
              Participants ({room.users.length})
            </h3>
            <ul className="space-y-3">
              {room.users.map((user: any) => (
                <li key={user.id} className="flex items-center justify-between bg-slate-900/50 p-3.5 rounded-xl border border-slate-600/30 shadow-sm">
                  <span className="font-medium flex items-center gap-2">
                    {user.name}
                    {user.id === socket?.id && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-bold">You</span>}
                  </span>
                  {user.id === room.hostId && (
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-md">Host</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
