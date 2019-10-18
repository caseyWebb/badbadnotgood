import {
  equals,
  instanceOf,
  isLength,
  isEmpty,
  isType,
  isDate,
  isNull,
  isArray,
  isArrayLike,
  isNumber,
  isInteger,
  isUndefined,
  divisibleBy,
  max,
  min,
  maxLength,
  minLength,
  pattern,
  email,
  SyncValidator
} from '../src'

function testValidator<T>(
  name: string,
  validator: SyncValidator<T>,
  good: T[],
  bad: any[]
) {
  test(name, () => {
    good.forEach((v) => expect(validator(v).isValid).toBe(true))
    bad.forEach((v) => expect(validator(v).isValid).toBe(false))
  })
}

testValidator('equals', equals('foo'), ['foo'], ['bar'])

class Foo {}
class SubFoo extends Foo {}
class Bar {}
testValidator(
  'instanceOf',
  instanceOf(Foo),
  [new Foo(), new SubFoo()],
  [Foo, new Bar()]
)

testValidator('isLength', isLength(3), ['abc', [1, 2, 3]], ['aoeu', [1, 2]])

testValidator(
  'isEmpty',
  isEmpty(),
  ['', [], null, undefined],
  [1, false, 'foo', [1]]
)

testValidator('isType', isType('string'), ['abc'], [123])

testValidator('isDate', isDate(), [new Date()], [new Date('foobar'), 'abc'])

testValidator('isNull', isNull(), [null], [undefined, false, 123, 'abc'])

testValidator('isArray', isArray(), [[]], ['aoeu', true, 1])

testValidator('isArrayLike', isArrayLike(), [[], ''], [true, 1])

testValidator('isNumber', isNumber(), [123, 123.456], ['abc', []])

testValidator('isInteger', isInteger(), [123], [123.456, 'abc', []])

testValidator('isUndefined', isUndefined(), [undefined], [null, false, [], 0])

testValidator('divisibleBy', divisibleBy(3), [0, 3, 6, 9], [1, 'abc'])

testValidator('max', max(1), [0, 1], [2])

testValidator('min', min(1), [1, 2], [0])

testValidator('maxLength', maxLength(1), [[], ['foo'], 'f'], [[1, 2], 'foo'])

testValidator('minLength', minLength(1), [[1, 2], ['foo'], 'f'], [[], ''])

testValidator('pattern', pattern(/[aoeu]+/), ['aoeu', 'ueoa'], ['snth'])

testValidator('email', email(), ['notcaseywebb@gmail.com'], ['foo'])
