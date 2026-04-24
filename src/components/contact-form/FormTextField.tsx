'use client'

import type { LucideIcon } from 'lucide-react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

interface FormTextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  type?: 'text' | 'email' | 'url' | 'tel'
  icon?: LucideIcon
  disabled?: boolean
  autoComplete?: string
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  icon: Icon,
  disabled,
  autoComplete,
}: FormTextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-sm text-muted-foreground">{label}</FormLabel>
          <FormControl>
            <InputGroup
              className={cn(
                'bg-background/40 border-border/50',
                'has-[[data-slot=input-group-control]:focus-visible]:border-accent/50 has-[[data-slot=input-group-control]:focus-visible]:ring-accent/30',
              )}
            >
              {Icon && (
                <InputGroupAddon align="inline-start">
                  <Icon className="size-4 text-accent/70" />
                </InputGroupAddon>
              )}
              <InputGroupInput
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                aria-invalid={fieldState.error ? true : undefined}
                {...field}
              />
            </InputGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
