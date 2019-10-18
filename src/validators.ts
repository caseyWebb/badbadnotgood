import { all, any, not, makeValidator } from './utils'

export type ValidatorMessage = string | symbol

export type ValidatorResult = {
  isValid: boolean
  messages: ValidatorMessage[]
}

export type AsyncValidator<T> = (v: T) => Promise<ValidatorResult>
export type SyncValidator<T> = (v: T) => ValidatorResult
// export type Validator<T> = SyncValidator<T> | AsyncValidator<T>
export type Validator<T> = (v: T) => ValidatorResult | Promise<ValidatorResult>

type ArrayLike = string | any[]

export const equals = <T>(
  target: T,
  message?: ValidatorMessage
): SyncValidator<T> => makeValidator((v) => v === target, message)

export const instanceOf = <T>(
  proto: new () => T,
  message?: ValidatorMessage
): SyncValidator<any> => makeValidator((v) => v instanceof proto, message)

export const isLength = (
  l: number,
  message?: ValidatorMessage
): SyncValidator<ArrayLike> => makeValidator((v) => v.length === l, message)

export const isEmpty = (
  message?: ValidatorMessage
): SyncValidator<ArrayLike | void | null> =>
  any(
    [isNull(), isUndefined(), isLength(0) as ReturnType<typeof isEmpty>],
    message
  )

export const required = isEmpty

export const isArray = (message?: ValidatorMessage): SyncValidator<any> =>
  makeValidator((v) => Array.isArray(v), message)

export const isArrayLike = (message?: ValidatorMessage): SyncValidator<any> =>
  any([isType('string'), isArray()], message)

export const isType = (
  t: string,
  message?: ValidatorMessage
): SyncValidator<any> => makeValidator((v: any) => typeof v === t, message)

export const isDate = (message?: ValidatorMessage): SyncValidator<any> =>
  all<Date>([instanceOf(Date), (v) => isNumber()(v.getTime())], message)

export const isNull = (message?: ValidatorMessage): SyncValidator<any> =>
  equals(null, message)

export const isNumber = (message?: ValidatorMessage): SyncValidator<any> =>
  all([isType('number'), not(makeValidator(isNaN))], message)

export const isInteger = (message?: ValidatorMessage): SyncValidator<number> =>
  all([isNumber(), divisibleBy(1)], message)

export const isUndefined = (message?: ValidatorMessage): SyncValidator<any> =>
  isType('undefined', message)

export const divisibleBy = (
  n: number,
  message?: ValidatorMessage
): SyncValidator<number> => makeValidator((v: number) => v % n === 0, message)

export const max = (
  maxV: number,
  message?: ValidatorMessage
): SyncValidator<number> =>
  all([isNumber(), makeValidator((v: number) => v <= maxV)], message)

export const min = (
  minV: number,
  message?: ValidatorMessage
): SyncValidator<number> =>
  all([isNumber(), makeValidator((v: number) => v >= minV)], message)

export const maxLength = (
  maxL: number,
  message?: ValidatorMessage
): SyncValidator<ArrayLike> => (v: ArrayLike) => max(maxL, message)(v.length)

export const minLength = (
  minL: number,
  message?: ValidatorMessage
): SyncValidator<ArrayLike> => (v: ArrayLike) => min(minL, message)(v.length)

export const pattern = (
  p: RegExp,
  message?: ValidatorMessage
): SyncValidator<string> => makeValidator((v: string) => p.test(v), message)

// very naiive. text parsing should not be relied on for validating emails as there
// are just too many valid possibilities. just send users an email with a confirmation link.
export const email = (message?: ValidatorMessage): SyncValidator<string> =>
  pattern(/.+@.+/, message)
