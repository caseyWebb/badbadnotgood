# badbadnotgood

> Functional validation, built for composition.

[![NPM Version][npm-version-shield]][npm-version]
[![NPM Downloads][npm-stats-shield]][npm-stats]
[![License][license-shield]][license]
[![TypeScript][typescript-shield]][typescript]
[![Build Status][build-status-shield]][build-status]
[![Coverage Status][codecov-shield]][codecov]

## Usage

```typescript
import {
  all,
  any,
  onlyIf,
  not,
  divisibleBy
  equals,
  minLength,
} from 'badbadnotgood'

// Simple validation
const isFoo = equals('foo')
isFoo('foo') // { isValid: true, messages: [] }
isFoo('bar') // { isValid: false, messages: [] }

// With validation messages
const isBar = equals('bar', 'Value must be "bar"')
isFoo('foo') // { isValid: false, messages: ['Value must be "bar"'] }
isFoo('bar') // { isValid: true, messages: [] }

// Negated
const isNotFoo = not(equals('foo'), 'Value must not be "foo"')
isNotFoo('foo') // { isValid: false, messages: ['Value must not be "foo"']}
isNotFoo('bar') // { isValid: true, messages: [] }

// Composed, with single message
const isFooOrBar = any(
  [equals('foo'), equals('bar')],
  'Value must be "foo" or "bar"'
)
isFooOrBar('foo') // { isValid: true, messages: [] }
isFooOrBar('baz') // { isValid: false, messages: ['Value must be "foo" or "bar"'] }

// Composed, with multiple messages
const isDivisibleBy3And4 = all([
  divisibleBy(3, 'Not divisible by 3'),
  divisibleBy(4, 'Not divisible by 4')
])
isDivisibleBy3And4(12) // { isValid: true, messages: [] }
isDivisibleBy3And4(6) // { isValid: false, messages: ["Not divisible by 4"] }
isDivisibleBy3And4(1) // { isValid: false, messages: ["Not divisible by 3", "Not divisible by 4"] }

// Conditional validation
const atLeast6CharsUnlessFoo = onlyIf(
  not(equals('foo')),
  minLength(6, 'Must be at least 6 characters')
)
atLeast6CharsUnlessFoo('foo') // { isValid: true, messages: [] }
atLeast6CharsUnlessFoo('bar') // { isValid: false, messages: ["Must be at least 6 characters"] }
atLeast6CharsUnlessFoo('foobar') // { isValid: true, messages: [] }

// Arrays
const allAreFoo = forEach(equals('foo', 'Item is not "foo"'), 'All items must be "foo"')
allAreFoo(['foo']) // { isValid: true, messages: [] }
allAreFoo(['foo', 'bar']) // { isValid: false, messages: ['All items must be "foo"', { index: 1, messages: ['Item is not "foo"] }] }
```

[npm-version]: https://npmjs.com/package/badbadnotgood
[npm-version-shield]: https://img.shields.io/npm/v/badbadnotgood.svg
[npm-stats]: http://npm-stat.com/charts.html?package=badbadnotgood&author=&from=&to=
[npm-stats-shield]: https://img.shields.io/npm/dt/badbadnotgood.svg?maxAge=2592000
[license]: ./LICENSE
[license-shield]: https://img.shields.io/npm/l/badbadnotgood.svg
[typescript]: https://www.typescriptlang.org/
[typescript-shield]: https://img.shields.io/badge/definitions-TypeScript-blue.svg
[build-status]: https://github.com/caseyWebb/badbadnotgood/actions/workflows/nodejs.yml
[build-status-shield]: https://img.shields.io/github/workflow/status/caseyWebb/badbadnotgood/Node%20CI/master
[codecov]: https://codecov.io/gh/caseyWebb/badbadnotgood
[codecov-shield]: https://img.shields.io/codecov/c/github/caseyWebb/badbadnotgood.svg
