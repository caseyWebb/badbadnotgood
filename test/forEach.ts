import {
  all,
  equals,
  forEach,
  minLength,
  ForeachValidatorResult,
  ValidatorResult
} from '../src'

test('works as expected', () => {
  const MIN_LENGTH_NOT_MET = Symbol()
  const NOT_FOO = Symbol()
  const NOT_ALL_FOOS = Symbol()
  const isFoo = equals('foo', NOT_FOO)

  const validator = all<string[], symbol | ForeachValidatorResult<symbol>>(
    [
      minLength(3, MIN_LENGTH_NOT_MET),
      forEach<string, symbol, symbol>(isFoo, NOT_ALL_FOOS)
    ],
    undefined,
    true
  )

  let result: ValidatorResult<symbol | ForeachValidatorResult<symbol>>

  result = validator(['foo'])
  expect(result.isValid).toBe(false)
  expect(result.messages).toEqual([MIN_LENGTH_NOT_MET])

  result = validator(['foo', 'bar'])
  expect(result.isValid).toBe(false)
  expect(result.messages).toEqual([
    MIN_LENGTH_NOT_MET,
    NOT_ALL_FOOS,
    { index: 1, messages: [NOT_FOO] }
  ])

  result = validator(['foo', 'bar', 'baz'])
  expect(result.isValid).toBe(false)
  expect(result.messages).toEqual([
    NOT_ALL_FOOS,
    { index: 1, messages: [NOT_FOO] },
    { index: 2, messages: [NOT_FOO] }
  ])

  result = validator(['foo', 'foo', 'foo'])
  expect(result.isValid).toBe(true)
  expect(result.messages).toEqual([])
})
