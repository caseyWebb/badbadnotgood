import { invoke, equals } from '../src'

test('works as expected', () => {
  const returnsFoo = invoke(equals('foo'))
  expect(returnsFoo(() => 'foo').isValid).toBe(true)
  expect(returnsFoo(() => 'bar').isValid).toBe(false)
})

test('can pass arguments', () => {
  const identity = (v: string) => v
  const returnsArg = invoke<string, any, [string]>(equals('foo'), ['foo'])
  expect(returnsArg(identity).isValid).toBe(true)
})
