import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const body = await req.json()
  const { title, category, price, address, content } = body
  console.log('[API generate-description] received:', { title, category, price, address, hasContent: !!content })

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
${content ? `Treść oferty (fragment): ${typeof content === 'string' ? content.slice(0, 500) : JSON.stringify(content).slice(0, 500)}` : ''}

Wygeneruj tylko sam opis, bez cudzysłowów i dodatkowych komentarzy.`,
  })

  return result.toTextStreamResponse()
}
