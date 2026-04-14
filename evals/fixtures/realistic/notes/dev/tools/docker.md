# Docker

Containers for reproducible environments. Images for distribution, containers for running.

## Dockerfile basics

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Order matters: put slow-changing things early (base, deps), fast-changing things late (source). Layer cache reuses everything above a changed line.

## Multi-stage

```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

Small runtime image, fat build image kept off-disk.

## docker-compose

```yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    depends_on: [db]
    environment:
      DATABASE_URL: postgres://db/app
  db:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]

volumes:
  pgdata:
```

Local dev multi-service setups. Not for production.

## Tips

- `.dockerignore` prevents bloat — add `node_modules`, `.git`, `.env`
- Prefer `alpine` or `distroless` for small images
- Never run as root in prod: add a `USER` directive
- `--platform=linux/amd64` on M1 Macs when pushing to x86 servers
- `docker system prune -a` to reclaim disk
