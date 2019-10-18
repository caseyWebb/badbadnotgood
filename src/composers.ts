import {
  SyncValidator,
  Validator,
  ValidatorMessage,
  AsyncValidator,
  ValidatorResult
} from './validators'

export function all<T>(
  validators: SyncValidator<T>[],
  message?: ValidatorMessage,
  concurrent?: boolean
): SyncValidator<T>
export function all<T>(
  validators: Validator<T>[],
  message?: ValidatorMessage,
  concurrent?: boolean
): AsyncValidator<T>
export function all<T>(
  validators: Validator<T>[],
  message?: ValidatorMessage,
  concurrent?: boolean
): Validator<T> {
  if (concurrent) {
    return _composeConcurrent<T>(
      validators,
      (results) => results.every((res) => res.isValid),
      message
    )
  } else {
    return _makeSeriesComposer<T>(
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

export function any<T>(
  validators: SyncValidator<T>[],
  message?: ValidatorMessage,
  concurrent?: boolean
): SyncValidator<T>
export function any<T>(
  validators: Validator<T>[],
  message?: ValidatorMessage,
  concurrent?: boolean
): AsyncValidator<T>
export function any<T>(
  validators: Validator<T>[],
  message?: ValidatorMessage,
  concurrent?: boolean
): Validator<T> {
  if (concurrent) {
    return _composeConcurrent<T>(
      validators,
      (results) => results.some((res) => res.isValid),
      message
    )
  } else {
    return _makeSeriesComposer<T>(
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

function _composeConcurrent<T>(
  validators: Validator<T>[],
  checkValid: (res: ValidatorResult[]) => boolean,
  message?: ValidatorMessage
): Validator<T> {
  return (v: T) => {
    function _doWork(results: ValidatorResult[]): ValidatorResult {
      const isValid = checkValid(results)
      const messages = isValid ? [] : results.flatMap((r) => r.messages)
      if (!isValid && message) messages.unshift(message)
      return { isValid, messages }
    }
    const results = validators.map((validate) => validate(v))
    return results.some((r) => r instanceof Promise)
      ? Promise.all(results).then(_doWork)
      : _doWork(results as ValidatorResult[])
  }
}

function _makeSeriesComposer<T>(
  validators: Validator<T>[],
  checkForReturn: (res: ValidatorResult) => void | ValidatorResult,
  defaultReturn: (results: ValidatorResult[]) => ValidatorResult,
  message?: ValidatorMessage
): Validator<T> {
  return (v: T) => {
    const results: ValidatorResult[] = []
    let ret: void | ValidatorResult
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
    if (message) ret.messages.push(message)
    return ret
  }
}
async function _asyncSeriesIterator<T>(
  v: T,
  promise: Promise<ValidatorResult>,
  validators: Validator<T>[],
  checkForReturn: (res: ValidatorResult) => void | ValidatorResult,
  defaultReturn: (results: ValidatorResult[]) => ValidatorResult,
  message?: ValidatorMessage
): Promise<ValidatorResult> {
  const results: ValidatorResult[] = []
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
  if (message) ret.messages.push(message)
  return ret
}
