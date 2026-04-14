# Prototypes

JS inheritance works through a prototype chain, not classes. `class` syntax is sugar over prototypes.

## The chain

Every object has a hidden link to another object: its prototype. When you look up a property, JS walks the chain until it finds the property or hits `null`.

```javascript
const arr = [1, 2, 3];
arr.map; // not on arr directly
// → found on Array.prototype
// → Array.prototype's proto is Object.prototype
// → Object.prototype's proto is null
```

## Setting prototypes

```javascript
const animal = { eats: true };
const dog = Object.create(animal);
dog.barks = true;

dog.eats;  // true, from animal
dog.barks; // true, own property
```

## Classes

```javascript
class Dog extends Animal {
  bark() { /* ... */ }
}
```

Desugars to: `Dog.prototype.__proto__ === Animal.prototype`. `bark` is on `Dog.prototype`, not on individual instances.

## When this matters

- Performance: properties on instances vs prototypes — prototypes share memory
- Debugging: `obj.__proto__` shows the chain
- `hasOwnProperty` — distinguishes own properties from inherited ones
