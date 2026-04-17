# Recipe App — Ingredients API

Design notes on how ingredients flow through the system.

## Parsing problem

Ingredients come in as free text:
> "2 large eggs, separated"
> "a pinch of salt"
> "1 cup (240ml) whole milk"

Need to extract: quantity, unit, item, preparation. Across formats, metric/imperial, fractions, ranges.

## Approach

Hybrid:
1. **Regex-first** for the 80% case (numbers, common units, standard phrasing)
2. **LLM fallback** when regex fails or confidence is low
3. **Canonicalize** — convert to a normalized representation (metric + item key)

## Canonical form

```rust
struct Ingredient {
    quantity: Option<Quantity>,   // 2.0, or Range(1.0, 2.0)
    unit: Option<Unit>,           // Grams, Cups, Pieces
    item: String,                 // "eggs", canonicalized
    preparation: Option<String>,  // "separated"
    raw: String,                  // original text for fidelity
}
```

Canonicalization matters for:
- Scaling (halve, double, etc.)
- Shopping list aggregation (combine "2 cups milk" and "1 cup milk" across recipes)
- Unit conversion (imperial ↔ metric)
- Search ("I have eggs" → recipes that need eggs)

## Item canonicalization

"sea salt", "kosher salt", "fine salt" — same thing for shopping list purposes, different for recipes. Solution: `canonical_key` (salt) + `specific` (kosher).

## What's hard

- Ranges: "1-2 eggs"
- Optional: "1 tsp cumin (optional)"
- Alternate: "1 cup heavy cream or half-and-half"
- Grouped: "for the sauce: 2 tbsp soy sauce, ..."

LLM handles these cleanly. Regex doesn't.

## Tests

Fixture file with 100+ real-world ingredients. Run parser, compare to expected canonical forms. New edge case = new test before fix.
