import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

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
  const body = await req.json()
  const { title, category, price, address, content } = body
  const contentText = extractTextFromLexical(content)
  console.log('[API generate-description] received:', { title, category, price, address, contentText: contentText.slice(0, 100) })

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
