import { expect, test } from 'bun:test'
import CalculateTokens from '@/core/logic/posts/application/CalculateTokens'

test.each([
  ['', 0],
  ['Hello, world!', 4],
  ['¡Hola, mundo!', 5],
  ['你好，世界！', 4],
  ['café 👩‍💻', 7],
  [' \n\t', 2],
  ['  Hello, world!\n', 5],
  ['## Title\n\n**Hello**, [world](https://example.com).', 14],
  ['const answer = 42;\nconsole.log(answer);', 10],
])('counts GPT-5.6 Luna tokens for %j as %i', (text, expected) => {
  expect(CalculateTokens.execute(text)).toBe(expected)
})

test.each([
  ['<|endoftext|>', 7],
  ['before <|endoftext|> after', 9],
])('treats special-token markers in %j as literal article text', (text, expected) => {
  expect(CalculateTokens.execute(text)).toBe(expected)
})

test('counts the complete text rather than only its beginning', () => {
  const text = Array(401).fill('word').join(' ')

  expect(CalculateTokens.execute(text)).toBe(401)
})

test('counts the combined text including separators instead of adding independent counts', () => {
  expect(CalculateTokens.execute('Hello')).toBe(1)
  expect(CalculateTokens.execute('world')).toBe(1)
  expect(CalculateTokens.execute('Hello\n\nworld')).toBe(3)
})
