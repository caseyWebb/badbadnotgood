import {
  SyncValidator,
  Validator,
  ValidatorMessage,
  AsyncValidator,
  ValidatorResult
} from './validators'

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
