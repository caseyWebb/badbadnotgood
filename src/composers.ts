import { PropertyValidatorResult, prop } from './utils'
import {
  SyncValidator,
  Validator,
  AsyncValidator,
  ValidatorResult
} from './validators'

export function all<T, TMessage>(
  validators: SyncValidator<T, TMessage>[],
  message?: TMessage,
  concurrent?: boolean
): SyncValidator<T, TMessage>
export function all<T, TMessage>(
  validators: Validator<T, TMessage>[],
  message?: TMessage,
  concurrent?: boolean
): AsyncValidator<T, TMessage>
export function all<T, TMessage>(
  validators: Validator<T, TMessage>[],
  message?: TMessage,
  concurrent = true
): Validator<T, TMessage> {
  if (concurrent) {
    return _composeConcurrent<T, TMessage>(
      validators,
      (results) => results.every((res) => res.isValid),
      message
    )
  } else {
    return _makeSeriesComposer<T, TMessage>(
      validators,
      (res) => {
        if (!res.isValid) {
          return res
        }
      },
      () => ({
        isValid: true,
        messages: []
      }),
      message
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SyncSchema<T extends Record<string, any>, TMessage> = {
  [P in keyof T]: SyncValidator<T[P], TMessage>
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Schema<T extends Record<string, any>, TMessage> = {
  [P in keyof T]: Validator<T[P], TMessage>
}

export function schema<T, TMessage>(
  schema: SyncSchema<T, TMessage>,
  message?: TMessage
): SyncValidator<T, TMessage | PropertyValidatorResult<T, TMessage>>
export function schema<T, TMessage>(
  schema: Schema<T, TMessage>,
  message?: TMessage
): AsyncValidator<T, TMessage | PropertyValidatorResult<T, TMessage>>
export function schema<T, TMessage>(
  schema: Schema<T, TMessage>,
  message?: TMessage
): Validator<T, TMessage | PropertyValidatorResult<T, TMessage>> {
  return all(
    Object.keys(schema).map((k) => prop(k as keyof T, schema[k as keyof T])),
    message
  )
}

export function any<T, TMessage>(
  validators: SyncValidator<T, TMessage>[],
  message?: TMessage,
  concurrent?: boolean
): SyncValidator<T, TMessage>
export function any<T, TMessage>(
  validators: Validator<T, TMessage>[],
  message?: TMessage,
  concurrent?: boolean
): AsyncValidator<T, TMessage>
export function any<T, TMessage>(
  validators: Validator<T, TMessage>[],
  message?: TMessage,
  concurrent?: boolean
): Validator<T, TMessage> {
  if (concurrent) {
    return _composeConcurrent<T, TMessage>(
      validators,
      (results) => results.some((res) => res.isValid),
      message
    )
  } else {
    return _makeSeriesComposer<T, TMessage>(
      validators,
      (res) => {
        if (res.isValid) {
          return res
        }
      },
      (results) => ({
        isValid: false,
        messages: results.flatMap((res) => res.messages)
      }),
      message
    )
  }
}

function _composeConcurrent<T, TMessage>(
  validators: Validator<T, TMessage>[],
  checkValid: (res: ValidatorResult<TMessage>[]) => boolean,
  message?: TMessage
): Validator<T, TMessage> {
  return (v: T) => {
    function _doWork(
      results: ValidatorResult<TMessage>[]
    ): ValidatorResult<TMessage> {
      const isValid = checkValid(results)
      const messages = isValid ? [] : results.flatMap((r) => r.messages)
      if (!isValid && message) messages.unshift(message)
      return { isValid, messages }
    }
    const results = validators.map((validate) => validate(v))
    return results.some((r) => r instanceof Promise)
      ? Promise.all(results).then(_doWork)
      : _doWork(results as ValidatorResult<TMessage>[])
  }
}

function _makeSeriesComposer<T, TMessage>(
  validators: Validator<T, TMessage>[],
  checkForReturn: (
    res: ValidatorResult<TMessage>
  ) => void | ValidatorResult<TMessage>,
  defaultReturn: (
    results: ValidatorResult<TMessage>[]
  ) => ValidatorResult<TMessage>,
  message?: TMessage
): Validator<T, TMessage> {
  return (v: T) => {
    const results: ValidatorResult<TMessage>[] = []
    let ret: void | ValidatorResult<TMessage>
    for (let i = 0; i < validators.length; i++) {
      const validate = validators[i]
      const result = validate(v)
      if (result instanceof Promise) {
        return _asyncSeriesIterator(
          v,
          result,
          validators.slice(i + 1),
          checkForReturn,
          (restResults) => defaultReturn([...results, ...restResults]),
          message
        )
      } else {
        ret = checkForReturn(result)
        results.push(result)
        if (ret) break
      }
    }
    if (!ret) ret = defaultReturn(results)
    if (!ret.isValid && message) ret.messages.unshift(message)
    return ret
  }
}
async function _asyncSeriesIterator<T, TMessage>(
  v: T,
  promise: Promise<ValidatorResult<TMessage>>,
  validators: Validator<T, TMessage>[],
  checkForReturn: (
    res: ValidatorResult<TMessage>
  ) => void | ValidatorResult<TMessage>,
  defaultReturn: (
    results: ValidatorResult<TMessage>[]
  ) => ValidatorResult<TMessage>,
  message?: TMessage
): Promise<ValidatorResult<TMessage>> {
  const results: ValidatorResult<TMessage>[] = []
  const result = await promise
  let ret = checkForReturn(result)
  results.push(result)
  if (!ret) {
    for (const validate of validators) {
      const result = await validate(v)
      ret = checkForReturn(result)
      results.push(result)
      if (ret) break
    }
  }
  if (!ret) ret = defaultReturn(results)
  if (!ret.isValid && message) ret.messages.unshift(message)
  return ret
}
