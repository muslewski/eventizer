import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

let _tracked = null
export function trackedFiles() {
  if (_tracked) return _tracked
  const out = sh('git ls-files')
  _tracked = out ? out.split('\n').filter(Boolean) : []
  return _tracked
}

// glob → RegExp. `**/` matches zero or more full path segments; a trailing `**`
// matches anything below; `*` matches within one segment. ( ) [ ] etc. are literals.
// A NUL sentinel (impossible in a path) avoids corrupting globs that contain spaces.
export function globToRegex(glob) {
  let re = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  re = re
    .replace(/\*\*\//g, '\x00SEGS\x00')
    .replace(/\*\*/g, '\x00ANY\x00')
    .replace(/\*/g, '[^/]*')
    .replace(/\x00SEGS\x00/g, '(?:[^/]+/)*')
    .replace(/\x00ANY\x00/g, '.*')
  return new RegExp('^' + re + '$')
}

export function matchGlob(glob) {
  const rx = globToRegex(glob)
  return trackedFiles().filter((f) => rx.test(f))
}

export function grepCode(symbol) {
  const out = sh(`git grep -lF -- ${JSON.stringify(symbol)}`)
  return out ? out.split('\n').filter(Boolean) : []
}

// All user-facing routes are [lang]-rooted (src/app/(frontend)/[lang]/...), so verify
// against the full `[lang]/<segment>` path rather than just the leaf (which false-matches).
export function routeExists(route) {
  const seg = route.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!seg) return trackedFiles().some((f) => /\[lang\]\/page\.[jt]sx$/.test(f))
  return trackedFiles().some((f) => f.startsWith('src/app/') && f.includes(`[lang]/${seg}`))
}

let _changed
export function changedFilesSince(sha) {
  if (!sha) return null // unverified ⇒ caller treats as stale
  if (_changed && _changed.sha === sha) return _changed.files
  // an invalid / unresolvable SHA must NOT silently read as "no changes" (false-fresh)
  if (!sh(`git rev-parse --verify --quiet ${sha}^{commit}`)) return null
  const out = sh(`git diff --name-only ${sha} HEAD`)
  const files = out ? out.split('\n').filter(Boolean) : []
  _changed = { sha, files }
  return files
}

export function parseNote(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { frontmatter: {}, body: raw, file: filePath }
  // js-yaml v4 `load` uses DEFAULT_SCHEMA — it does NOT construct arbitrary JS
  // types (no `!!js/function` etc.), so it is the safe parser. Frontmatter is
  // trusted in-repo content regardless.
  return { frontmatter: yaml.load(m[1]) || {}, body: m[2], file: filePath }
}

export function listNotes(relDir) {
  const abs = path.join(ROOT, relDir)
  if (!existsSync(abs)) return []
  return readdirSync(abs)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort()
    .map((f) => parseNote(path.join(abs, f)))
}
