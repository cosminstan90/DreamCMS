/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import {
  buildDefinedTermSchema,
  buildDreamSchemaPayload,
  buildFAQSchema,
  buildItemListSchema,
  CalloutBlock,
  DreamInterpretationBlock,
  DreamSymbolsListBlock,
  ExpertTakeBlock,
  FAQBlock,
  ImageGalleryBlock,
  ProsConsMeaningBlock,
  QuickAnswerBlock,
  SymbolCardBlock,
  WhenToWorryBlock,
} from './customExtensions'
import { MediaPicker } from '@/components/media/MediaPicker'
import { ALL_EDITOR_BLOCKS } from '@/lib/sites/editor-features'
import type { EditorBlockKey } from '@/lib/sites/types'

type EditorChange = {
  contentJson: unknown
  contentHtml: string
  schemaMarkup?: unknown[]
}

type TiptapEditorProps = {
  initialContent?: unknown
  placeholder?: string
  onChange: (value: EditorChange) => void
  allowedBlocks?: EditorBlockKey[]
  pendingLinkInsert?: {
    key: number
    href: string
    label: string
  } | null
}

type SlashItem = {
  key: string
  label: string
  run: () => void
  isCustom?: boolean
}

export function TiptapEditor({
  initialContent,
  placeholder,
  onChange,
  allowedBlocks = ALL_EDITOR_BLOCKS,
  pendingLinkInsert,
}: TiptapEditorProps) {
  const [slashOpen, setSlashOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const allowedBlockKey = allowedBlocks.join('|')

  const enabledBlockSet = useMemo(() => new Set<EditorBlockKey>(allowedBlocks), [allowedBlocks])
  const extensions = useMemo(
    () => [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder || 'Scrie continutul...' }),
      CharacterCount,
      Typography,
      ...(enabledBlockSet.has('dreamInterpretation') ? [DreamInterpretationBlock] : []),
      ...(enabledBlockSet.has('symbolCard') ? [SymbolCardBlock] : []),
      ...(enabledBlockSet.has('faq') ? [FAQBlock] : []),
      ...(enabledBlockSet.has('imageGallery') ? [ImageGalleryBlock] : []),
      ...(enabledBlockSet.has('dreamSymbolsList') ? [DreamSymbolsListBlock] : []),
      ...(enabledBlockSet.has('callout') ? [CalloutBlock] : []),
      ...(enabledBlockSet.has('quickAnswer') ? [QuickAnswerBlock] : []),
      ...(enabledBlockSet.has('prosConsMeaning') ? [ProsConsMeaningBlock] : []),
      ...(enabledBlockSet.has('whenToWorry') ? [WhenToWorryBlock] : []),
      ...(enabledBlockSet.has('expertTake') ? [ExpertTakeBlock] : []),
    ],
    [enabledBlockSet, placeholder],
  )

  const editor = useEditor(
    {
      extensions,
      content: initialContent || { type: 'doc', content: [{ type: 'paragraph' }] },
      editorProps: {
        attributes: {
          class:
            'min-h-[420px] p-4 rounded-xl border border-slate-700 bg-[#0f172a] text-slate-100 focus:outline-none',
        },
        handleTextInput: (_view, _from, _to, text) => {
          if (text === '/') setSlashOpen(true)
          return false
        },
        handleKeyDown: (_view, event) => {
          if (event.key === 'Escape') setSlashOpen(false)
          return false
        },
      },
      onUpdate({ editor: currentEditor }) {
        const json = currentEditor.getJSON()
        const html = currentEditor.getHTML()

        const schemaMarkup: unknown[] = []
        currentEditor.state.doc.descendants((node) => {
          if (node.type.name === 'dreamInterpretationBlock') {
            schemaMarkup.push(buildDreamSchemaPayload(String((node.attrs as any)?.payload?.dreamTitle || 'Vis')))
          }

          if (node.type.name === 'symbolCardBlock') {
            const payload = (node.attrs as any)?.payload || {}
            schemaMarkup.push(buildDefinedTermSchema(String(payload.symbolName || ''), String(payload.shortMeaning || '')))
          }

          if (node.type.name === 'faqBlock') {
            schemaMarkup.push(buildFAQSchema(((node.attrs as any)?.payload?.items || []) as Array<{ question: string; answer: string }>))
          }

          if (node.type.name === 'dreamSymbolsListBlock') {
            schemaMarkup.push(buildItemListSchema(((node.attrs as any)?.payload?.items || []) as Array<{ symbolName: string; slug: string }>))
          }
        })

        onChange({ contentJson: json, contentHtml: html, schemaMarkup })
      },
    },
    [allowedBlockKey, placeholder],
  )

  useEffect(() => {
    if (!editor) return
    if (initialContent) editor.commands.setContent(initialContent)
  }, [editor, initialContent])

  useEffect(() => {
    if (!editor || !pendingLinkInsert) return
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: pendingLinkInsert.label,
        marks: [{ type: 'link', attrs: { href: pendingLinkInsert.href } }],
      })
      .run()
  }, [editor, pendingLinkInsert])

  const insertMediaImage = (item: any) => {
    if (!editor) return
    const urls = item.urls || { webp: item.url, thumbnail: item.url }
    const imgCount = (editor.getHTML().match(/<img/gi) || []).length
    const loading = imgCount === 0 ? 'eager' : 'lazy'
    const width = item.width || 800
    const height = item.height || 600
    const alt = item.altText || ''
    const src = urls.webp || item.url
    const thumb = urls.thumbnail || src
    const html = `<img src="${src}" srcset="${thumb} 400w, ${src} 800w" width="${width}" height="${height}" alt="${alt}" loading="${loading}">`
    editor.chain().focus().insertContent(html).run()
    setPickerOpen(false)
  }

  const slashItems = useMemo<SlashItem[]>(() => {
    if (!editor) return []

    const items: SlashItem[] = [
      { key: 'paragraph', label: 'Paragraph', run: () => editor.chain().focus().setParagraph().run() },
      { key: 'h1', label: 'H1', run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
      { key: 'h2', label: 'H2', run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { key: 'h3', label: 'H3', run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
      { key: 'bulletList', label: 'BulletList', run: () => editor.chain().focus().toggleBulletList().run() },
      { key: 'orderedList', label: 'OrderedList', run: () => editor.chain().focus().toggleOrderedList().run() },
      { key: 'blockquote', label: 'Blockquote', run: () => editor.chain().focus().toggleBlockquote().run() },
      { key: 'code', label: 'Code', run: () => editor.chain().focus().toggleCodeBlock().run() },
      { key: 'table', label: 'Table', run: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { key: 'image', label: 'Image', run: () => setPickerOpen(true) },
    ]

    if (enabledBlockSet.has('dreamInterpretation')) {
      items.push({
        key: 'dreamInterpretation',
        label: 'Interpretare Vis',
        isCustom: true,
        run: () => {
          const dreamTitle = window.prompt('Titlu vis') || ''
          const generalMeaning = window.prompt('Interpretare generala') || ''
          const psychologicalMeaning = window.prompt('Semnificatie psihologica') || ''
          const spiritualMeaning = window.prompt('Semnificatie spirituala (optional)') || ''
          const warningNote = window.prompt('Avertisment (optional)') || ''
          editor.chain().focus().insertContent({ type: 'dreamInterpretationBlock', attrs: { payload: { dreamTitle, generalMeaning, psychologicalMeaning, spiritualMeaning, warningNote } } }).run()
        },
      })
    }

    if (enabledBlockSet.has('imageGallery')) {
      items.push({
        key: 'imageGallery',
        label: 'Galerie imagini',
        isCustom: true,
        run: () => {
          const title = window.prompt('Titlu galerie (optional)') || ''
          const raw = window.prompt('URL imagini separate prin virgula') || ''
          const items = raw
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .map((src) => ({ src, alt: '', caption: '' }))
          editor.chain().focus().insertContent({ type: 'imageGalleryBlock', attrs: { payload: { title, items } } }).run()
        },
      })
    }
    if (enabledBlockSet.has('quickAnswer')) {
      items.push({
        key: 'quickAnswer',
        label: 'Raspuns rapid',
        isCustom: true,
        run: () => {
          const question = window.prompt('Intrebare scurta (optional)') || ''
          const answer = window.prompt('Raspuns direct') || ''
          const supportingDetail = window.prompt('Detaliu suport (optional)') || ''
          editor.chain().focus().insertContent({ type: 'quickAnswerBlock', attrs: { payload: { question, answer, supportingDetail } } }).run()
        },
      })
    }

    if (enabledBlockSet.has('prosConsMeaning')) {
      items.push({
        key: 'prosConsMeaning',
        label: 'Sens pozitiv/negativ',
        isCustom: true,
        run: () => {
          const positiveMeaning = window.prompt('Cand are sens pozitiv') || ''
          const cautionMeaning = window.prompt('Cand cere prudenta') || ''
          const contextsSummary = window.prompt('Rezumat context (optional)') || ''
          editor.chain().focus().insertContent({ type: 'prosConsMeaningBlock', attrs: { payload: { positiveMeaning, cautionMeaning, contextsSummary } } }).run()
        },
      })
    }

    if (enabledBlockSet.has('whenToWorry')) {
      items.push({
        key: 'whenToWorry',
        label: 'Cand sa te ingrijorezi',
        isCustom: true,
        run: () => {
          const signs = (window.prompt('Semnale separate prin virgula') || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
          const reassurance = window.prompt('Mesaj de delimitare / reassurance') || ''
          editor.chain().focus().insertContent({ type: 'whenToWorryBlock', attrs: { payload: { signs, reassurance } } }).run()
        },
      })
    }

    if (enabledBlockSet.has('expertTake')) {
      items.push({
        key: 'expertTake',
        label: 'Perspectiva de expert',
        isCustom: true,
        run: () => {
          const expertName = window.prompt('Nume expert') || ''
          const expertRole = window.prompt('Rol / credentiale') || ''
          const take = window.prompt('Observatia expertului') || ''
          const confidence = window.prompt('Nivel de incredere (optional)') || ''
          editor.chain().focus().insertContent({ type: 'expertTakeBlock', attrs: { payload: { expertName, expertRole, take, confidence } } }).run()
        },
      })
    }

    if (enabledBlockSet.has('symbolCard')) {
      items.push({
        key: 'symbolCard',
        label: 'Simbol Card',
        isCustom: true,
        run: () => {
          const symbolName = window.prompt('Nume simbol') || ''
          const symbolEmoji = window.prompt('Emoji (1)') || ''
          const shortMeaning = (window.prompt('Scurta semnificatie (max 100)') || '').slice(0, 100)
          editor.chain().focus().insertContent({ type: 'symbolCardBlock', attrs: { payload: { symbolName, symbolEmoji, shortMeaning, contexts: [] } } }).run()
        },
      })
    }

    if (enabledBlockSet.has('faq')) {
      items.push({
        key: 'faq',
        label: 'FAQ',
        isCustom: true,
        run: () => {
          const question = window.prompt('Intrebare') || ''
          const answer = window.prompt('Raspuns') || ''
          editor.chain().focus().insertContent({ type: 'faqBlock', attrs: { payload: { items: [{ question, answer }] } } }).run()
        },
      })
    }

    if (enabledBlockSet.has('dreamSymbolsList')) {
      items.push({
        key: 'dreamSymbolsList',
        label: 'Lista Simboluri',
        isCustom: true,
        run: () => {
          editor.chain().focus().insertContent({ type: 'dreamSymbolsListBlock', attrs: { payload: { items: [] } } }).run()
        },
      })
    }

    if (enabledBlockSet.has('callout')) {
      items.push({
        key: 'callout',
        label: 'Nota',
        isCustom: true,
        run: () => {
          const kind = window.prompt('Tip: info/warning/tip/important') || 'info'
          const text = window.prompt('Text') || ''
          editor.chain().focus().insertContent({ type: 'calloutBlock', attrs: { payload: { kind, text } } }).run()
        },
      })
    }

    return items
  }, [editor, enabledBlockSet])

  const customBlockItems = useMemo(() => slashItems.filter((item) => item.isCustom), [slashItems])

  if (!editor) {
    return <div className="text-slate-400">Se initializeaza editorul...</div>
  }

  const toolbarButton = 'px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs text-slate-100'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-700 bg-[#1e293b] p-2">
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullet</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleOrderedList().run()}>Ordered</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Table</button>
        <button className={toolbarButton} onClick={() => setPickerOpen(true)}>Media</button>
        <button
          className={toolbarButton}
          onClick={() => {
            const url = window.prompt('URL link:')
            if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
        >
          Link
        </button>

        {customBlockItems.length > 0 && (
          <select
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
            onChange={(e) => {
              const value = e.target.value
              if (!value) return
              const item = customBlockItems.find((entry) => entry.key === value)
              if (item) item.run()
              e.target.value = ''
            }}
            defaultValue=""
          >
            <option value="">Custom Blocks</option>
            {customBlockItems.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        )}

        <button className={toolbarButton} onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button className={toolbarButton} onClick={() => editor.chain().focus().redo().run()}>Redo</button>
      </div>

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-800 p-1">
            <button className={toolbarButton} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
            <button className={toolbarButton} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
            <button className={toolbarButton} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
          </div>
        </BubbleMenu>
      )}

      {slashOpen && (
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-2">
          <div className="mb-2 text-xs text-slate-400">Slash Commands</div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {slashItems.map((item) => (
              <button
                key={item.key}
                className="rounded bg-slate-800 px-2 py-1 text-left text-xs hover:bg-slate-700"
                onClick={() => {
                  item.run()
                  setSlashOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
      <p className="text-xs text-slate-400">Caractere: {editor.storage.characterCount.characters()}</p>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => insertMediaImage(item)}
      />
    </div>
  )
}






