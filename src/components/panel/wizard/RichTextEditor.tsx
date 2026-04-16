'use client'

import { useEffect, useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type EditorState,
  type SerializedEditorState,
  type LexicalEditor,
} from 'lexical'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { $createParagraphNode } from 'lexical'
import { useState } from 'react'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  PilcrowIcon,
  MinusIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Toolbar ──────────────────────────────────────────────────────────────────

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex size-8 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-accent/20 text-accent'
          : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
    }
  }, [])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateToolbar())
    })
  }, [editor, updateToolbar])

  const formatHeading = (level: 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(level))
      }
    })
  }

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode())
      }
    })
  }

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode())
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/20 px-2 py-1.5">
      {/* Text formatting */}
      <ToolbarButton
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        title="Pogrubienie"
      >
        <BoldIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        title="Kursywa"
      >
        <ItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        title="Podkreślenie"
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={isStrikethrough}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        title="Przekreślenie"
      >
        <StrikethroughIcon className="size-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border/30" />

      {/* Block formatting */}
      <ToolbarButton onClick={formatParagraph} title="Paragraf">
        <PilcrowIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatHeading('h2')} title="Nagłówek 2">
        <Heading2Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatHeading('h3')} title="Nagłówek 3">
        <Heading3Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton onClick={formatQuote} title="Cytat">
        <QuoteIcon className="size-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border/30" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        title="Lista punktowa"
      >
        <ListIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        title="Lista numerowana"
      >
        <ListOrderedIcon className="size-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border/30" />

      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}
        title="Linia pozioma"
      >
        <MinusIcon className="size-4" />
      </ToolbarButton>
    </div>
  )
}

// ── Initial state loader ─────────────────────────────────────────────────────

function InitialStatePlugin({ initialState }: { initialState?: SerializedEditorState | null }) {
  const [editor] = useLexicalComposerContext()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (initialState && !loaded) {
      const editorState = editor.parseEditorState(initialState)
      editor.setEditorState(editorState)
      setLoaded(true)
    }
  }, [editor, initialState, loaded])

  return null
}

// ── Main component ───────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: SerializedEditorState | string | null
  onChange: (state: SerializedEditorState) => void
}

const theme = {
  heading: {
    h2: 'font-bebas text-2xl tracking-wide mt-4 mb-2',
    h3: 'font-bebas text-xl tracking-wide mt-3 mb-1.5',
    h4: 'font-bebas text-lg tracking-wide mt-2 mb-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  list: {
    ul: 'list-disc ml-6 my-2',
    ol: 'list-decimal ml-6 my-2',
    listitem: 'my-1',
  },
  quote: 'border-l-4 border-accent/30 pl-4 italic text-muted-foreground my-3',
  paragraph: 'my-1.5',
  link: 'text-accent underline',
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'OfferContentEditor',
    theme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, HorizontalRuleNode],
    onError: (error: Error) => console.error('[RichTextEditor]', error),
  }

  // Parse initial value — could be Lexical JSON or a plain string
  const initialState: SerializedEditorState | null =
    value && typeof value === 'object' && 'root' in value ? value : null

  const handleChange = (editorState: EditorState, _editor: LexicalEditor) => {
    const json = editorState.toJSON()
    onChange(json)
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="overflow-hidden rounded-lg border border-border/20 bg-background focus-within:border-accent/40 transition-colors">
        <Toolbar />
        <div className="relative min-h-[200px] px-4 py-3">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="outline-none min-h-[180px] text-sm leading-relaxed" />
            }
            placeholder={
              <div className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground/50">
                Opisz swoją ofertę szczegółowo...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
      </div>
      <HistoryPlugin />
      <ListPlugin />
      <HorizontalRulePlugin />
      <OnChangePlugin onChange={handleChange} />
      <InitialStatePlugin initialState={initialState} />
    </LexicalComposer>
  )
}
