import { equals, makeValidator, not, Validator } from '../src'

test('works as expected', () => {
  const IS_FOO = Symbol()
  const validator = not(equals('foo'), IS_FOO)

  expect(validator('foo').isValid).toBe(false)
  expect(validator('foo').messages).toEqual([IS_FOO])
  expect(validator('bar').isValid).toBe(true)
  expect(validator('bar').messages).toEqual([])
})

test('works with async validator', async () => {
  const asyncAlwaysTrueValidator = makeValidator(() => Promise.resolve(true))
  const asyncAlwaysFalseValidator = makeValidator(() => Promise.resolve(false))

  let validator: Validator<any>

  validator = not(asyncAlwaysTrueValidator)
  expect((await validator('')).isValid).toBe(false)

  validator = not(asyncAlwaysFalseValidator)
  expect((await validator('')).isValid).toBe(true)
})
