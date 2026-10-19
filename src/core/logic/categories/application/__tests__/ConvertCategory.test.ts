import { expect, test } from 'bun:test'
import ConvertCategory from '@/core/logic/categories/application/ConvertCategory'

test('projects source metadata into a category without transport fields', () => {
  const source = {
    id: 'architecture',
    collection: 'categories',
    data: {
      name: 'Arquitectura',
      description: 'Decisiones más duraderas que el framework de turno.',
      extra: 'not part of the domain',
    },
  }

  expect(ConvertCategory.execute(source)).toEqual({
    id: 'architecture',
    name: 'Arquitectura',
    description: 'Decisiones más duraderas que el framework de turno.',
  })
})

test('preserves source values without normalization', () => {
  const source = {
    id: 'Mixed-Case',
    data: { name: '  Herramientas  ', description: '' },
  }

  expect(ConvertCategory.execute(source)).toEqual({
    id: 'Mixed-Case',
    name: '  Herramientas  ',
    description: '',
  })
})

test('creates a new category without mutating its source', () => {
  const source = Object.freeze({
    id: 'tools',
    data: Object.freeze({ name: 'Herramientas', description: 'Más herramientas, menos excusas.' }),
  })
  const original = structuredClone(source)

  const category = ConvertCategory.execute(source)

  expect(source).toEqual(original)
  expect(category).not.toBe(source)
  expect(category).not.toBe(source.data)
  category.name = 'Otro nombre'
  expect(source).toEqual(original)
})
