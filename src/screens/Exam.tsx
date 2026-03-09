import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Clock, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function Exam({ room }: any) {
  const { socket } = useSocket();
  const examData = room.examData;
  const questions = examData.questions;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(examData.settings.durationMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  const handleSelectAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }));
  };

  const handleSubmit = () => {
    let score = 0;
    questions.forEach((q: any, idx: number) => {
      const userAns = answers[idx];
      if (userAns) {
        if (!q.isEssay) {
          if (userAns === q.correctAnswer || userAns.startsWith(q.correctAnswer) || q.correctAnswer.startsWith(userAns)) {
            score += 100;
          }
        } else {
          if (userAns.trim().length > 10) {
            score += 50;
          }
        }
      }
    });

    socket?.emit('submitExam', { roomId: room.id, score, answers });
  };

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col">
      <header className="glass border-b border-slate-700/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 truncate hidden sm:block">ArcaneEXAMS</div>
          <div className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 truncate sm:hidden">AE</div>
          <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full font-mono font-bold text-sm sm:text-base transition-colors ${timeRemaining < 60 ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' : 'bg-slate-900/50 text-slate-300 border border-slate-600/50'}`}>
            <Clock size={16} className="flex-shrink-0" />
            {formatTime(timeRemaining)}
          </div>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to submit your exam early?')) {
                handleSubmit();
              }
            }}
            className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors whitespace-nowrap"
          >
            Submit Early
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 flex flex-col">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-400">Question {currentIndex + 1} of {questions.length}</span>
          <div className="flex flex-wrap gap-2">
            {currentQuestion.category && (
              <span className="px-2 py-1 text-xs font-bold bg-indigo-500/20 text-indigo-400 rounded-full whitespace-nowrap">
                {currentQuestion.category}
              </span>
            )}
            {currentQuestion.difficulty && (
              <span className="px-2 py-1 text-xs font-bold bg-slate-700 text-slate-300 rounded-full whitespace-nowrap">
                {currentQuestion.difficulty}
              </span>
            )}
          </div>
        </div>

        <div className="glass p-6 md:p-8 rounded-3xl shadow-2xl mb-6 flex-1 flex flex-col">
          {currentQuestion.imageUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-700/50 flex justify-center p-2">
              <img src={currentQuestion.imageUrl} alt="Reference" className="max-h-72 object-contain rounded-xl" />
            </div>
          )}
          
          <h2 className="text-xl md:text-2xl font-medium leading-relaxed mb-8 text-slate-100">{currentQuestion.text}</h2>

          <div className="space-y-3 mt-auto">
            {currentQuestion.isEssay ? (
              <textarea
                value={answers[currentIndex] || ''}
                onChange={(e) => handleSelectAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-48 bg-slate-900/50 border border-slate-600/50 rounded-2xl p-5 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all placeholder:text-slate-500"
              />
            ) : (
              currentQuestion.options.map((option: string, idx: number) => {
                const isSelected = answers[currentIndex] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start sm:items-center gap-4 group ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' 
                        : 'border-slate-700/50 bg-slate-900/30 hover:border-slate-500/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-500 group-hover:border-slate-400'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                    </div>
                    <span className={`text-base sm:text-lg break-words min-w-0 flex-1 transition-colors ${isSelected ? 'text-indigo-100' : 'text-slate-300 group-hover:text-slate-200'}`}>{option}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-6">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 sm:px-6 py-3 rounded-xl font-medium flex items-center gap-1 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-white text-sm sm:text-base shadow-lg"
          >
            <ChevronLeft size={20} className="flex-shrink-0" /> <span className="hidden sm:inline">Previous</span>
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              className="px-6 sm:px-8 py-3 rounded-xl font-bold flex items-center gap-1 sm:gap-2 transition-all bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25 text-sm sm:text-base"
            >
              Finish <span className="hidden sm:inline">Exam</span> <Check size={20} className="flex-shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-6 sm:px-8 py-3 rounded-xl font-bold flex items-center gap-1 sm:gap-2 transition-all bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 text-sm sm:text-base"
            >
              Next <ChevronRight size={20} className="flex-shrink-0" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
