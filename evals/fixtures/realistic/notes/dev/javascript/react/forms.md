# Forms in React

Forms are where controlled vs uncontrolled, validation, and UX all collide.

## Controlled

```jsx
const [email, setEmail] = useState("");
<input value={email} onChange={(e) => setEmail(e.target.value)} />
```

Every keystroke is a re-render. Fine for small forms, painful for large ones.

## Uncontrolled

```jsx
const ref = useRef();
<input ref={ref} defaultValue="" />
// read ref.current.value on submit
```

Fast. Lets the DOM own state. Harder to do reactive validation.

## React Hook Form

My default. Uncontrolled under the hood, with a thin hook API.

```jsx
const { register, handleSubmit, formState } = useForm();
<input {...register("email", { required: true })} />
```

Single re-render on submit. Validators and schemas (Zod) compose in cleanly.

## Validation

- **Schema-based** (Zod, Yup) — single source of truth, generates types
- **Per-field** — finer control, more boilerplate
- **Server-side** — always required, even if you also do client-side
- **Progressive** — validate on blur, not on every keystroke (annoying UX)

## Submission states

- `isSubmitting` — disable button
- `isSubmitted` — show success
- `errors` — inline per field
- `isDirty` — warn on unsaved changes navigation
