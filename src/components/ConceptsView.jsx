import { useState, memo } from 'react'
import Markdown from './Markdown.jsx'

function ConceptsView({ data, sourceText }) {
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
        <button onClick={() => setIsSourceOpen(!isSourceOpen)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSourceOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800 text-lg">Source Text</h3>
              <p className="text-sm text-slate-500">Expand to read the original formatted text</p>
            </div>
          </div>
          <i className={`fas fa-chevron-down text-slate-400 transition-transform duration-300 ${isSourceOpen ? 'rotate-180' : ''}`}></i>
        </button>
        <div className={`transition-all duration-500 ease-in-out origin-top ${isSourceOpen ? 'max-h-[1200px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0 border-transparent'} overflow-hidden bg-slate-50/80`}>
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[800px] custom-scrollbar">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm font-sans">
              <Markdown text={sourceText} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">
            <i className="fas fa-book-open"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Core Concepts</h2>
        </div>
        <div className="space-y-6">
          {data?.concepts?.map((concept, index) => (
            <div key={index} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50/30 transition-colors">
              <h3 className="font-bold text-lg text-slate-800 mb-2">{concept.title}</h3>
              <p className="text-slate-600 leading-relaxed">{concept.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(ConceptsView)
