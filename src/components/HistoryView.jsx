import { memo } from 'react'

function HistoryView({ history, onRestore }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-slate-400">
          <i className="fas fa-history"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">No History Yet</h3>
        <p className="text-slate-500">Your generated study guides will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {history.map((item) => (
        <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full hover:border-indigo-300 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-wide">
              {item.timestamp}
            </span>
          </div>
          <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow overflow-hidden">
            {item.sourceText.substring(0, 150)}{item.sourceText.length > 150 ? '...' : ''}
          </p>
          <button onClick={() => onRestore(item)} className="w-full py-2.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none">
            <i className="fas fa-folder-open"></i> Open Guide
          </button>
        </div>
      ))}
    </div>
  );
}

export default memo(HistoryView)
