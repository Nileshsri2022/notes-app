import { useState, memo } from 'react'

function FlashcardsView({ data }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!data.flashcards || data.flashcards.length === 0) return <div className="p-8 text-center text-slate-500">No flashcards available.</div>;

  const card = data.flashcards[currentIndex];

  const nextCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % data.flashcards.length), 150); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + data.flashcards.length) % data.flashcards.length), 150); };

  const flipCard = () => setIsFlipped((prev) => !prev);

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center animate-fade-in">
      <div
        className="w-full h-80 perspective-1000 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? `Card ${currentIndex + 1} of ${data.flashcards.length}, showing definition. Press Enter or Space to flip.` : `Card ${currentIndex + 1} of ${data.flashcards.length}, showing term: ${card.term}. Press Enter or Space to flip.`}
        aria-pressed={isFlipped}
        onClick={flipCard}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard() } }}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute w-full h-full backface-hidden bg-white border-2 border-slate-200 rounded-3xl shadow-lg flex items-center justify-center p-8 text-center">
            <h3 className="text-3xl font-bold text-slate-800">{card.term}</h3>
            <p className="absolute bottom-6 text-sm font-medium text-slate-400">Click to flip</p>
          </div>
          <div className="absolute w-full h-full backface-hidden bg-indigo-600 text-white border-2 border-indigo-600 rounded-3xl shadow-lg flex items-center justify-center p-8 text-center rotate-y-180">
            <p className="text-xl font-medium leading-relaxed">{card.definition}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 mt-8">
        <button onClick={prevCard} aria-label="Previous card" className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"><i className="fas fa-arrow-left text-slate-600" aria-hidden="true"></i></button>
        <span className="font-semibold text-slate-500 text-lg" aria-live="polite">{currentIndex + 1} / {data.flashcards.length}</span>
        <button onClick={nextCard} aria-label="Next card" className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"><i className="fas fa-arrow-right text-slate-600" aria-hidden="true"></i></button>
      </div>
    </div>
  );
}

export default memo(FlashcardsView)
