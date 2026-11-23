# Stockwise Ops

Stockwise Ops is a retail operations dashboard for managing shop inventory, logging sales, reviewing low-stock alerts and customer feedback, and coordinating staff. Owner workspaces include market-price insights and an optional public shop-discovery beacon.

## Development

Use Node.js and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
```

To start the development server on macOS or Linux, run `pnpm dev`. In Windows PowerShell, set the environment variable explicitly:

```powershell
$env:NODE_ENV = "development"
pnpm exec tsx watch server/_core/index.ts
```

Configure required server variables locally before using authentication and database-backed workspaces. Shop data and owner operations are scoped to the owner's shop; enable the discovery beacon only when the shop should appear in the public directory. Do not commit credentials or private shop data.
