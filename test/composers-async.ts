import {
  all,
  any,
  makeValidator,
  AsyncValidator,
  ValidatorResult,
} from '../src'

const divisibleBy = <TMessage>(
  n: number,
  message?: TMessage
): AsyncValidator<number, TMessage> =>
  makeValidator((v: number) => Promise.resolve(v % n === 0), message)

describe('all', () => {
  test('works as expected', async () => {
    const NOT_DIVISIBLE_BY_3 = Symbol()
    const NOT_DIVISIBLE_BY_4 = Symbol()
    const NOT_DIVISIBLE_BY_3_AND_4 = Symbol()

    let validator = all<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_AND_4
    )
    let result: ValidatorResult<symbol>

    result = await validator(12)
    expect(result.isValid).toBe(true)
    expect(result.messages).toEqual([])

    result = await validator(6)
    expect(result.isValid).toBe(false)
    expect(result.messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_4,
    ])

    result = await validator(1)
    expect(result.isValid).toBe(false)
    expect(result.messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_3,
      NOT_DIVISIBLE_BY_4,
    ])

    validator = all<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_AND_4,
      false
    )

    result = await validator(12)
    expect(result.isValid).toBe(true)
    expect(result.messages).toEqual([])

    result = await validator(6)
    expect(result.isValid).toBe(false)
    expect(result.messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_4,
    ])

    result = await validator(1)
    expect(result.isValid).toBe(false)
    expect(result.messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_3,
    ])
  })
})

describe('any', () => {
  test('works as expected', async () => {
    const NOT_DIVISIBLE_BY_3 = Symbol()
    const NOT_DIVISIBLE_BY_4 = Symbol()
    const NOT_DIVISIBLE_BY_3_OR_4 = Symbol()

    let validator = any<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_OR_4
    )
    let result: ValidatorResult<symbol>

    result = await validator(12)
    expect(result.isValid).toBe(true)
    expect(result.messages).toEqual([])

    result = await validator(6)
    expect(result.isValid).toBe(true)
    expect(result.messages).toEqual([])

    result = await validator(1)
    expect(result.isValid).toBe(false)
    expect(result.messages).toEqual([
      NOT_DIVISIBLE_BY_3_OR_4,
      NOT_DIVISIBLE_BY_3,
      NOT_DIVISIBLE_BY_4,
    ])

    validator = any<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_OR_4,
      true
    )

    result = await validator(12)
    expect(result.isValid).toBe(true)
    expect(result.messages).toEqual([])

    result = await validator(6)
    expect(result.isValid).toBe(true)
    expect(result.messages).toEqual([])

    result = await validator(1)
    expect(result.isValid).toBe(false)
    expect(result.messages).toEqual([
      NOT_DIVISIBLE_BY_3_OR_4,
      NOT_DIVISIBLE_BY_3,
      NOT_DIVISIBLE_BY_4,
    ])
  })
})
