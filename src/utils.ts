import {
  SyncValidator,
  Validator,
  AsyncValidator,
  ValidatorResult
} from './validators'

export function not<T, TMessage>(
  validator: SyncValidator<T, TMessage>,
  message?: TMessage
): SyncValidator<T, TMessage>
export function not<T, TMessage>(
  validator: Validator<T, TMessage>,
  message?: TMessage
): AsyncValidator<T, TMessage>
export function not<T, TMessage>(
  validator: Validator<T, TMessage>,
  message?: TMessage
): Validator<T, TMessage> {
  function _not(result: ValidatorResult<TMessage>): ValidatorResult<TMessage> {
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

export function onlyIf<T, TMessage>(
  condition: SyncValidator<T, TMessage>,
  validator: SyncValidator<T, TMessage>
): SyncValidator<T, TMessage>
export function onlyIf<T, TMessage>(
  condition: Validator<T, TMessage>,
  validator: Validator<T, TMessage>
): AsyncValidator<T, TMessage>
export function onlyIf<T, TMessage>(
  condition: Validator<T, TMessage>,
  validator: Validator<T, TMessage>
): Validator<T, TMessage> {
  return (v: T) => {
    function _onlyIf(
      shouldValidate: ValidatorResult<TMessage>
    ): ValidatorResult<TMessage> | Promise<ValidatorResult<TMessage>> {
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

export function makeValidator<T, TMessage>(
  validate: (v: T) => boolean,
  message?: TMessage
): SyncValidator<T, TMessage>
export function makeValidator<T, TMessage>(
  validate: (v: T) => Promise<boolean>,
  message?: TMessage
): AsyncValidator<T, TMessage>
export function makeValidator<T, TMessage>(
  validate: (v: T) => boolean | Promise<boolean>,
  message?: TMessage
): Validator<T, TMessage> {
  return (v: T) => {
    function _makeValidator(isValid: boolean): ValidatorResult<TMessage> {
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
