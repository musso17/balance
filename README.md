# Balance Compartido

Aplicación web para que dos personas gestionen de manera colaborativa ingresos, gastos, presupuestos, deudas y metas de ahorro. Construida con Next.js (App Router), Supabase, React Query, Zustand y TailwindCSS.

## Stack

- Next.js 15 (App Router, TypeScript)
- Supabase (Auth + Postgres + RLS)
- React Query / Zustand para estado y fetching
- TailwindCSS + diseño inspirado en Notion/Fintual
- Recharts, date-fns, PapaParse

## Requisitos

- Node.js >= 18
- Supabase project con las tablas y políticas incluidas en `supabase/schema.sql`

## Configuración

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Variables de entorno (crear `.env.local`):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://adfngbzvrasxoczgzgwg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZm5nYnp2cmFzeG9jemd6Z3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDkwMDcsImV4cCI6MjA3NjgyNTAwN30.qmSwPa4Dx4QElcoqw_IxRzFcjSHmR83QFVFqWDPxb6k
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZm5nYnp2cmFzeG9jemd6Z3dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI0OTAwNywiZXhwIjoyMDc2ODI1MDA3fQ.86KmfWZFe8M-I4UxUbghUaRkvGjdWKAygAJWpxASB4o

   ```

   El redirect de magic link debe apuntar a `http://localhost:3000/auth/callback` en Supabase Auth.

3. Migrar la base de datos y políticas RLS:

   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/schema.sql
   ```

   Asegúrate de crear perfiles (`user_profiles`) para cada `auth.users` y asociarlos a un `household_id`.

4. Ejecutar en desarrollo:

   ```bash
   npm run dev
   ```

   Accede a `http://localhost:3000`.

5. Generar build de producción:

   ```bash
   npm run build
   npm start
   ```

## Estructura destacada

- `app/(auth)/login`: login con magic link (Supabase)
- `app/(dashboard)/*`: layout privado y páginas de dashboard, transacciones, presupuestos, deudas y ahorros
- `app/api/*`: endpoints protegidos que aplican filtros por `household_id`
- `components/transactions/transaction-import.tsx`: importación CSV con PapaParse
- `supabase/schema.sql`: tablas y políticas RLS recomendadas

## CSV de ejemplo

Descarga una plantilla desde `public/templates/transacciones.csv`. Columnas esperadas:

```
date,category,monto,persona,tipo,nota,metodo
```

## Próximos pasos sugeridos

- Añadir actualizaciones/ediciones (PUT/PATCH) y borrar registros desde la UI.
- Implementar notificaciones en tiempo real con Supabase Realtime.
- Crear tests e2e (Playwright) para los principales flujos.
- Pulir modo oscuro con `next-themes` y tokens adicionales.

