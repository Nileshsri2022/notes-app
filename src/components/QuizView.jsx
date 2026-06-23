import { useState, memo } from 'react'

function QuizView({ data }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (qIndex, optionIndex) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    let currentScore = 0;
    data.quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) currentScore++;
    });
    setScore(currentScore);
    setSubmitted(true);
  };

  if (!data.quiz || data.quiz.length === 0) return <div className="p-8 text-center text-slate-500">No quiz available.</div>;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {submitted && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8 text-center shadow-sm animate-fade-in">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Quiz Complete!</h2>
          <p className="text-green-700 text-lg font-medium">You scored {score} out of {data.quiz.length}</p>
        </div>
      )}
      <div className="space-y-8">
        {data.quiz.map((q, qIndex) => (
          <div key={qIndex} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{qIndex + 1}. {q.question}</h3>
            <div className="space-y-3">
              {q.options.map((opt, optIndex) => {
                const isSelected = answers[qIndex] === optIndex;
                const isCorrect = submitted && optIndex === q.correctAnswerIndex;
                const isWrong = submitted && isSelected && !isCorrect;

                let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all focus:outline-none ";
                if (submitted) {
                  if (isCorrect) btnClass += "border-green-500 bg-green-50 text-green-800 font-medium";
                  else if (isWrong) btnClass += "border-red-400 bg-red-50 text-red-800";
                  else btnClass += "border-slate-100 bg-slate-50 text-slate-400";
                } else {
                  btnClass += isSelected ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium shadow-sm" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700";
                }

                return (
                  <button key={optIndex} onClick={() => handleSelect(qIndex, optIndex)} disabled={submitted} className={btnClass}>
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {isCorrect && <i className="fas fa-check-circle text-green-500 text-lg"></i>}
                      {isWrong && <i className="fas fa-times-circle text-red-400 text-lg"></i>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!submitted && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== data.quiz.length}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(QuizView)
