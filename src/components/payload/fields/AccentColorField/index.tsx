'use client'

import * as React from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

const HEX_RE = /^#([0-9a-fA-F]{6})$/
const DEFAULT_HEX = '#E4A00B'

const boxStyle: React.CSSProperties = {
  height: '2.5rem',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-s, 4px)',
}

export const AccentColorField: React.FC<TextFieldClientProps> = ({ path, field }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const current = typeof value === 'string' ? value : ''
  const swatch = HEX_RE.test(current) ? current : DEFAULT_HEX

  return (
    <div className="field-type text">
      <FieldLabel label={field?.label} path={path} required={field?.required} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="color"
          aria-label="Wybierz kolor"
          value={swatch}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          style={{ ...boxStyle, width: '2.75rem', padding: 0, background: 'none', cursor: 'pointer' }}
        />
        <input
          type="text"
          value={current}
          placeholder={DEFAULT_HEX}
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          style={{
            ...boxStyle,
            flex: 1,
            padding: '0 0.75rem',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-elevation-800)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        />
      </div>
      {showError && errorMessage && (
        <div className="field-error" style={{ marginTop: '0.25rem' }}>
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default AccentColorField
