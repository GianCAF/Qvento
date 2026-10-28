# Qvento

Plataforma de invitaciones digitales reutilizables y control de acceso QR de un solo uso. Está construida con HTML semántico, Tailwind CSS, JavaScript Vanilla, Vite y Supabase.

## Estado de esta primera versión

Incluye autenticación por roles, paneles de superadministrador y administrador, eventos, invitados, importación CSV, temas, invitaciones públicas animadas, emisión de tokens, QR, recepcionistas, lector con cámara, prevalidación, check-in atómico, bitácora y estadísticas. Las operaciones dependen de un proyecto Supabase configurado; no hay datos simulados ni una clave administrativa en el navegador.

## Requisitos

- Node.js 20 o superior.
- Una cuenta y un proyecto de Supabase.
- Supabase CLI para migraciones y funciones.
- Git y, para publicar, una cuenta de Vercel.

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
```

En PowerShell, copia el entorno con `Copy-Item .env.example .env`. Completa solamente las dos variables públicas:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
```

La `service_role` nunca debe colocarse en `.env` del frontend.

## Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. Instala la CLI y autentícate con `supabase login`.
3. Vincula el directorio: `supabase link --project-ref TU_PROJECT_REF`.
4. Ejecuta `supabase db push`. Esto aplica `supabase/migrations/202610270001_initial_schema.sql`.
5. Despliega funciones:

```bash
supabase functions deploy create-user
supabase functions deploy manage-users
supabase secrets set SITE_URL=http://localhost:5173
```

Para producción, cambia `SITE_URL` al dominio HTTPS de Vercel. `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` están disponibles automáticamente en Edge Functions alojadas por Supabase.

### Crear el primer superadministrador

El rol no se ofrece en ningún formulario. En **Authentication > Users**, crea manualmente el primer usuario. Copia su UUID y ejecuta una sola vez en SQL Editor:

```sql
insert into public.profiles (id, full_name, role)
values ('UUID_DEL_USUARIO', 'Nombre del propietario', 'superadmin');
```

Después inicia sesión en `/login`. Desde el panel podrás invitar administradores; ellos podrán invitar recepcionistas.

### Configuración de Authentication

En **Authentication > URL Configuration** agrega:

- Desarrollo: `http://localhost:5173/**`
- Producción: `https://TU_DOMINIO.vercel.app/**`

Activa el proveedor Email. Las cuentas se crean mediante invitación; no existe registro público.

## Flujo seguro de invitaciones

`issue_guest_invitation` crea 32 bytes aleatorios, guarda SHA-256 y devuelve el token una sola vez. El administrador debe copiar o compartir el enlace al generarlo. Un token perdido no se puede reconstruir; se regenera, invalidando el anterior.

Abrir `/invitacion/TOKEN` solo lee datos mínimos. El lector usa `prevalidate_invitation`; únicamente `confirm_guest_check_in` marca el acceso como utilizado. La actualización condicional hace que dos confirmaciones simultáneas no puedan aprobar la misma entrada.

## Importar invitados

Usa un CSV UTF-8 de hasta 500 registros por carga:

```csv
full_name,email,phone
Ana Pérez,ana@example.com,+525500000001
Luis García,luis@example.com,+525500000002
```

`full_name` es obligatorio; `email` y `phone` son opcionales.

## Pruebas y compilación

```bash
npm test
npm run build
```

La matriz completa de verificación funcional está en [docs/TEST_PLAN.md](docs/TEST_PLAN.md). Las pruebas de RLS/RPC requieren un proyecto Supabase local o remoto preparado; nunca se ejecutan contra producción sin un respaldo.

## Despliegue en Vercel

1. Sube la rama `main` a GitHub.
2. En Vercel elige **Add New > Project** e importa `GianCAF/Qvento`.
3. Vercel detectará Vite. El repositorio también contiene `vercel.json` con `npm run build`, salida `dist` y rewrites para el router.
4. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en los entornos requeridos.
5. Despliega y agrega el dominio final a Supabase Auth.
6. Actualiza el secreto `SITE_URL` de las Edge Functions con ese dominio.

Cada push posterior a `main` genera un despliegue automático. El plan Hobby de Vercel está orientado a proyectos personales/no comerciales; revisa un plan compatible antes de explotar Qvento comercialmente.

## Estructura

```text
src/components       Componentes de interfaz y QR
src/pages            Pantallas y flujos por rol
src/services         Acceso a Supabase
src/utils            Validación, plantillas, temas y CSV
supabase/migrations  Esquema, RLS y RPC
supabase/functions   Operaciones administrativas privilegiadas
docs                 Arquitectura y pruebas
```

## Seguridad

- RLS está habilitado en todas las tablas expuestas.
- Los roles se leen desde `profiles`, nunca desde parámetros del cliente.
- `archived`, hashes y datos de check-in no tienen permiso de escritura desde el navegador.
- Los textos de administradores/invitados se insertan con `textContent`; no se interpreta HTML.
- Las funciones privilegiadas fijan `search_path` y comprueban permisos explícitos.
- `.env`, artefactos, dependencias y temporales están ignorados por Git.

