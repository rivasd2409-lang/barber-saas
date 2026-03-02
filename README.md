# Barber SaaS (Next.js + TypeScript + Prisma)

Proyecto base para un SaaS de barbería usando:

- Next.js (App Router)
- TypeScript
- Prisma
- SQLite local

## Requisitos

- Node.js 20+
- npm 10+

## Ejecutar en local

1. Instala dependencias:

```bash
npm install
```

2. Copia variables de entorno:

```bash
cp .env.example .env
```

3. Genera el cliente Prisma:

```bash
npm run prisma:generate
```

4. Crea la base local y ejecuta migración inicial:

```bash
npm run prisma:migrate
```

5. Ejecuta el seed de servicios:

```bash
npm run prisma:seed
```

6. Levanta el proyecto:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Rutas incluidas

- `/` → Muestra “Barber SaaS” y enlace a `/book`
- `/book` → Lista de servicios desde Prisma y slots de ejemplo según selección
