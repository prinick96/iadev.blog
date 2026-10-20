import { beforeAll, describe, expect, test } from 'bun:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import type { SocialImageFonts, SocialImageInput } from '@/ui/types/socialImage'
import { renderSocialImage } from '@/ui/utils/renderSocialImage'

let fonts: SocialImageFonts

beforeAll(async () => {
  const [regular, bold] = await Promise.all(
    [400, 700].map(async (weight) =>
      Promise.all(
        ['latin', 'latin-ext'].map(async (subset) => {
          const file = new URL(
            `../../assets/fonts/ibm-plex-mono/ibm-plex-mono-${subset}-${weight}-normal.woff2`,
            import.meta.url
          )
          return new Uint8Array(await Bun.file(file).arrayBuffer())
        })
      )
    )
  )
  fonts = { regular, bold }
})

async function renderImage(input: SocialImageInput): Promise<Uint8Array> {
  return await renderSocialImage(input, fonts)
}

const background = [12, 13, 18]
const squareVector = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <path fill="#ff0000" d="M0 0h100v100H0z"/>
</svg>`

async function readPixels(image: Uint8Array, left: number, top: number, width = 1, height = 1): Promise<Buffer> {
  return await sharp(image).extract({ left, top, width, height }).removeAlpha().raw().toBuffer()
}

function containsOnlyBackground(pixels: Uint8Array): boolean {
  return pixels.every((value, index) => value === background[index % 3])
}

describe('renderSocialImage', () => {
  test('renders an opaque 1200 by 630 PNG with local fonts and no thumbnail', async () => {
    const image = await renderImage({ title: 'Programación y café' })

    expect(await sharp(image).metadata()).toMatchObject({ format: 'png', width: 1200, height: 630, hasAlpha: false })
    expect(Array.from(await readPixels(image, 0, 0))).toEqual(background)
    expect(containsOnlyBackground(await readPixels(image, 72, 60, 500, 80))).toBe(false)
    expect(containsOnlyBackground(await readPixels(image, 72, 230, 1056, 65))).toBe(false)
  })

  test('uses bold outlines for the brand and regular outlines for the subtitle and title', async () => {
    const input = { title: 'Programación y café' }
    const original = await renderImage(input)
    const changedBrand = await renderSocialImage(input, { ...fonts, bold: fonts.regular })
    const changedText = await renderSocialImage(input, { ...fonts, regular: fonts.bold })

    const brand = await readPixels(original, 72, 60, 500, 80)
    const subtitle = await readPixels(original, 72, 140, 650, 40)
    const title = await readPixels(original, 72, 230, 1056, 65)
    expect(brand.equals(await readPixels(changedBrand, 72, 60, 500, 80))).toBe(false)
    expect(brand.equals(await readPixels(changedText, 72, 60, 500, 80))).toBe(true)
    expect(subtitle.equals(await readPixels(changedBrand, 72, 140, 650, 40))).toBe(true)
    expect(subtitle.equals(await readPixels(changedText, 72, 140, 650, 40))).toBe(false)
    expect(title.equals(await readPixels(changedBrand, 72, 230, 1056, 65))).toBe(true)
    expect(title.equals(await readPixels(changedText, 72, 230, 1056, 65))).toBe(false)
  })

  test('uses the extended subset for characters missing from the primary subset', async () => {
    const input = { title: 'Programación café ñ ŁČőẞ' }
    const original = await renderImage(input)
    const withoutExtended = await renderSocialImage(input, { ...fonts, regular: fonts.regular.slice(0, 1) })

    expect(
      (await readPixels(original, 72, 230, 1056, 65)).equals(await readPixels(withoutExtended, 72, 230, 1056, 65))
    ).toBe(false)
  })

  test('normalizes decomposed accents before rendering', async () => {
    const decomposed = await renderImage({ title: 'Programacio\u0301n y cafe\u0301' })
    const composed = await renderImage({ title: 'Programación y café' })

    expect(Buffer.from(decomposed).equals(Buffer.from(composed))).toBe(true)
  })

  test('renders an unsupported joined emoji as one missing glyph', async () => {
    const joined = await renderImage({ title: 'Café y 👩🏽‍💻' })
    const single = await renderImage({ title: 'Café y 🚀' })

    expect(Buffer.from(joined).equals(Buffer.from(single))).toBe(true)
  })

  test.each(['regular', 'bold'] as const)('rejects missing %s fonts', async (weight) => {
    await assert.rejects(renderSocialImage({ title: 'Programación y café' }, { ...fonts, [weight]: [] }), {
      message: `Missing social image ${weight} fonts`,
    })
  })

  test('rejects invalid font bytes with a useful error', async () => {
    await assert.rejects(
      renderSocialImage({ title: 'Programación y café' }, { ...fonts, regular: [new Uint8Array([1, 2, 3])] }),
      { message: 'Invalid social image regular font at index 0' }
    )
  })

  test('rejects a font collection instead of accepting it as a single font', async () => {
    const collection = Buffer.alloc(12)
    collection.write('ttcf')
    collection.writeUInt32BE(0x00010000, 4)

    await assert.rejects(renderSocialImage({ title: 'Programación y café' }, { ...fonts, regular: [collection] }), {
      message: 'Invalid social image regular font at index 0',
    })
  })

  test('draws the supplied vector thumbnail', async () => {
    const input = { title: 'Programación y café' }
    const withoutThumbnail = await renderImage(input)
    const image = await renderImage({ ...input, thumbnail: squareVector })

    expect(Array.from(await readPixels(image, 966, 336))).toEqual([255, 0, 0])
    expect(Array.from(await readPixels(withoutThumbnail, 966, 336))).toEqual(background)
  })

  test.each([
    { width: 200, height: 100, left: 804, top: 255, right: 1128, bottom: 417 },
    { width: 100, height: 200, left: 885, top: 174, right: 1047, bottom: 498 },
  ])('preserves proportions and edges for a $width by $height vector', async (shape) => {
    const thumbnail = `<svg xmlns="http://www.w3.org/2000/svg" width="${shape.width}" height="${shape.height}"
      viewBox="10 20 ${shape.width} ${shape.height}">
      <path fill="#ff0000" d="M10 20h${shape.width}v${shape.height}H10z"/>
    </svg>`
    const image = await renderImage({ title: 'Programación y café', thumbnail })
    const corners: readonly [number, number][] = [
      [shape.left + 1, shape.top + 1],
      [shape.right - 2, shape.top + 1],
      [shape.left + 1, shape.bottom - 2],
      [shape.right - 2, shape.bottom - 2],
    ]

    for (const [x, y] of corners) {
      expect(Array.from(await readPixels(image, x, y))).toEqual([255, 0, 0])
    }
    expect(Array.from(await readPixels(image, shape.left - 1, 336))).toEqual(background)
    expect(Array.from(await readPixels(image, shape.right, 336))).toEqual(background)
    expect(Array.from(await readPixels(image, 966, shape.top - 1))).toEqual(background)
    expect(Array.from(await readPixels(image, 966, shape.bottom))).toEqual(background)
  })

  test('renders fine paths at the final vector resolution, not from a 192 pixel bitmap', async () => {
    const paths = Array.from(
      { length: 100 },
      (_, index) => `<path fill="#ff0000" d="M${index + 0.125} 0h0.25v100h-0.25z"/>`
    ).join('')
    const thumbnail = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"
      viewBox="0 0 100 100" shape-rendering="crispEdges">
      <path fill="#0c0d12" d="M0 0h100v100H0z"/>${paths}
    </svg>`
    const image = await renderImage({ title: 'Programación y café', thumbnail })
    const actual = await readPixels(image, 804, 174, 324, 324)
    const fullSize = thumbnail.replace('width="100" height="100"', 'width="324" height="324"')
    const expected = await sharp(Buffer.from(fullSize)).removeAlpha().raw().toBuffer()
    const raster = await sharp(Buffer.from(thumbnail)).resize(192, 192).png().toBuffer()
    const enlargedRaster = await sharp(raster).resize(324, 324).removeAlpha().raw().toBuffer()

    expect(actual.equals(expected)).toBe(true)
    expect(actual.equals(enlargedRaster)).toBe(false)
  })

  test('renders a local SVG with an XML declaration and internal references', async () => {
    const thumbnail = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <defs><path id="square" d="M0 0h100v100H0z"/></defs>
        <use href="#square" fill="#ff0000"/>
      </svg>`
    const image = await renderImage({ title: 'Programación y café', thumbnail })

    expect(Array.from(await readPixels(image, 966, 336))).toEqual([255, 0, 0])
  })

  test.each([
    { kind: 'empty', thumbnail: '' },
    { kind: 'malformed', thumbnail: '<svg xmlns="http://www.w3.org/2000/svg"><path></svg>' },
  ])('fails for a $kind thumbnail instead of silently omitting it', async ({ thumbnail }) => {
    await assert.rejects(renderImage({ title: 'Programación y café', thumbnail }))
  })

  test('renders XML metacharacters as title glyphs', async () => {
    const image = await renderImage({ title: 'AT&T, tipos <T> y "comillas"' })

    expect(Array.from(await readPixels(image, 1199, 629))).toEqual(background)
    expect(containsOnlyBackground(await readPixels(image, 72, 230, 1056, 260))).toBe(false)
  })

  test.each([
    { kind: 'words', title: 'La IA necesita más contexto antes de escribir código. '.repeat(4) },
    { kind: 'an unbroken word', title: 'a'.repeat(180) },
  ])('keeps a long title made of $kind inside the image bounds', async ({ title }) => {
    for (const thumbnail of [undefined, squareVector]) {
      const image = await renderImage({ title, thumbnail })

      expect(containsOnlyBackground(await readPixels(image, 0, 0, 60, 630))).toBe(true)
      expect(containsOnlyBackground(await readPixels(image, 1136, 0, 64, 630))).toBe(true)
      expect(containsOnlyBackground(await readPixels(image, 0, 510, 1200, 120))).toBe(true)
      if (thumbnail) {
        expect(containsOnlyBackground(await readPixels(image, 740, 230, 60, 270))).toBe(true)
      }
      for (const top of [242, 300, 358, 416]) {
        expect(containsOnlyBackground(await readPixels(image, 72, top, 648, 50))).toBe(false)
      }
    }
  })

  test.each([
    { word: 'a'.repeat(23), lastLine: `${'a'.repeat(22)}…` },
    { word: `${'a'.repeat(21)}👩🏽‍💻`, lastLine: `${'a'.repeat(21)}…` },
  ])('adds an ellipsis after four lines without splitting the last grapheme: $word', async ({ word, lastLine }) => {
    const fourLines = Array.from({ length: 4 }, () => word).join(' ')
    const overflow = await renderImage({ title: `${fourLines} extra`, thumbnail: squareVector })
    const expectedTitle = [...Array.from({ length: 3 }, () => word), lastLine].join(' ')
    const expected = await renderImage({ title: expectedTitle, thumbnail: squareVector })
    const withoutOverflow = await renderImage({ title: fourLines, thumbnail: squareVector })

    expect(Buffer.from(overflow).equals(Buffer.from(expected))).toBe(true)
    expect(Buffer.from(overflow).equals(Buffer.from(withoutOverflow))).toBe(false)
  })

  test('normalizes whitespace for the image without modifying its input', async () => {
    const input = { title: '  Programación,\n\t café  ', thumbnail: squareVector }
    const before = structuredClone(input)
    const image = await renderImage(input)
    const normalized = await renderImage({ ...input, title: 'Programación, café' })

    expect(Buffer.from(image).equals(Buffer.from(normalized))).toBe(true)
    expect(input).toStrictEqual(before)
  })
})
