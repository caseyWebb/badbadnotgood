import {
  prop,
  equals,
  ValidatorResult,
  PropertyValidatorResult,
  schema,
} from '../src'

test('works as expected', () => {
  const PROP_IS_INVALID = Symbol()
  const PROP_IS_NOT_FOO = Symbol()
  const validator = prop<{ foo: string }, symbol>(
    'foo',
    equals('foo', PROP_IS_NOT_FOO),
    PROP_IS_INVALID
  )
  let results: ValidatorResult<
    symbol | PropertyValidatorResult<{ foo: string }, symbol>
  >

  results = validator({ foo: 'foo' })
  expect(results.isValid).toBe(true)
  expect(results.messages).toEqual([])

  results = validator({ foo: 'bar' })
  expect(results.isValid).toBe(false)
  expect(results.messages).toEqual([
    PROP_IS_INVALID,
    { property: 'foo', messages: [PROP_IS_NOT_FOO] },
  ])
})

test('validateObject composer', () => {
  const OBJECT_IS_INVALID = Symbol()
  const PROP_IS_NOT_FOO = Symbol()
  const validator = schema<{ foo: string }, symbol>(
    { foo: equals('foo', PROP_IS_NOT_FOO) },
    OBJECT_IS_INVALID
  )
  let results: ValidatorResult<
    symbol | PropertyValidatorResult<{ foo: string }, symbol>
  >

  results = validator({ foo: 'foo' })
  expect(results.isValid).toBe(true)
  expect(results.messages).toEqual([])

  results = validator({ foo: 'bar' })
  expect(results.isValid).toBe(false)
  expect(results.messages).toEqual([
    OBJECT_IS_INVALID,
    { property: 'foo', messages: [PROP_IS_NOT_FOO] },
  ])
})
