/**
 * fetch_player_photos.mjs
 *
 * Cerca foto per ogni giocatore su Wikipedia/Wikimedia Commons.
 * Strategie (in ordine di affidabilità):
 *  1. Wikipedia pageimages — thumbnail infobox (molto affidabile)
 *  2. Commons search con nome nel filename + tipo BITMAP
 *
 * Comportamento incrementale:
 *  - Default: cerca solo i giocatori MAI controllati (photo_checked_at IS NULL)
 *  - --retry : ricontrolla anche quelli già cercati senza esito
 *  - --all   : ricontrolla TUTTI (anche quelli già con foto)
 *  - Ogni tentativo (riuscito o no) imposta photo_checked_at = NOW()
 *
 * Licenza: CC-BY-SA — credito autore salvato in photo_credit.
 */

import postgres from 'postgres'

const DRY_RUN = process.argv.includes('--dry-run')
const ALL     = process.argv.includes('--all')
const RETRY   = process.argv.includes('--retry')   // riprova anche quelli già controllati senza esito
const LIMIT   = (() => { const i = process.argv.indexOf('--limit'); return i >= 0 ? parseInt(process.argv[i+1]) : 500 })()

const db = postgres(process.env.DATABASE_URL, { max: 1 })
const UA = 'AceChronicle/1.0 (educational project; contact: testamario75@gmail.com)'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function wikiGet(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })
  return res.json()
}

function isValidPhotoUrl(url) {
  if (!url) return false
  if (!url.includes('upload.wikimedia.org')) return false
  // Scarta PDF scansionati (es. "filename.pdf.jpg" o "page1-600px-filename.pdf.jpg")
  if (/\.pdf[./]/i.test(url)) return false
  if (/page\d+-\d+px-/i.test(url)) return false
  // Deve essere un formato immagine reale
  return /\.(jpg|jpeg|png|gif|webp)/i.test(url)
}

async function getImageInfo(fileTitle, lastNameCheck = null) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|extmetadata|mediatype&iiurlwidth=600&format=json&origin=*`
  const data = await wikiGet(url)
  const page = Object.values(data?.query?.pages ?? {})[0]
  const info = page?.imageinfo?.[0]
  if (!info) return null

  // Solo immagini BITMAP reali
  if (info.mediatype && info.mediatype !== 'BITMAP') return null

  const imgUrl = info.thumburl ?? info.url
  if (!isValidPhotoUrl(imgUrl)) return null

  // Se richiesto, verifica che il cognome compaia nel titolo del file
  if (lastNameCheck) {
    const namePart = lastNameCheck.toLowerCase().replace(/[^a-z]/g, '')
    const titleLower = fileTitle.toLowerCase().replace(/[^a-z]/g, '')
    if (namePart.length >= 4 && !titleLower.includes(namePart.slice(0, 5))) return null
  }

  const meta = info.extmetadata
  const artist = meta?.Artist?.value?.replace(/<[^>]*>/g, '').trim() ?? ''
  const credit = artist ? `${artist} / Wikimedia Commons (CC-BY-SA)` : 'Wikimedia Commons (CC-BY-SA)'
  return { url: imgUrl, credit }
}

async function fetchPhoto(firstName, lastName) {
  const name = `${firstName} ${lastName}`
  const encoded = encodeURIComponent(name)

  // ── Strategia 1: Wikipedia pageimages (infobox thumbnail) ─────────────
  // Prova con il nome diretto
  for (const title of [name, `${lastName}, ${firstName}`]) {
    const data = await wikiGet(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=600&piprop=thumbnail|name&format=json&origin=*`
    )
    const page = Object.values(data?.query?.pages ?? {})[0]
    if (page?.thumbnail?.source && !page.missing) {
      const imgUrl = page.thumbnail.source.replace(/\/\d+px-/, '/600px-')
      if (!isValidPhotoUrl(imgUrl)) continue
      let credit = 'Wikimedia Commons (CC-BY-SA)'
      if (page.pageimage) {
        try {
          const r = await getImageInfo(`File:${page.pageimage}`)
          if (r) credit = r.credit
        } catch { /* fallback */ }
      }
      return { url: imgUrl, credit }
    }
    await sleep(80)
  }

  // ── Strategia 2: Wikipedia search → pageimages ────────────────────────
  await sleep(80)
  const searchData = await wikiGet(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}+tennis&srlimit=3&format=json&origin=*`
  )
  const searchResults = searchData?.query?.search ?? []
  const match = searchResults.find(r =>
    r.title.toLowerCase().includes(lastName.toLowerCase())
  )
  if (match) {
    await sleep(80)
    const pageData = await wikiGet(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(match.title)}&prop=pageimages&pithumbsize=600&piprop=thumbnail|name&format=json&origin=*`
    )
    const page = Object.values(pageData?.query?.pages ?? {})[0]
    if (page?.thumbnail?.source) {
      const imgUrl = page.thumbnail.source.replace(/\/\d+px-/, '/600px-')
      if (isValidPhotoUrl(imgUrl)) {
        let credit = 'Wikimedia Commons (CC-BY-SA)'
        if (page.pageimage) {
          try {
            const r = await getImageInfo(`File:${page.pageimage}`)
            if (r) credit = r.credit
          } catch { /* fallback */ }
        }
        return { url: imgUrl, credit }
      }
    }
  }

  // ── Strategia 3: Commons search con cognome nel filename ──────────────
  await sleep(80)
  const commonsData = await wikiGet(
    `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encoded}+tennis&srnamespace=6&srlimit=10&format=json&origin=*`
  )
  for (const r of commonsData?.query?.search ?? []) {
    // Il cognome DEVE comparire nel titolo del file
    const titleLower = r.title.toLowerCase().replace(/[^a-z]/g, '')
    const lastLower  = lastName.toLowerCase().replace(/[^a-z]/g, '')
    if (lastLower.length >= 4 && !titleLower.includes(lastLower.slice(0, 5))) continue
    try {
      const result = await getImageInfo(r.title)
      if (result) return result
    } catch { /* prova il prossimo */ }
    await sleep(50)
  }

  return null
}

// ── main ─────────────────────────────────────────────────────────────────

const players = await db`
  SELECT id, first_name, last_name, slug, photo_url
  FROM players
  ${ALL
    ? db``
    : RETRY
      ? db`WHERE photo_url IS NULL`
      : db`WHERE photo_url IS NULL AND photo_checked_at IS NULL`}
  ORDER BY grand_slams DESC NULLS LAST, atp_peak_rank ASC NULLS LAST
  LIMIT ${LIMIT}
`

console.log(`Giocatori da processare: ${players.length}`)
if (DRY_RUN) console.log('[DRY RUN]\n')

let found = 0, not_found = 0, errors = 0

for (const p of players) {
  const name = `${p.first_name} ${p.last_name}`
  process.stdout.write(`  ${name} ... `)
  try {
    const result = await fetchPhoto(p.first_name, p.last_name)
    if (result) {
      console.log(`✓  ${result.url.slice(0, 70)}`)
      found++
      if (!DRY_RUN) {
        await db`UPDATE players SET photo_url = ${result.url}, photo_credit = ${result.credit}, photo_checked_at = NOW() WHERE id = ${p.id}`
      }
    } else {
      console.log('✗')
      not_found++
      if (!DRY_RUN) {
        await db`UPDATE players SET photo_checked_at = NOW() WHERE id = ${p.id}`
      }
    }
    await sleep(120)
  } catch (e) {
    console.log(`⚠ ${e.message}`)
    errors++
  }
}

console.log(`\n── Riepilogo ────────────────────────`)
console.log(`  Foto trovate  : ${found}`)
console.log(`  Non trovate   : ${not_found}`)
console.log(`  Errori        : ${errors}`)

await db.end()
