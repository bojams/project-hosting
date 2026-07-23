import { Head, Link } from '@inertiajs/react'
import { ChevronLeft } from 'lucide-react'

interface Props {
  slug: string
  content: string
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-[var(--color-on-surface)] mt-5 mb-2 font-[var(--font-display)]">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-[var(--color-on-surface)] mt-6 mb-2 font-[var(--font-display)]">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-[var(--color-on-surface)] mt-6 mb-3 font-[var(--font-display)]">$1</h1>')

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--color-on-surface)] font-semibold">$1</strong>')

  html = html.replace(/`([^`]+)`/g, '<code class="text-xs font-mono bg-[var(--color-surface-container-high)] text-[var(--color-primary)] px-1.5 py-0.5 rounded">$1</code>')

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    if (url.startsWith('http')) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">${text}</a>`
    }
    return `<a href="${url}" class="text-[var(--color-primary)] hover:underline">${text}</a>`
  })

  const lines = html.split('\n')
  const result: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trim() === '---') {
      if (inList) { result.push('</ul>'); inList = false }
      result.push('<hr class="border-t border-[rgba(255,255,255,0.06)] my-6" />')
      continue
    }

    if (line.startsWith('| ') || line.startsWith('|---')) {
      if (inList) { result.push('</ul>'); inList = false }
      if (line.startsWith('|---')) continue
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      const isHeader = lines[i + 1]?.startsWith('|---')
      if (isHeader) {
        result.push('<div class="overflow-x-auto my-3"><table class="w-full text-sm border-collapse"><thead><tr class="border-b border-[rgba(255,255,255,0.06)]">')
        result.push(cells.map(c => `<th class="text-left px-3 py-2 text-[var(--color-on-surface-variant)] font-medium">${c}</th>`).join(''))
        result.push('</tr></thead><tbody>')
      } else {
        result.push(`<tr class="border-b border-[rgba(255,255,255,0.04)]">${cells.map(c => `<td class="px-3 py-2 text-[var(--color-on-surface-variant)]">${c}</td>`).join('')}</tr>`)
      }
      if (!lines[i + 1] || !lines[i + 1].startsWith('|')) {
        result.push('</tbody></table></div>')
      }
      continue
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        result.push('<ul class="space-y-1 my-2">')
        inList = true
      }
      result.push(`<li class="text-sm text-[var(--color-on-surface-variant)] ml-4 list-disc">${line.slice(2)}</li>`)
      continue
    }

    if (line.match(/^\d+\.\s/)) {
      if (!inList) {
        result.push('<ol class="space-y-1 my-2">')
        inList = true
      }
      result.push(`<li class="text-sm text-[var(--color-on-surface-variant)] ml-4 list-decimal">${line.replace(/^\d+\.\s/, '')}</li>`)
      continue
    }

    if (line.startsWith('> ')) {
      if (inList) { result.push('</ul>'); inList = false }
      result.push(`<blockquote class="border-l-2 border-[var(--color-primary)] pl-4 my-3 text-sm text-[var(--color-on-surface-variant)] italic">${line.slice(2)}</blockquote>`)
      continue
    }

    if (inList) {
      result.push('</ul>')
      inList = false
    }

    if (line.startsWith('<h') || line.startsWith('</') || line.trim() === '') {
      result.push(line)
    } else if (line.startsWith('<')) {
      result.push(line)
    } else {
      result.push(`<p class="text-sm text-[var(--color-on-surface-variant)] leading-relaxed mb-2">${line}</p>`)
    }
  }

  if (inList) {
    result.push('</ul>')
  }

  return result.join('\n')
}

export default function DocsShow({ slug, content }: Props) {
  return (
    <>
      <Head title={slug.charAt(0).toUpperCase() + slug.slice(1)} />
      <div className="space-y-6">
        <Link
          href="/dashboard/docs"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to guides
        </Link>

        <div className="bg-[var(--color-bg-card)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] p-6 sm:p-8">
          <article
            className="prose-custom max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    </>
  )
}
