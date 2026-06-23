export default function Markdown({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  let inList = false
  let listItems = []
  const result = []

  const flushList = () => {
    if (inList && listItems.length > 0) {
      result.push(
        <ul key={`ul-${result.length}`} className="list-disc pl-6 mb-4 space-y-1 text-slate-700">{listItems}</ul>
      )
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      const formatted = trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      listItems.push(<li key={index} dangerouslySetInnerHTML={{ __html: formatted }} />)
    } else {
      flushList()
      if (trimmed.startsWith('# ')) {
        result.push(<h1 key={index} className="text-2xl sm:text-3xl font-extrabold mt-8 mb-4 text-slate-900 border-b pb-2">{trimmed.substring(2)}</h1>)
      } else if (trimmed.startsWith('## ')) {
        result.push(<h2 key={index} className="text-xl sm:text-2xl font-bold mt-6 mb-3 text-slate-800 tracking-tight">{trimmed.substring(3)}</h2>)
      } else if (trimmed.startsWith('### ')) {
        result.push(<h3 key={index} className="text-lg sm:text-xl font-bold mt-5 mb-2 text-slate-800">{trimmed.substring(4)}</h3>)
      } else if (trimmed.startsWith('> ')) {
        result.push(<blockquote key={index} className="border-l-4 border-indigo-400 pl-5 py-3 my-5 bg-indigo-50/50 text-indigo-900 italic rounded-r-xl text-[15px] shadow-sm">{trimmed.substring(2)}</blockquote>)
      } else if (trimmed === '') {
        result.push(<div key={index} className="h-3"></div>)
      } else {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
        result.push(<p key={index} className="mb-2 leading-relaxed text-slate-700 text-[15px] sm:text-base" dangerouslySetInnerHTML={{ __html: formatted }} />)
      }
    }
  })
  flushList()
  return <>{result}</>
}
