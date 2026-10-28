# Arquitectura de Qvento

## Decisiones principales

Qvento es una aplicación web estática construida con Vite, Tailwind CSS y módulos JavaScript. El navegador se comunica directamente con Supabase mediante la clave pública `anon`; la seguridad no depende de ocultar rutas o controles, sino de RLS y funciones PostgreSQL que verifican `auth.uid()`.

## Capas

- **Presentación:** router, páginas por rol, componentes accesibles e invitación animada.
- **Servicios:** módulos que encapsulan Supabase Auth, eventos, invitados, recepcionistas y check-in.
- **Dominio en PostgreSQL:** restricciones, índices, RLS, funciones de autorización y RPC atómicas.
- **Administración privilegiada:** Edge Functions que usan `SUPABASE_SERVICE_ROLE_KEY` solamente en el servidor.

## Token de invitación

La RPC `issue_guest_invitation` genera 32 bytes aleatorios en PostgreSQL, guarda únicamente SHA-256 y devuelve el token original una sola vez al administrador autorizado. El enlace debe copiarse o compartirse en ese momento. Si se pierde, no se recupera: se regenera y el hash anterior queda invalidado.

La invitación pública llama a `get_public_invitation(token)`, que compara el hash y devuelve exclusivamente los datos necesarios de ese invitado y evento. Abrirla nunca cambia `archived`.

Cada invitado incluye `party_size`, un entero entre 1 y 99 que indica cuántas personas cubre el pase. El valor predeterminado es 1, se administra junto con los datos del invitado y se expone públicamente solamente dentro de su propia invitación mediante la RPC protegida por token.

## Check-in

El lector separa dos operaciones:

1. `prevalidate_invitation` valida permisos, evento y estado sin mutar al invitado.
2. `confirm_guest_check_in` ejecuta un `UPDATE ... WHERE archived = false AND is_revoked = false` y registra la bitácora en la misma transacción.

El bloqueo de fila implícito de PostgreSQL y la condición del `UPDATE` aseguran que solo un dispositivo gane una carrera concurrente.

## Rutas

| Ruta | Acceso |
| --- | --- |
| `/` | Público |
| `/login` | Público |
| `/superadmin/*` | Superadmin |
| `/admin/*` | Admin y superadmin |
| `/recepcion/*` | Recepcionista, admin y superadmin autorizados |
| `/invitacion/:token` | Público por token no enumerable |

La protección en el router mejora la experiencia; RLS y RPC siguen siendo la autoridad real.

