import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Parse markdown to HTML, then sanitize before injecting. The previous
// hand-rolled parser used dangerouslySetInnerHTML on raw text with no
// escaping — a pasted/LLM <img onerror=...> or <script> would execute.
marked.setOptions({ breaks: true, gfm: true })

function renderSafeHtml(text) {
  const rawHtml = marked.parse(text ?? '')
  return DOMPurify.sanitize(rawHtml)
}

// Map markdown headings/list/blockquote to the Tailwind classes the old
// hand-rolled renderer used, so styling stays consistent.
const htmlClassMap = {
  h1: 'text-2xl sm:text-3xl font-extrabold mt-8 mb-4 text-slate-900 border-b pb-2',
  h2: 'text-xl sm:text-2xl font-bold mt-6 mb-3 text-slate-800 tracking-tight',
  h3: 'text-lg sm:text-xl font-bold mt-5 mb-2 text-slate-800',
  p: 'mb-2 leading-relaxed text-slate-700 text-[15px] sm:text-base',
  ul: 'list-disc pl-6 mb-4 space-y-1 text-slate-700',
  ol: 'list-decimal pl-6 mb-4 space-y-1 text-slate-700',
  blockquote:
    'border-l-4 border-indigo-400 pl-5 py-3 my-5 bg-indigo-50/50 text-indigo-900 italic rounded-r-xl text-[15px] shadow-sm',
}

function addClasses(html) {
  // Hook into DOMPurify to stamp classes onto each node before serialization.
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style'],
    FORBID_ATTR: ['style'],
    hooks: {
      afterSanitizeAttributes: (node) => {
        const cls = htmlClassMap[node.localName]
        if (cls) node.setAttribute('class', cls)
      },
    },
  })
}

export default function Markdown({ text }) {
  const html = useMemo(() => {
    if (!text) return ''
    return addClasses(renderSafeHtml(text))
  }, [text])

  if (!text) return null
  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
