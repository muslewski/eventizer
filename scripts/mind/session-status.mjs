import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const zonesDir = path.join(root, 'eventizer-mind/map/zones')
const debtDir = path.join(root, 'eventizer-mind/tech-debt')

function countMd(dir, predicate) {
  if (!existsSync(dir)) return 0
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .filter((f) => (predicate ? predicate(readFileSync(path.join(dir, f), 'utf8')) : true)).length
}

const zones = countMd(zonesDir)
const openDebt = countMd(debtDir, (c) => /\bstatus:\s*open\b/.test(c))
console.log(
  `🧠 Mind: ${zones} zones · ${openDebt} open tech-debt — orient via eventizer-mind/map/index.md before coding.`,
)
