import {
  SyncValidator,
  Validator,
  AsyncValidator,
  ValidatorResult
} from './validators'

export type ForeachValidatorResult<TMessage> = {
  index: number
  isValid: boolean
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

export function forEach<T, TValidatorMessage>(
  validator: SyncValidator<T, TValidatorMessage>
): SyncValidator<T[], ForeachValidatorResult<TValidatorMessage>>
export function forEach<
  T,
  TMessage,
  TValidatorMessage extends TMessage = TMessage
>(
  validator: SyncValidator<T, TValidatorMessage>,
  message: TMessage
): SyncValidator<T[], TMessage | ForeachValidatorResult<TValidatorMessage>>
export function forEach<T, TValidatorMessage>(
  validator: AsyncValidator<T, TValidatorMessage>
): AsyncValidator<T[], ForeachValidatorResult<TValidatorMessage>>
export function forEach<
  T,
  TMessage,
  TValidatorMessage extends TMessage = TMessage
>(
  validator: AsyncValidator<T, TValidatorMessage>,
  message: TMessage
): AsyncValidator<T[], TMessage | ForeachValidatorResult<TValidatorMessage>>
export function forEach<T, TMessage, TValidatorMessage>(
  validator: Validator<T, TValidatorMessage>,
  message?: TMessage
): Validator<T[], TMessage | ForeachValidatorResult<TValidatorMessage>> {
  function _forEach(
    results: ValidatorResult<TValidatorMessage>[]
  ): ValidatorResult<TMessage | ForeachValidatorResult<TValidatorMessage>> {
    const allAreValid = results.every((r) => r.isValid)
    const messages: (
      | TMessage
      | ForeachValidatorResult<TValidatorMessage>)[] = allAreValid
      ? []
      : results
          .map((r, index) => ({ index, ...r }))
          .filter(({ isValid }) => !isValid)
    if (!allAreValid && message) messages.unshift(message)
    return {
      isValid: allAreValid,
      messages: messages
    }
  }
  return (arr: T[]) => {
    const results = arr.map(validator)

    return results.some((r) => r instanceof Promise)
      ? Promise.all(results).then(_forEach)
      : _forEach(results as ValidatorResult<TValidatorMessage>[])
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

export function invoke<T, TMessage, TArgs extends any[] | never[]>(
  validator: SyncValidator<T, TMessage>,
  args?: TArgs
): SyncValidator<(...args: TArgs) => T, TMessage>
export function invoke<T, TMessage, TArgs extends any[] | never[]>(
  validator: Validator<T, TMessage>,
  args?: TArgs
): Validator<(...args: TArgs) => T, TMessage> {
  return (getV: (...args: TArgs) => T) =>
    validator(getV(...(args ? args : ([] as TArgs))))
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
