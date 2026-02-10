import type { TextFieldSingleValidation } from 'payload'
import {
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
  UnderlineFeature,
  StrikethroughFeature,
  HeadingFeature,
  UnorderedListFeature,
  OrderedListFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  AlignFeature,
  IndentFeature,
  InlineToolbarFeature,
  FixedToolbarFeature,
  BlocksFeature,
  type LinkFields,
} from '@payloadcms/richtext-lexical'

import { OfferMediaBlock } from '@/blocks/MediaBlock/offerConfig'

/**
 * Lexical editor configured specifically for offer content.
 * Includes all default features plus BlocksFeature with MediaBlock
 * that uploads to the 'offer-uploads' collection.
 */
export const offerLexical = lexicalEditor({
  features: [
    // Toolbar features
    FixedToolbarFeature(),
    InlineToolbarFeature(),

    // Text formatting
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),

    // Structure
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),

    // Layout
    AlignFeature(),
    IndentFeature(),

    // Blocks
    BlocksFeature({
      blocks: [OfferMediaBlock],
    }),

    // Links
    LinkFeature({
      fields: ({ defaultFields }) => {
        const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
          if ('name' in field && field.name === 'url') return false
          return true
        })

        return [
          ...defaultFieldsWithoutUrl,
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
            },
            label: ({ t }) => t('fields:enterURL'),
            required: true,
            validate: ((value, options) => {
              if ((options?.siblingData as LinkFields)?.linkType === 'internal') {
                return true
              }
              return value ? true : 'URL is required'
            }) as TextFieldSingleValidation,
          },
        ]
      },
    }),
  ],
})
