/* eslint-disable @typescript-eslint/no-explicit-any */

import { all, any } from './composers'
import { not, makeValidator } from './utils'

export type ValidatorResult<TMessage> = {
  isValid: boolean
  messages: TMessage[]
}

export type AsyncValidator<T, TMessage> = (
  v: T
) => Promise<ValidatorResult<TMessage>>
export type SyncValidator<T, TMessage> = (v: T) => ValidatorResult<TMessage>
// export type Validator<T> = SyncValidator<T> | AsyncValidator<T>
export type Validator<T, TMessage> = (
  v: T
) => ValidatorResult<TMessage> | Promise<ValidatorResult<TMessage>>

type ArrayLike = string | any[]

export const equals = <T, TMessage = never>(
  target: T,
  message?: TMessage
): SyncValidator<T, TMessage> => makeValidator((v) => v === target, message)

export const instanceOf = <T, TMessage = never>(
  proto: new () => T,
  message?: TMessage
): SyncValidator<any, TMessage> =>
  makeValidator((v) => v instanceof proto, message)

export const isLength = <TMessage = never>(
  l: number,
  message?: TMessage
): SyncValidator<ArrayLike, TMessage> =>
  makeValidator((v) => v.length === l, message)

export const isType = <TMessage = never>(
  t: string,
  message?: TMessage
): SyncValidator<any, TMessage> =>
  makeValidator((v: any) => typeof v === t, message)

export const isNull = <TMessage = never>(
  message?: TMessage
): SyncValidator<any, TMessage> => equals(null, message)

export const isUndefined = <TMessage = never>(
  message?: TMessage
): SyncValidator<any, TMessage> => isType('undefined', message)

export const isEmpty = <TMessage = never>(
  message?: TMessage
): SyncValidator<ArrayLike | void | null, TMessage> =>
  any(
    [
      isNull(),
      isUndefined(),
      isLength(0) as SyncValidator<ArrayLike | void | null, never>
    ],
    message
  )

export const required = isEmpty

export const isArray = <TMessage = never>(
  message?: TMessage
): SyncValidator<any, TMessage> =>
  makeValidator((v) => Array.isArray(v), message)

export const isArrayLike = <TMessage = never>(
  message?: TMessage
): SyncValidator<any, TMessage> => any([isType('string'), isArray()], message)

export const isNumber = <TMessage = never>(
  message?: TMessage
): SyncValidator<any, TMessage> =>
  all([isType('number'), not(makeValidator(isNaN))], message)

export const isDate = <TMessage = never>(
  message?: TMessage
): SyncValidator<any, TMessage> =>
  all<Date, TMessage>(
    [instanceOf(Date), (v) => isNumber()(v.getTime())],
    message
  )

export const divisibleBy = <TMessage = never>(
  n: number,
  message?: TMessage
): SyncValidator<number, TMessage> =>
  makeValidator((v: number) => v % n === 0, message)

export const isInteger = <TMessage = never>(
  message?: TMessage
): SyncValidator<number, TMessage> => all([isNumber(), divisibleBy(1)], message)

export const max = <TMessage = never>(
  maxV: number,
  message?: TMessage
): SyncValidator<number, TMessage> =>
  all([isNumber(), makeValidator((v: number) => v <= maxV)], message)

export const min = <TMessage = never>(
  minV: number,
  message?: TMessage
): SyncValidator<number, TMessage> =>
  all([isNumber(), makeValidator((v: number) => v >= minV)], message)

export const maxLength = <TMessage = never>(
  maxL: number,
  message?: TMessage
): SyncValidator<ArrayLike, TMessage> => (v: ArrayLike) =>
  max(maxL, message)(v.length)

export const minLength = <TMessage = never>(
  minL: number,
  message?: TMessage
): SyncValidator<ArrayLike, TMessage> => (v: ArrayLike) =>
  min(minL, message)(v.length)

export const pattern = <TMessage = never>(
  p: RegExp,
  message?: TMessage
): SyncValidator<string, TMessage> =>
  makeValidator((v: string) => p.test(v), message)

// very naiive. text parsing should not be relied on for validating emails as there
// are just too many valid possibilities. just send users an email with a confirmation link.
export const email = <TMessage = never>(
  message?: TMessage
): SyncValidator<string, TMessage> => pattern(/.+@.+/, message)
