# Plan de pruebas de Qvento

Ejecutar primero `npm test` y `npm run build`. Para la matriz integrada se recomienda un proyecto Supabase de pruebas recién migrado, tres navegadores/perfiles separados y cámara disponible.

| # | Escenario | Verificación esperada |
| --- | --- | --- |
| 1 | Superadmin invita un administrador | Llega correo y se crean `auth.users` + `profiles` sin exponer service role. |
| 2 | Inicio de sesión por cada rol | Redirige al panel correcto; una cuenta inactiva queda sin datos por RLS. |
| 3 | Admin crea evento | RPC completa campos y asigna `admin_id = auth.uid()`. |
| 4 | Alterar `admin_id` desde DevTools | PostgreSQL rechaza la columna. |
| 5 | Registrar invitado individual/CSV | Todos quedan ligados al evento propio. |
| 6 | Admin ajeno consulta/edita invitado | La consulta no devuelve filas y la escritura no afecta filas. |
| 7 | Generar invitación | Se muestra token una vez; la tabla contiene solo hash. |
| 8 | Abrir invitación varias veces | Continúa disponible y `archived` permanece falso. |
| 9 | Cambiar ocho colores | Vista previa y página pública usan el tema; valores inválidos usan defaults. |
| 10 | Mensaje con variables y HTML | Sustituye variables; el HTML aparece como texto, sin ejecutarse. |
| 11 | Recepcionista asignado escanea | Muestra nombre y estado sin consumir la entrada. |
| 12 | Confirmar ingreso | Cambia estado, hora y responsable; crea bitácora autorizada. |
| 13 | Repetir QR utilizado | Prevalidación y confirmación responden `used`. |
| 14 | Revocar QR | Invitación muestra revocado y check-in responde `revoked`. |
| 15 | Confirmar simultáneamente en dos sesiones | Exactamente una responde `confirmed`; la otra `used`. |
| 16 | Recepcionista intenta mutar eventos/invitados | RLS rechaza crear, editar, borrar, exportar o regenerar. |
| 17 | Dos administradores consultan datos | Cada uno ve solo sus eventos, invitados, asignaciones y estadísticas. |
| 18 | Retirar asignación con sesión abierta | La siguiente prevalidación responde `unauthorized`. |
| 19 | Móvil 360 px, tablet y escritorio | Navegación, formularios, invitación y cámara no desbordan. |
| 20 | Producción | `npm run build` termina y las rutas profundas cargan mediante rewrite. |

## Carrera de check-in

Desde dos sesiones autorizadas, prevalidar el mismo token y enviar las dos confirmaciones con la menor diferencia posible. Consultar después:

```sql
select archived, checked_in_at, checked_in_by
from public.guests
where id = 'UUID_INVITADO';

select result, count(*)
from public.check_in_logs
where guest_id = 'UUID_INVITADO'
group by result;
```

Debe existir un solo ingreso efectivo. Los intentos posteriores quedan registrados como `used`.

