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

export type PropertyValidatorResult<T, TMessage> = {
  property: keyof T
  messages: TMessage[]
}

export function prop<
  T extends Record<string, any>,
  TMessage,
  TValidatorMessage extends TMessage | never = TMessage | never,
  P extends keyof T = keyof T
>(
  propertyName: P,
  validator: SyncValidator<T[P], TValidatorMessage>,
  message?: TMessage
): SyncValidator<T, TMessage | PropertyValidatorResult<T, TMessage>>
export function prop<
  T extends Record<string, any>,
  TMessage,
  TValidatorMessage extends TMessage | never = TMessage | never,
  P extends keyof T = keyof T
>(
  propertyName: P,
  validator: Validator<T[P], TValidatorMessage>,
  message?: TMessage
): Validator<T, TMessage | PropertyValidatorResult<T, TMessage>>
export function prop<
  T extends Record<string, any>,
  TMessage,
  TValidatorMessage extends TMessage | never = TMessage | never,
  P extends keyof T = keyof T
>(
  propertyName: P,
  validator: Validator<T[P], TValidatorMessage>,
  message?: TMessage
): Validator<T, TMessage | PropertyValidatorResult<T, TMessage>> {
  function _prop(res: ValidatorResult<TMessage>) {
    const messages: (
      | TMessage
      | PropertyValidatorResult<T, TMessage>)[] = res.isValid
      ? []
      : [{ property: propertyName, messages: res.messages }]
    if (!res.isValid && message) messages.unshift(message)
    return {
      isValid: res.isValid,
      messages
    }
  }
  return (v: T) => {
    const results = validator(v[propertyName])
    return results instanceof Promise ? results.then(_prop) : _prop(results)
  }
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
  condition: SyncValidator<T, TMessage> | ((v: T) => boolean),
  validator: SyncValidator<T, TMessage>
): SyncValidator<T, TMessage>
export function onlyIf<T, TMessage>(
  condition: Validator<T, TMessage> | ((v: T) => boolean | Promise<boolean>),
  validator: Validator<T, TMessage>
): AsyncValidator<T, TMessage>
export function onlyIf<T, TMessage>(
  condition: ((v: T) => boolean | Promise<boolean>) | Validator<T, TMessage>,
  validator: Validator<T, TMessage>
): Validator<T, TMessage> {
  return (v: T) => {
    function _onlyIf(
      result: boolean | ValidatorResult<TMessage>
    ): ValidatorResult<TMessage> | Promise<ValidatorResult<TMessage>> {
      const shouldValidate =
        typeof result === 'boolean' ? result : result.isValid
      return shouldValidate
        ? validator(v)
        : {
            isValid: true,
            messages: []
          }
    }
    const conditionResult = condition(v)
    return conditionResult instanceof Promise
      ? (conditionResult as Promise<boolean | ValidatorResult<TMessage>>).then(
          _onlyIf
        )
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
