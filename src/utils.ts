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
    return _makeConcurrentComposer<T>(
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
    return _makeConcurrentComposer<T>(
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

function _makeConcurrentComposer<T>(
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
        const ret = checkForReturn(result)
        results.push(result)
        if (ret) {
          if (message) result.messages.push(message)
          return ret
        }
      }
    }
    return defaultReturn(results)
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
  {
    const result = await promise
    const ret = checkForReturn(result)
    results.push(result)
    if (ret) {
      if (message) ret.messages.push(message)
      return ret
    }
  }
  for (const validate of validators) {
    const result = await validate(v)
    const ret = checkForReturn(result)
    results.push(result)
    if (ret) {
      if (message) ret.messages.push(message)
      return ret
    }
  }
  return defaultReturn(results)
}

export function not<T>(
  validator: SyncValidator<T>,
  message?: ValidatorMessage
): SyncValidator<T>
export function not<T>(
  validator: Validator<T>,
  message?: ValidatorMessage
): AsyncValidator<T>
export function not<T>(
  validator: Validator<T>,
  message?: ValidatorMessage
): Validator<T> {
  function _not(result: ValidatorResult): ValidatorResult {
    const isValid = !result.isValid
    return {
      isValid,
      messages: isValid || !message ? [] : [message]
    }
  }
  return (v: T) => {
    const results = validator(v)
    return results instanceof Promise ? results.then(_not) : _not(results)
  }
}

export function onlyIf<T>(
  condition: SyncValidator<T>,
  validator: SyncValidator<T>
): SyncValidator<T>
export function onlyIf<T>(
  condition: Validator<T>,
  validator: Validator<T>
): AsyncValidator<T>
export function onlyIf<T>(
  condition: Validator<T>,
  validator: Validator<T>
): Validator<T> {
  return (v: T) => {
    function _onlyIf(
      shouldValidate: ValidatorResult
    ): ValidatorResult | Promise<ValidatorResult> {
      return shouldValidate.isValid
        ? validator(v)
        : {
            isValid: true,
            messages: []
          }
    }
    const conditionResult = condition(v)
    return conditionResult instanceof Promise
      ? conditionResult.then(_onlyIf)
      : _onlyIf(conditionResult)
  }
}

export function makeValidator<T>(
  validate: (v: T) => boolean,
  message?: ValidatorMessage
): SyncValidator<T>
export function makeValidator<T>(
  validate: (v: T) => Promise<boolean>,
  message?: ValidatorMessage
): AsyncValidator<T>
export function makeValidator<T>(
  validate: (v: T) => boolean | Promise<boolean>,
  message?: ValidatorMessage
): Validator<T> {
  return (v: T) => {
    function _makeValidator(isValid: boolean): ValidatorResult {
      return {
        isValid,
        messages: isValid || !message ? [] : [message]
      }
    }
    const result = validate(v)
    return result instanceof Promise
      ? result.then(_makeValidator)
      : _makeValidator(result)
  }
}
