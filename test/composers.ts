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
      NOT_DIVISIBLE_BY_4
    ])

    expect(validator(1).isValid).toBe(false)
    expect(validator(1).messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_3
    ])

    validator = all<number, symbol>(
      [divisibleBy(3, NOT_DIVISIBLE_BY_3), divisibleBy(4, NOT_DIVISIBLE_BY_4)],
      NOT_DIVISIBLE_BY_3_AND_4,
      true
    )

    expect(validator(12).isValid).toBe(true)
    expect(validator(12).messages).toEqual([])

    expect(validator(6).isValid).toBe(false)
    expect(validator(6).messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_4
    ])

    expect(validator(1).isValid).toBe(false)
    expect(validator(1).messages).toEqual([
      NOT_DIVISIBLE_BY_3_AND_4,
      NOT_DIVISIBLE_BY_3,
      NOT_DIVISIBLE_BY_4
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
      NOT_DIVISIBLE_BY_4
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
      NOT_DIVISIBLE_BY_4
    ])
  })

  testSeriality(any)
  testConcurrency(any)
})

function testSeriality(
  composer: (validators: Validator<any, any>[]) => Validator<string, any>
) {
  test('validators run in series by default', async () => {
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
    const validator = composer([first, second])
    const p = validator('')

    jest.runAllTimers()

    await p
  })
}

function testConcurrency(
  composer: (
    validators: Validator<any, any>[],
    message: string,
    concurrent: boolean
  ) => Validator<string, any>
) {
  test('validators run concurrently when collecting all messages', async () => {
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
    const validator = composer([first, second], '', true)
    const p = validator('')

    jest.runAllTimers()

    await p
  })
}
