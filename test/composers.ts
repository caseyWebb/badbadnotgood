import { all, any, divisibleBy, makeValidator, Validator } from '../src'

describe('all', () => {
  test('works as expected', () => {
    const NOT_DIVISIBLE_BY_3 = Symbol()
    const NOT_DIVISIBLE_BY_4 = Symbol()
    const NOT_DIVISIBLE_BY_3_AND_4 = Symbol()

    let validator = all<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_AND_4
    )

    expect(validator(12).isValid).toBe(true)
    expect(validator(12).messages).toEqual([])

    expect(validator(6).isValid).toBe(false)
    expect(validator(6).messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_4,
    ])

    expect(validator(1).isValid).toBe(false)
    expect(validator(1).messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_3,
      NOT_DIVISIBLE_BY_4,
    ])

    validator = all<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_AND_4,
      false
    )

    expect(validator(12).isValid).toBe(true)
    expect(validator(12).messages).toEqual([])

    expect(validator(6).isValid).toBe(false)
    expect(validator(6).messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_4,
    ])

    expect(validator(1).isValid).toBe(false)
    expect(validator(1).messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_3,
    ])
  })

  testSeriality(all)
  testConcurrency(all)
})

describe('any', () => {
  test('works as expected', () => {
    const NOT_DIVISIBLE_BY_3 = Symbol()
    const NOT_DIVISIBLE_BY_4 = Symbol()
    const NOT_DIVISIBLE_BY_3_OR_4 = Symbol()

    let validator = any<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_OR_4
    )

    expect(validator(12).isValid).toBe(true)
    expect(validator(12).messages).toEqual([])

    expect(validator(6).isValid).toBe(true)
    expect(validator(6).messages).toEqual([])

    expect(validator(1).isValid).toBe(false)
    expect(validator(1).messages).toEqual([
      NOT_DIVISIBLE_BY_3_OR_4,
      NOT_DIVISIBLE_BY_3,
      NOT_DIVISIBLE_BY_4,
    ])

    validator = any<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_OR_4,
      true
    )

    expect(validator(12).isValid).toBe(true)
    expect(validator(12).messages).toEqual([])

    expect(validator(6).isValid).toBe(true)
    expect(validator(6).messages).toEqual([])

    expect(validator(1).isValid).toBe(false)
    expect(validator(1).messages).toEqual([
      NOT_DIVISIBLE_BY_3_OR_4,
      NOT_DIVISIBLE_BY_3,
      NOT_DIVISIBLE_BY_4,
    ])
  })

  testSeriality(any)
  testConcurrency(any)
})

function testConcurrency(
  composer: (validators: Validator<any, any>[]) => Validator<string, any>
) {
  test('composer collects all messages by default (concurrent)', async () => {
    jest.useFakeTimers()

    const spy = jest.fn()
    const first = makeValidator(
      () =>
        new Promise<boolean>((resolve) =>
          setTimeout(() => {
            spy()
            resolve(true)
          }, 2000)
        )
    )
    const second = makeValidator(() => {
      expect(spy).not.toBeCalled()
      return true
    })
    const validator = composer([first, second])
    const p = validator('')

    jest.runAllTimers()

    await p
  })
}

function testSeriality(
  composer: (
    validators: Validator<any, any>[],
    message: any,
    concurrent: boolean
  ) => Validator<string, any>
) {
  test('validators can optionally fast-fail (series)', async () => {
    jest.useFakeTimers()

    const spy = jest.fn()
    const first = makeValidator(
      () =>
        new Promise<boolean>((resolve) =>
          setTimeout(() => {
            spy()
            resolve(true)
          }, 2000)
        )
    )
    const second = makeValidator(() => {
      expect(spy).toBeCalled()
      return true
    })
    const validator = composer([first, second], '', false)
    const p = validator('')

    jest.runAllTimers()

    await p
  })
}
