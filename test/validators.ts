import {
  equals,
  equalsInvoke,
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
  required,
  email,
  SyncValidator,
} from '../src'

const NO_GOOD = Symbol()

function testValidator<T>(
  name: string,
  validator: SyncValidator<T, symbol>,
  good: T[],
  bad: any[]
) {
  test(name, () => {
    good.forEach((v) => expect(validator(v).isValid).toBe(true))
    bad.forEach((v) => {
      const { isValid, messages } = validator(v)
      expect(isValid).toBe(false)
      expect(messages[0]).toBe(NO_GOOD)
    })
  })
}

testValidator('equals', equals('foo', NO_GOOD), ['foo'], ['bar'])

testValidator(
  'equalsInvoke',
  equalsInvoke(() => 'foo', NO_GOOD),
  ['foo'],
  ['bar']
)

class Foo {}
class SubFoo extends Foo {}
class Bar {}
testValidator(
  'instanceOf',
  instanceOf(Foo, NO_GOOD),
  [new Foo(), new SubFoo()],
  [Foo, new Bar()]
)

testValidator(
  'isLength',
  isLength(3, NO_GOOD),
  ['abc', [1, 2, 3]],
  ['aoeu', [1, 2]]
)

testValidator(
  'isEmpty',
  isEmpty(NO_GOOD),
  ['', [], null, undefined],
  [1, false, 'foo', [1]]
)

testValidator(
  'required',
  required(NO_GOOD),
  [1, false, 'foo', [1]],
  ['', [], null, undefined]
)

testValidator('isType', isType('string', NO_GOOD), ['abc'], [123])

testValidator(
  'isDate',
  isDate(NO_GOOD),
  [new Date()],
  [new Date('foobar'), 'abc']
)

testValidator('isNull', isNull(NO_GOOD), [null], [undefined, false, 123, 'abc'])

testValidator('isArray', isArray(NO_GOOD), [[]], ['aoeu', true, 1])

testValidator('isArrayLike', isArrayLike(NO_GOOD), [[], ''], [true, 1])

testValidator('isNumber', isNumber(NO_GOOD), [123, 123.456], ['abc', []])

testValidator('isInteger', isInteger(NO_GOOD), [123], [123.456, 'abc', []])

testValidator(
  'isUndefined',
  isUndefined(NO_GOOD),
  [undefined],
  [null, false, [], 0]
)

testValidator('divisibleBy', divisibleBy(3, NO_GOOD), [0, 3, 6, 9], [1, 'abc'])

testValidator('max', max(1, NO_GOOD), [0, 1], [2])

testValidator('min', min(1, NO_GOOD), [1, 2], [0])

testValidator(
  'maxLength',
  maxLength(1, NO_GOOD),
  [[], ['foo'], 'f'],
  [[1, 2], 'foo']
)

testValidator(
  'minLength',
  minLength(1, NO_GOOD),
  [[1, 2], ['foo'], 'f'],
  [[], '']
)

testValidator(
  'pattern',
  pattern(/[aoeu]+/, NO_GOOD),
  ['aoeu', 'ueoa'],
  ['snth']
)

testValidator('email', email(NO_GOOD), ['notcaseywebb@gmail.com'], ['foo'])
