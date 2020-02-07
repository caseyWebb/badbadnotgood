import { expectType } from 'tsd'

import { forEach, equals, SyncValidator, ForeachValidatorResult } from '../src'

expectType<SyncValidator<string[], ForeachValidatorResult<never>>>(
  forEach(equals('foo'))
)
expectType<SyncValidator<string[], string | ForeachValidatorResult<never>>>(
  forEach(equals('foo'), '')
)
expectType<SyncValidator<string[], ForeachValidatorResult<string>>>(
  forEach(equals('foo', ''))
)
expectType<SyncValidator<string[], string | ForeachValidatorResult<string>>>(
  forEach(equals('foo', ''), '')
)
