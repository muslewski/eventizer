import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { title, category, uniqueFeatures, services, experience, additionalInfo } = await req.json()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `Jesteś profesjonalnym copywriterem platformy eventowej Eventizer. Tworzysz szczegółowe, atrakcyjne opisy ofert usług eventowych w języku polskim.

Formatowanie (OBOWIĄZKOWE — używaj markdown):
- Użyj ## dla głównych sekcji (np. ## O nas, ## Nasze usługi, ## Dlaczego my?)
- Użyj ### dla podsekcji
- Użyj **pogrubienia** dla kluczowych informacji i korzyści
- Użyj list (- punkt) do wyliczania usług i zalet
- Użyj --- (linia pozioma) do oddzielenia głównych sekcji
- Użyj > cytatów dla wyróżnień lub hasła przewodniego

Zasady treści:
- Pisz profesjonalnie ale przystępnie
- Podkreślaj korzyści dla klienta
- Buduj zaufanie — podkreślaj doświadczenie
- Nie używaj emoji
- Nie powtarzaj tytułu dosłownie
- Długość: 300-600 słów
- Zawsze dodaj sekcję zachęcającą do kontaktu na końcu`,
    prompt: `Wygeneruj szczegółowy opis oferty eventowej:

Tytuł: ${title || 'Brak'}
Kategoria: ${category || 'Brak'}
${uniqueFeatures ? `Co wyróżnia ofertę: ${uniqueFeatures}` : ''}
${services ? `Zakres usług: ${services}` : ''}
${experience ? `Doświadczenie i portfolio: ${experience}` : ''}
${additionalInfo ? `Dodatkowe informacje: ${additionalInfo}` : ''}

Wygeneruj treść w markdown z nagłówkami, pogrubieniami, listami i liniami poziomymi.`,
  })

  return result.toTextStreamResponse()
}
