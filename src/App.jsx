import { useEffect, useState, lazy, Suspense, useCallback } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useSession } from './hooks/useSession.js'
import { addHistory } from './lib/store.js'
import { generateGuide } from './lib/api.js'

// Code-split the tab views so only the active one is fetched.
const ConceptsView = lazy(() => import('./components/ConceptsView.jsx'))
const FlashcardsView = lazy(() => import('./components/FlashcardsView.jsx'))
const QuizView = lazy(() => import('./components/QuizView.jsx'))
const HistoryView = lazy(() => import('./components/HistoryView.jsx'))
const ChatBot = lazy(() => import('./components/ChatBot.jsx'))

export default function App() {
  const { user, ready } = useAuth()
  const { history, loadSession, saveSession, flushSession } = useSession(user)
  const [sourceText, setSourceText] = useState('')
  const [status, setStatus] = useState('input')
  const [learningData, setLearningData] = useState(null)
  const [activeTab, setActiveTab] = useState('concepts')
  const [errorMsg, setErrorMsg] = useState('')
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    if (!user || restored) return
    loadSession().then((data) => {
      if (data) {
        if (data.status) setStatus(data.status)
        if (data.sourceText !== undefined) setSourceText(data.sourceText)
        if (data.learningData !== undefined) setLearningData(data.learningData)
        if (data.activeTab) setActiveTab(data.activeTab)
      }
      setRestored(true)
    })
  }, [user, restored, loadSession])

  const handleTabClick = useCallback((tab) => { setActiveTab(tab); flushSession(status, sourceText, learningData, tab) }, [status, sourceText, learningData, flushSession])
  const handleNewTextClick = useCallback(() => {
    setSourceText(''); setLearningData(null); setStatus('input'); setActiveTab('concepts')
    flushSession('input', '', null, 'concepts')
  }, [flushSession])
  const handleRestoreClick = useCallback((item) => {
    setSourceText(item.sourceText); setLearningData(item.learningData); setStatus('ready'); setActiveTab('concepts')
    flushSession('ready', item.sourceText, item.learningData, 'concepts')
  }, [flushSession])
  const handleTextChange = useCallback((e) => {
    const text = e.target.value; setSourceText(text); saveSession(status, text, learningData, activeTab)
  }, [status, learningData, activeTab, saveSession])

  const handleAnalyze = async () => {
    if (!sourceText.trim()) return
    setStatus('loading'); setErrorMsg(''); flushSession('loading', sourceText, learningData, activeTab)
    try {
      const parsedData = await generateGuide(sourceText)
      const stamped = { ...parsedData, createdAt: Date.now() }
      if (user) {
        await addHistory(user, {
          timestamp: new Date().toLocaleString(),
          createdAt: stamped.createdAt,
          sourceText,
          learningData: stamped,
        })
      }
      setLearningData(stamped); setActiveTab('concepts'); setStatus('ready')
      await flushSession('ready', sourceText, stamped, 'concepts')
    } catch (error) {
      console.error('Error generating content:', error)
      setErrorMsg('Failed to process the text. Please try a shorter text or check the server.')
      setStatus('input')
      await saveSession('input', sourceText, learningData, activeTab)
    }
  }

  // When the active guide changes (generated fresh or restored from history),
  // remount the tab views so internal state (quiz answers, flashcard index)
  // resets instead of leaking from the previous guide.
  const guideKey = learningData?.createdAt ?? 'fresh'

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center" role="status" aria-live="polite">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading your workspace...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 relative">
      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <i className="fas fa-brain text-sm"></i>
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">AI Study Tutor</h1>
          </div>
          {status === "ready" && (
            <button onClick={handleNewTextClick} className="text-sm font-semibold px-4 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center gap-2 focus:outline-none">
              <i className="fas fa-plus"></i> New Text
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {status === "input" && (
          <div className="animate-fade-in flex flex-col lg:flex-row gap-8">
            <div className="flex-grow">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">What do you want to learn today?</h2>
                <p className="text-slate-600 text-lg">Paste an article, book chapter, or your notes below. The AI will generate plain-language concepts, flashcards, and a quiz.</p>
              </div>
              <div className="relative mt-8">
                <label htmlFor="source-text" className="sr-only">Study material</label>
                <textarea
                  id="source-text"
                  value={sourceText}
                  onChange={handleTextChange}
                  placeholder="Paste your study material here..."
                  className="w-full h-72 p-6 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all shadow-sm text-base leading-relaxed bg-white custom-scrollbar outline-none"
                ></textarea>
              </div>

              {errorMsg && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
                  <i className="fas fa-exclamation-triangle"></i>
                  {errorMsg}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={!sourceText.trim()}
                  className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/20 flex items-center gap-3"
                >
                  <i className="fas fa-magic"></i> Generate Study Guide
                </button>
              </div>
            </div>

            {/* Sidebar for Recent History on Input screen */}
            {history.length > 0 && (
              <div className="lg:w-80 flex-shrink-0">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <i className="fas fa-history text-indigo-500"></i> Recent Guides
                </h3>
                <div className="space-y-3">
                  {history.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleRestoreClick(item)}
                      className="w-full text-left p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group focus:outline-none"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{item.timestamp.split(',')[0]}</span>
                        <i className="fas fa-chevron-right text-slate-300 group-hover:text-indigo-500 transition-colors text-xs"></i>
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-2">{item.sourceText}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in" role="status" aria-live="polite">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <h3 className="mt-8 text-2xl font-bold text-slate-800">Analyzing your material...</h3>
            <p className="mt-2 text-slate-500 text-lg">Extracting key concepts and building your quiz.</p>
          </div>
        )}

        {status === "ready" && learningData && (
          <div className="animate-fade-in">
            <div className="flex justify-start gap-2 mb-10 border-b border-slate-200 overflow-x-auto hide-scrollbar pb-px" role="tablist" aria-label="Study guide sections">
              <button
                id="tab-concepts"
                role="tab"
                aria-selected={activeTab === 'concepts'}
                aria-controls="panel-concepts"
                onClick={() => handleTabClick('concepts')}
                className={`px-6 py-3.5 font-bold rounded-t-xl flex items-center gap-3 transition-colors text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeTab === 'concepts' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                <i className="fas fa-book-open" aria-hidden="true"></i> Learn Concepts
              </button>
              <button
                id="tab-flashcards"
                role="tab"
                aria-selected={activeTab === 'flashcards'}
                aria-controls="panel-flashcards"
                onClick={() => handleTabClick('flashcards')}
                className={`px-6 py-3.5 font-bold rounded-t-xl flex items-center gap-3 transition-colors text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeTab === 'flashcards' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                <i className="fas fa-layer-group" aria-hidden="true"></i> Flashcards
              </button>
              <button
                id="tab-quiz"
                role="tab"
                aria-selected={activeTab === 'quiz'}
                aria-controls="panel-quiz"
                onClick={() => handleTabClick('quiz')}
                className={`px-6 py-3.5 font-bold rounded-t-xl flex items-center gap-3 transition-colors text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeTab === 'quiz' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                <i className="fas fa-check-circle" aria-hidden="true"></i> Take Quiz
              </button>
              <button
                id="tab-history"
                role="tab"
                aria-selected={activeTab === 'history'}
                aria-controls="panel-history"
                onClick={() => handleTabClick('history')}
                className={`px-6 py-3.5 font-bold rounded-t-xl flex items-center gap-3 transition-colors text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                <i className="fas fa-history" aria-hidden="true"></i> History
              </button>
            </div>

            <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading…</div>}>
              <div id="panel-concepts" role="tabpanel" aria-labelledby="tab-concepts">
                {activeTab === 'concepts' && <ConceptsView key={guideKey} data={learningData} sourceText={sourceText} />}
                {activeTab === 'flashcards' && <FlashcardsView key={guideKey} data={learningData} />}
                {activeTab === 'quiz' && <QuizView key={guideKey} data={learningData} />}
                {activeTab === 'history' && <HistoryView history={history} onRestore={handleRestoreClick} />}
              </div>

              <ChatBot sourceText={sourceText} concepts={learningData.concepts} />
            </Suspense>
          </div>
        )}
      </main>
    </div>
  )
}
