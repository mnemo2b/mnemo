# JS Testing Patterns

Heuristics I've stolen over time.

## Test pyramid

- **Unit** — fast, pure, many. 70% of tests.
- **Integration** — multiple units together, sometimes hitting DB/network. 20%.
- **E2E** — real browser, real flows. 10%.

Inverting this (all E2E, no units) = slow, flaky CI.

## Arrange, act, assert

```typescript
test('calculates tax', () => {
  // arrange
  const order = { subtotal: 100, region: 'CA' };
  // act
  const total = calculateTotal(order);
  // assert
  expect(total).toBe(108.5);
});
```

Three blocks, separated by blank lines. Makes tests scannable.

## Avoid shared state

- Each test gets a fresh fixture
- If you need setup, use `beforeEach`, not module-scoped vars
- Parallel test runs will expose shared state quickly

## Test behavior, not implementation

```typescript
// bad
expect(component.state.isOpen).toBe(true);

// good
expect(screen.getByRole('dialog')).toBeVisible();
```

Test what the user sees. Implementation can change; behavior is what matters.

## When tests are painful

Usually signals a design problem, not a testing problem:
- Hard to mock → too many dependencies, break them up
- Lots of setup → seams are wrong, refactor
- Flaky → race condition or leaked state

## Don't test

- Library code (tested by the library)
- Getters/setters with no logic
- Constants

Coverage is a tool, not a goal. 100% coverage of trivial code is wasted effort.
