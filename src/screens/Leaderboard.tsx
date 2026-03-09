import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Trophy, RotateCcw, Users, CheckCircle, Clock, ChevronDown, ChevronUp, XCircle } from 'lucide-react';

export default function Leaderboard({ room }: any) {
  const { socket } = useSocket();
  const isHost = room.hostId === socket?.id;
  const totalQuestions = room.examData?.questions.length || 0;
  const maxScore = totalQuestions * 100;
  const [showExplanations, setShowExplanations] = useState(false);

  const sortedUsers = [...room.users].sort((a, b) => b.score - a.score);
  const allFinished = room.users.every((u: any) => u.finished);
  const currentUser = room.users.find((u: any) => u.id === socket?.id);

  const handlePlayAgain = () => {
    socket?.emit('playAgain', { roomId: room.id });
  };

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white mb-6 shadow-lg shadow-amber-500/25">
            <Trophy size={40} />
          </div>
          <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">Exam Results</h1>
          {!allFinished && (
            <p className="text-amber-400 flex items-center justify-center gap-2">
              <Clock size={16} /> Waiting for other participants to finish...
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="glass rounded-3xl overflow-hidden shadow-2xl mb-8">
              <div className="p-5 bg-slate-900/50 border-b border-slate-700/50 flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                  <Users size={20} className="text-indigo-400" /> Leaderboard
                </h2>
                <span className="text-sm font-medium text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full">{room.users.length} Participants</span>
              </div>
              
              <div className="divide-y divide-slate-700/30">
                {sortedUsers.map((user: any, index: number) => {
                  const isMe = user.id === socket?.id;
                  const percentage = Math.round((user.score / maxScore) * 100) || 0;
                  
                  return (
                    <div key={user.id} className={`p-5 flex items-center gap-4 transition-colors ${isMe ? 'bg-indigo-500/10' : 'hover:bg-slate-800/40'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-amber-500/20' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-slate-400/20' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100 shadow-amber-700/20' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center gap-2 text-lg">
                          <span className="truncate">{user.name}</span>
                          {isMe && <span className="text-xs bg-indigo-500 text-white px-2.5 py-0.5 rounded-full flex-shrink-0 shadow-sm">You</span>}
                        </div>
                        <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                          {user.finished ? (
                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12}/> Finished</span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1"><Clock size={12}/> In Progress</span>
                          )}
                        </div>
                      </div>
                      
                      {user.finished && (
                        <div className="text-right">
                          <div className="text-2xl font-black text-indigo-400">{percentage}%</div>
                          <div className="text-xs text-slate-400">{user.score} pts</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {allFinished && (
              <div className="glass rounded-3xl overflow-hidden shadow-2xl mb-8">
                <button 
                  onClick={() => setShowExplanations(!showExplanations)}
                  className="w-full p-6 bg-indigo-500/10 border-b border-indigo-500/20 flex justify-between items-center hover:bg-indigo-500/20 transition-all"
                >
                  <h2 className="font-bold text-lg text-indigo-300 flex items-center gap-2">
                    Review Answers & Explanations
                  </h2>
                  {showExplanations ? <ChevronUp size={24} className="text-indigo-300" /> : <ChevronDown size={24} className="text-indigo-300" />}
                </button>
                
                {showExplanations && (
                  <div className="p-4 sm:p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {room.examData.questions.map((q: any, idx: number) => {
                      const userAnswer = currentUser?.answers?.[idx];
                      const isCorrect = q.isEssay 
                        ? (userAnswer && userAnswer.trim().length > 10)
                        : (userAnswer === q.correctAnswer || userAnswer?.startsWith(q.correctAnswer) || q.correctAnswer?.startsWith(userAnswer));

                      return (
                        <div key={idx} className={`p-5 rounded-2xl border ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                          <div className="flex gap-3 sm:gap-4 mb-4">
                            <div className="mt-0.5 flex-shrink-0">
                              {isCorrect ? <CheckCircle className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-slate-100 mb-3 text-lg leading-relaxed">{idx + 1}. {q.text}</h3>
                              <div className="space-y-2.5 text-sm sm:text-base bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex flex-col sm:flex-row sm:gap-2">
                                  <span className="text-slate-400 w-32 flex-shrink-0 font-medium">Your Answer:</span>
                                  <span className={`break-words min-w-0 font-medium ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>{userAnswer || 'Not answered'}</span>
                                </div>
                                {!isCorrect && (
                                  <div className="flex flex-col sm:flex-row sm:gap-2 pt-2 sm:pt-0 border-t border-slate-700/50 sm:border-0 mt-2 sm:mt-0">
                                    <span className="text-slate-400 w-32 flex-shrink-0 font-medium">Correct Answer:</span>
                                    <span className="text-emerald-400 break-words min-w-0 font-medium">{q.correctAnswer}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {q.explanation && (
                            <div className="mt-4 p-4 bg-indigo-950/30 rounded-xl border border-indigo-500/20 text-sm sm:text-base text-indigo-100/80 leading-relaxed">
                              <span className="font-bold text-indigo-300 block mb-1.5 flex items-center gap-2">
                                Explanation
                              </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl shadow-xl">
              <h3 className="font-bold mb-6 text-slate-300 text-lg">Your Stats</h3>
              <div className="space-y-6">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-1 font-medium">Score</div>
                  <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-600">{currentUser?.score || 0}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-1 font-medium">Accuracy</div>
                  <div className="text-3xl font-bold text-emerald-400">
                    {Math.round(((currentUser?.score || 0) / maxScore) * 100) || 0}%
                  </div>
                </div>
              </div>
            </div>

            {isHost && (
              <div className="glass p-6 rounded-3xl shadow-xl text-center">
                <h3 className="font-bold mb-4 text-slate-300">Host Controls</h3>
                <button
                  onClick={handlePlayAgain}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
                >
                  <RotateCcw size={20} />
                  Return to Lobby
                </button>
                <p className="text-xs text-slate-400 mt-4">
                  This will reset the room for all participants.
                </p>
              </div>
            )}
            
            {!isHost && (
              <div className="glass p-6 rounded-3xl shadow-xl text-center">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-sm font-medium">
                  Waiting for host to return to lobby...
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
