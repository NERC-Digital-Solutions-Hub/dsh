# @dsh/content

`@dsh/content` provides generic build-time access to the published
`dsh-content` site manifest and page files. It deliberately does not know about
Hub, UPRN, or consumer-specific configuration shapes.

Consumers should compose this package with their own domain adapters during
their build step, then import generated typed modules from their app code.

## Useful Commands

```sh
pnpm --filter @dsh/content check
pnpm --filter @dsh/content package
```
