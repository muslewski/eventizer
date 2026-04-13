'use client'

import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { RichTextEditor } from '@/components/panel/wizard/RichTextEditor'
import type { SerializedEditorState } from 'lexical'

interface StepContentProps {
  content: SerializedEditorState | string | null
  onContentChange: (state: SerializedEditorState) => void
}

export function StepContent({ content, onContentChange }: StepContentProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Treść oferty <span className="text-destructive">*</span></FieldLabel>
        <FieldDescription>
          Szczegółowy opis Twojej oferty. Użyj narzędzi formatowania aby wyróżnić
          najważniejsze informacje — nagłówki, listy, pogrubienia.
        </FieldDescription>
        <RichTextEditor value={content} onChange={onContentChange} />
      </Field>
    </FieldGroup>
  )
}
