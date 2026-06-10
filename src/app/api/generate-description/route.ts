import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { guardAiGeneration } from '@/lib/ai/guard'

const bodySchema = z.object({
  title: z.string().max(200).optional(),
  category: z.string().max(120).optional(),
  price: z.union([z.string().max(50), z.number()]).optional(),
  address: z.string().max(300).optional(),
  // Lexical SerializedEditorState; walked defensively and capped below.
  content: z.unknown().optional(),
})

// Extract plain text from Lexical SerializedEditorState JSON
function extractTextFromLexical(content: any): string {
  if (!content || typeof content === 'string') return content || ''

  const texts: string[] = []

  function walk(node: any) {
    if (node.text) texts.push(node.text)
    if (node.children) {
      for (const child of node.children) walk(child)
      // Add newline after block-level nodes
      if (['paragraph', 'heading', 'quote', 'listitem'].includes(node.type)) {
        texts.push('\n')
      }
    }
  }

  if (content.root) walk(content.root)
  return texts.join('').trim().slice(0, 1000)
}

export async function POST(req: Request) {
  const guard = await guardAiGeneration()
  if (!guard.ok) return guard.response

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return Response.json({ error: 'Nieprawidłowe dane wejściowe' }, { status: 400 })
  }
  const { title, category, price, address, content } = body
  const contentText = extractTextFromLexical(content)

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `Jesteś copywriterem platformy eventowej Eventizer. Generujesz krótkie, zachęcające opisy ofert usług eventowych w języku polskim.

Zasady:
- Maksymalnie 2-3 zdania (do 300 znaków)
- Profesjonalny ale przystępny ton
- Podkreśl unikalne cechy oferty
- Używaj języka korzyści (co klient zyska)
- Nie używaj emoji
- Nie powtarzaj tytułu dosłownie`,
    prompt: `Wygeneruj krótki opis oferty eventowej na podstawie danych:

Tytuł: ${title || 'Brak'}
Kategoria: ${category || 'Brak'}
Cena: ${price || 'Brak'}
Lokalizacja: ${address || 'Brak'}
${contentText ? `Treść oferty: ${contentText}` : ''}

Wygeneruj tylko sam opis, bez cudzysłowów i dodatkowych komentarzy.`,
  })

  return result.toTextStreamResponse()
}
