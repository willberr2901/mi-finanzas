# ✅ Lista de revisión antes de publicar

Se usa **cada viernes**, antes de pasar la rama de la semana a `main`.
Si un punto falla, **no se publica** hasta arreglarlo.

## 1. Revisión automática (en VS Code, terminal)

```
npm run revisar
```

Hace 3 cosas y todas deben pasar:

| Paso | Qué revisa | Debe decir |
|---|---|---|
| `tsc` | Que el código no tenga errores de escritura | (nada, sin rojo) |
| `vitest` | Las pruebas, incluidas las de lo esencial (mercado, gastos, pagos) | `Tests  N passed` |
| `vite build` | Que la app se pueda armar para publicar | `✓ built in …` |

## 2. Revisión del cambio

- [ ] La rama tiene solo los cambios de la semana (sin archivos raros ni +1000 líneas por formato).
- [ ] `src/version.ts`: subió el número de versión y las novedades están escritas para personas.
- [ ] Si se tocó un archivo importante, `MAPA-DEL-CODIGO.md` está al día.

## 3. Prueba a mano (día de pruebas)

En el computador con `npm run dev`, o en el celular con `npm run dev -- --host` (misma red wifi):

- [ ] **Mercado**: agregar un producto, tocar "Guardar y cerrar", recargar → sigue ahí y en su categoría.
- [ ] **Gasto**: registrar un gasto con el botón +, ir a Finanzas → aparece y el resumen cambia.
- [ ] **Pago**: marcar un pago en Pagos → queda pagado y aparece como gasto.
- [ ] **Préstamo**: crear uno y abonarle.
- [ ] **Celular de verdad**: abrir la app publicada después del despliegue y tocar "Hay una actualización".

## 4. Publicar

1. Pull Request de la rama hacia `main` en GitHub.
2. Revisar los cambios (pestaña *Files changed*) y aprobar.
3. *Merge* → Render publica solo en 1-2 minutos.
4. Abrir la app publicada y confirmar el número de versión en el aviso de novedades.
