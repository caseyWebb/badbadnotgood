import {
  equals,
  minLength,
  not,
  onlyIf,
  makeValidator,
  Validator
} from '../src'

test('works with sync validator', () => {
  const validator = onlyIf(not(equals('foo')), minLength(6))

  expect(validator('foo').isValid).toBe(true)
  expect(validator('bar').isValid).toBe(false)
  expect(validator('foobar').isValid).toBe(true)
})

test('works with async validator', async () => {
  const asyncAlwaysTrueValidator = makeValidator(() => Promise.resolve(true))
  const asyncAlwaysFalseValidator = makeValidator(() => Promise.resolve(false))
  const isFoo = equals('foo')

  let validator: Validator<any, any>

  validator = onlyIf(asyncAlwaysTrueValidator, isFoo)
  expect((await validator('')).isValid).toBe(false)
  expect((await validator('foo')).isValid).toBe(true)

  validator = onlyIf(asyncAlwaysFalseValidator, isFoo)
  expect((await validator('')).isValid).toBe(true)
  expect((await validator('foo')).isValid).toBe(true)
})

test('works with callback', () => {
  let skip: boolean
  const fail = makeValidator(() => false)
  const validator = onlyIf(() => !skip, fail)

  skip = true
  expect(validator('foo').isValid).toBe(true)

  skip = false
  expect(validator('foo').isValid).toBe(false)
})
