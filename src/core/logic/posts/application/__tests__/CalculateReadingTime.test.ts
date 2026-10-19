import { test } from 'bun:test'
import assert from 'node:assert/strict'
import CalculateReadingTime from '@/core/logic/posts/application/CalculateReadingTime'

test.each([
  [0, 0],
  [1, 1],
  [199, 1],
  [200, 1],
  [201, 2],
  [400, 2],
  [401, 3],
])('estimates %i words as %i minutes', (wordCount, expectedMinutes) => {
  const text = Array(wordCount).fill('word').join(' ')

  assert.equal(CalculateReadingTime.execute(text), expectedMinutes)
})

test('returns zero for whitespace-only text', () => {
  assert.equal(CalculateReadingTime.execute(' \t\n\r\n\u00a0\u2003 '), 0)
})

test('ignores repeated and surrounding whitespace when counting words', () => {
  const text = ` \t\n${Array(200).fill('word').join(' \t\n\r\n\u00a0\u2003 ')} \t\n`

  assert.equal(CalculateReadingTime.execute(text), 1)
  assert.equal(CalculateReadingTime.execute(`${text}word`), 2)
})

test.each(['café', 'cafe\u0301', '中文', 'привет', 'مرحبا', '१२३', '𝟙𝟚𝟛', 'version２'])(
  'counts Unicode tokens such as %s',
  (word) => {
    const text = Array(200).fill(word).join(' ')

    assert.equal(CalculateReadingTime.execute(text), 1)
    assert.equal(CalculateReadingTime.execute(`${text} ${word}`), 2)
  }
)

test('returns zero for standalone punctuation, symbols, emoji and combining marks', () => {
  assert.equal(CalculateReadingTime.execute('# ** --- ... ,;:!? () [] {} / + = € © 🚀 \u0301'), 0)
})

test('counts words separated by punctuation without counting standalone symbols', () => {
  const text = `${'word,'.repeat(200)} # ** --- !? 🚀`

  assert.equal(CalculateReadingTime.execute(text), 1)
  assert.equal(CalculateReadingTime.execute(`${text}(word)`), 2)
})
