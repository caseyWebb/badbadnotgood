import {
  SyncValidator,
  Validator,
  AsyncValidator,
  ValidatorResult
} from './validators'

export type ForeachValidatorResult<TMessage> = {
  index: number
  messages: TMessage[]
}

export function forEach<
  T,
  TMessage,
  TValidatorMessage extends TMessage | never
>(
  validator: SyncValidator<T, TValidatorMessage>,
  message?: TMessage
): SyncValidator<
  T[],
  TValidatorMessage extends never
    ? TMessage
    : TMessage | ForeachValidatorResult<TMessage>
>
export function forEach<
  T,
  TMessage,
  TValidatorMessage extends TMessage | never
>(
  validator: Validator<T, TValidatorMessage>,
  message?: TMessage
): AsyncValidator<
  T[],
  TValidatorMessage extends never
    ? TMessage
    : TMessage | ForeachValidatorResult<TMessage>
>
export function forEach<
  T,
  TMessage,
  TValidatorMessage extends TMessage | never
>(
  validator: Validator<T, TValidatorMessage>,
  message?: TMessage
): Validator<
  T[],
  TValidatorMessage extends never
    ? TMessage
    : TMessage | ForeachValidatorResult<TMessage>
> {
  function _forEach(
    results: ValidatorResult<TMessage>[]
  ): ValidatorResult<
    TValidatorMessage extends never
      ? TMessage
      : TMessage | ForeachValidatorResult<TMessage>
  > {
    const isValid = results.every((r) => r.isValid)
    const messages: (TMessage | ForeachValidatorResult<TMessage>)[] = isValid
      ? []
      : results
          .map((r, index) => ({ messages: r.messages, index }))
          .filter(({ messages }) => messages.length > 0)
    if (!isValid && message) messages.unshift(message)
    return {
      isValid,
      messages: messages as any
    }
  }
  return (arr: T[]) => {
    const results = arr.map(validator)

    return results.some((r) => r instanceof Promise)
      ? Promise.all(results).then(_forEach)
      : _forEach(results as ValidatorResult<TMessage>[])
  }
}

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
