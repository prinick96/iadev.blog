// 100% generado con IA, pero con criterio
import { create, type Font } from 'fontkit'
import sharp from 'sharp'
import { site } from '@/ui/config/site'
import type { SocialImageFonts, SocialImageInput } from '@/ui/types/socialImage'

export const SOCIAL_IMAGE_WIDTH = 1200
export const SOCIAL_IMAGE_HEIGHT = 630

type TitleWrapState = {
  readonly lines: readonly string[]
  readonly line: string
  readonly lineUnits: number
}

type TextRun = {
  readonly font: Font
  readonly text: string
  readonly unsupported: boolean
}

type OutlineState = {
  readonly paths: string
  readonly x: number
  readonly y: number
}

function loadFonts(buffers: readonly Uint8Array[], weight: 'regular' | 'bold'): Font[] {
  if (buffers.length === 0) {
    throw new Error(`Missing social image ${weight} fonts`)
  }

  return buffers.map((buffer, index) => {
    try {
      const font = create(Buffer.from(buffer))
      if (!('layout' in font)) {
        throw new Error('Font collections are not supported')
      }
      return font
    } catch (cause) {
      throw new Error(`Invalid social image ${weight} font at index ${index}`, { cause })
    }
  })
}

function outlineText(text: string, fonts: readonly Font[], size: number, x: number, y: number): string {
  const fallback = fonts[0]
  const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' })
  const runs = Array.from(segmenter.segment(text)).reduce<readonly TextRun[]>((previous, { segment }) => {
    const normalized = segment.normalize('NFC')
    const codePoints = Array.from(normalized, (character) => character.codePointAt(0) ?? 0)
    const font = fonts.find((candidate) => codePoints.every((codePoint) => candidate.hasGlyphForCodePoint(codePoint)))
    const last = previous.at(-1)
    if (font && last?.font === font && !last.unsupported) {
      return [...previous.slice(0, -1), { ...last, text: last.text + normalized }]
    }
    return [...previous, { font: font ?? fallback, text: normalized, unsupported: !font }]
  }, [])

  const outlined = runs.reduce<OutlineState>(
    (state, run) => {
      const scale = size / run.font.unitsPerEm
      const missing = run.unsupported ? run.font.getGlyph(0) : undefined
      const layout = missing
        ? {
            glyphs: [missing],
            positions: [{ xAdvance: missing.advanceWidth, yAdvance: 0, xOffset: 0, yOffset: 0 }],
          }
        : run.font.layout(run.text)

      return layout.glyphs.reduce<OutlineState>((pen, glyph, index) => {
        const position = layout.positions[index]
        const glyphX = pen.x + position.xOffset * scale
        const glyphY = pen.y - position.yOffset * scale
        const path = `<path d="${glyph.path.toSVG()}"
          transform="translate(${glyphX} ${glyphY}) scale(${scale} ${-scale})"/>`
        return {
          paths: pen.paths + path,
          x: pen.x + position.xAdvance * scale,
          y: pen.y - position.yAdvance * scale,
        }
      }, state)
    },
    { paths: '', x, y }
  )
  return outlined.paths
}

function wrapTitle(title: string, width: number): string[] {
  const text = title.replace(/\s+/gu, ' ').trim()
  const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' })
  const maxUnits = Math.floor(width / (42 * 0.65))
  const wrapped = text.split(' ').reduce<TitleWrapState>(
    (state, word) => {
      if (state.lines.length >= 4 && state.line) {
        return state
      }

      const graphemes = Array.from(segmenter.segment(word), ({ segment }) => ({
        text: segment,
        units: /^[\u0020-\u024f\u0300-\u036f\u2000-\u206f]+$/u.test(segment) ? 1 : 2,
      }))
      const wordUnits = graphemes.reduce((total, { units }) => total + units, 0)
      const wordStart =
        state.line && state.lineUnits + 1 + wordUnits > maxUnits
          ? { lines: [...state.lines, state.line], line: '', lineUnits: 0 }
          : state
      const spaced = wordStart.line
        ? { ...wordStart, line: `${wordStart.line} `, lineUnits: wordStart.lineUnits + 1 }
        : wordStart

      return graphemes.reduce<TitleWrapState>((current, { text, units }) => {
        if (current.lines.length >= 4 && current.line) {
          return current
        }

        if (current.lineUnits + units > maxUnits) {
          return { lines: [...current.lines, current.line], line: text, lineUnits: units }
        }

        return { ...current, line: current.line + text, lineUnits: current.lineUnits + units }
      }, spaced)
    },
    { lines: [], line: '', lineUnits: 0 }
  )
  const lines = wrapped.line ? [...wrapped.lines, wrapped.line] : wrapped.lines
  const visibleLines = lines.slice(0, 4)

  return visibleLines.map((line, index) => {
    if (lines.length <= visibleLines.length || index !== visibleLines.length - 1) {
      return line
    }

    const graphemes = Array.from(segmenter.segment(line), ({ segment }) => segment)
    return `${graphemes.slice(0, -1).join('').trimEnd()}…`
  })
}

export async function renderSocialImage(input: SocialImageInput, fonts: SocialImageFonts): Promise<Uint8Array> {
  const regular = loadFonts(fonts.regular, 'regular')
  const bold = loadFonts(fonts.bold, 'bold')
  const { thumbnail } = input
  if (thumbnail !== undefined) {
    await sharp(Buffer.from(thumbnail)).metadata()
  }

  const titleLines = wrapTitle(input.title, thumbnail ? 648 : 1056)
  const illustration = thumbnail
    ? `<image x="804" y="174" width="324" height="324"
      preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;base64,${Buffer.from(thumbnail).toString('base64')}"/>`
    : ''

  const title = titleLines.map((line, index) => outlineText(line, regular, 42, 72, 286 + index * 58)).join('')
  const wrapper = `<svg xmlns="http://www.w3.org/2000/svg"
    width="${SOCIAL_IMAGE_WIDTH}" height="${SOCIAL_IMAGE_HEIGHT}"
    viewBox="0 0 ${SOCIAL_IMAGE_WIDTH} ${SOCIAL_IMAGE_HEIGHT}">
    <rect width="100%" height="100%" fill="#0c0d12"/>
    <g fill="#bfbdb6">
      <g fill="#5ac1fe">${outlineText(site.title, bold, 56, 72, 132)}</g>
      ${outlineText(site.subtitle, regular, 28, 72, 178)}
      <rect x="72" y="208" width="80" height="4" fill="#5ac1fe"/>
      ${title}
    </g>
    ${illustration}
  </svg>`

  return await sharp(Buffer.from(wrapper)).flatten({ background: '#0c0d12' }).png().toBuffer()
}
