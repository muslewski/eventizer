'use client'

import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  InputGroup,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

interface FormTextareaFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  maxLength?: number
  showCounter?: boolean
}

export function FormTextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  rows = 5,
  disabled,
  maxLength,
  showCounter = false,
}: FormTextareaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = typeof field.value === 'string' ? field.value : ''
        return (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm text-muted-foreground">{label}</FormLabel>
              {showCounter && maxLength != null && (
                <span className="text-[11px] tabular-nums text-muted-foreground/60">
                  {value.length}/{maxLength}
                </span>
              )}
            </div>
            <FormControl>
              <InputGroup
                className={cn(
                  'bg-background/40 border-border/50',
                  'has-[[data-slot=input-group-control]:focus-visible]:border-accent/50 has-[[data-slot=input-group-control]:focus-visible]:ring-accent/30',
                )}
              >
                <InputGroupTextarea
                  rows={rows}
                  placeholder={placeholder}
                  disabled={disabled}
                  maxLength={maxLength}
                  aria-invalid={fieldState.error ? true : undefined}
                  {...field}
                />
              </InputGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
