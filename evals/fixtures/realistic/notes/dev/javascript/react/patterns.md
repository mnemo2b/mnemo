# React Patterns

Component composition patterns that show up in every non-trivial React codebase.

## Compound components

Parent coordinates, children consume context.

```jsx
<Tabs defaultValue="a">
  <Tabs.List>
    <Tabs.Trigger value="a">A</Tabs.Trigger>
    <Tabs.Trigger value="b">B</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="a">Content A</Tabs.Panel>
</Tabs>
```

Flexible layout, shared state without prop drilling.

## Render props / children as function

Pass a function as children to invert control.

```jsx
<MouseTracker>
  {({ x, y }) => <p>{x}, {y}</p>}
</MouseTracker>
```

Mostly replaced by hooks but still useful for dynamic composition.

## Controlled vs uncontrolled

- **Controlled** — parent owns state via props
- **Uncontrolled** — component owns state, parent reads via ref

Forms: controlled unless perf matters (big forms). Uncontrolled + `useRef` is fast.

## Container / presentational

Outdated split. Modern equivalent: custom hooks for logic + dumb components for rendering.

## Slots / children props

Named slots via props let you inject parts without coupling to structure.

```jsx
<Card header={<Title />} footer={<Actions />}>
  {content}
</Card>
```
