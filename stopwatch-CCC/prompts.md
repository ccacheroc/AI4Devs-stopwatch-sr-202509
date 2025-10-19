# Cronómetro y Cuenta Regresiva — Metaprompt + Proceso

> **Archivo:** `cronometros-multiples-metaprompt.md`  
> **Descripción:** Documento en formato Markdown con el metaprompt, el prompt generado y la secuencia de uso para desarrollar una app de cronómetros y cuentas regresivas múltiples (frontend puro, es-ES).

---

## 1) Metaprompter
**URL**: https://chatgpt.com/g/g-68f4b8b840588191bfe3432d1422c042-lidr-generadorpromptsprogramacion/

**Brief del pedido**  
Quiero un prompt para desarrollar un cronómetro y una cuenta regresiva.  
**Guía de diseño**: se dará en imágenes adjuntas.  
**Recursos Base**: se proporcionarán archivos `index.html` y `script.js`.  
**Funcionalidades obligatorias**:
- Al finalizar una cuenta regresiva, muestra una notificación y reproduce un sonido de alerta.
- Permite crear y gestionar múltiples cronómetros o cuentas regresivas simultáneamente.

**Aclaraciones adicionales al metaprompter**:
- Quiero que la app se ejecute en un navegador sin tener que instalar nada adicional.
- Quiero que sea compatible con Chrome, Firefox y Microsoft Edge. Quiero que se pueda ver bien en móvil y desktop.
- No necesito persistencia entre recargas. Los estados son los que dices. no sé lo que son los laps. No necesito persistencia. no sé lo que es el ddrift bajo.
- Formato de tiempo hh:mm:ss.
- Las imágenes de diseño y los archivos index y scripts se los daré al prompt generado.
- Sonido generado con Web Audio API.
- Prompt final único, que pueda incluir preguntas al usuario.
- Nivel de accesibilidad: el que indicas.
- Soporte dark mode.
- Idioma por defecto es-ES.
- Se debe crear la interfaz para optimizar la UX.

---

## 2) Prompt generado por metaprompter

```xml
<meta>
  <role>Experta/o full-stack enfocada/o en generar código de programación de alta calidad (UI/UX accesible, arquitectura, clean code, SOLID, TDD, rendimiento y seguridad)</role>
  <audience>Dev front-end con JS intermedio</audience>
  <language>es-ES</language>
  <model_recommendation>GPT-5 Thinking</model_recommendation>
  <goals>Lighthouse ≥90 (Performance/A11y/Best Practices/SEO); p95 acción-UI ≤100ms; 0 memory leaks con ≥20 temporizadores; 100% tests/linter; compatibilidad Chrome/Firefox/Edge actual</goals>
  <constraints>Frontend puro (Vanilla HTML/CSS/JS ES2020+ con módulos), sin bundlers ni libs externas; sin persistencia; formato de tiempo hh:mm:ss; Web APIs estándar (Notification, Web Audio)</constraints>
  <tools>Web APIs del navegador (Notification, Vibration opcional, Web Audio API, Performance API, matchMedia); axe-core/Lighthouse (auditorías a11y/rendimiento) como sugerencia</tools>
  <knowledge_base>Se aportarán imágenes de diseño + index.html y script.js base</knowledge_base>
  <ux_a11y>WCAG 2.2 AA; dark mode (prefers-color-scheme); responsive mobile-first; teclado completo; foco visible/retorno; landmarks semánticos; aria-live en eventos; contraste ≥4.5:1; targets 44×44px; reduced motion respetada</ux_a11y>
</meta>

**Piensa en profundidad antes de dar tu respuesta.**

**[instructions]**
- Haz preguntas solo cuando falte un dato crítico; si no, asume valores seguros por defecto.
- Tu salida debe ser **un único entregable de código autocontenido** (usando los archivos base que el usuario entregará) + notas mínimas de verificación.
- Verifica precondiciones (permisos Notification, desbloqueo de AudioContext con gesto de usuario) antes de ejecutar acciones dependientes.
- No inventes datos; si citas estándares, nómbralos (WCAG 2.2, EN 301 549) sin enlaces.

**[workflow]**
1) Reunir/validar contexto crítico (si falta): ¿número máximo visible de temporizadores?, ¿icono/tono?, ¿microcopy final?, ¿tono de colores desde las imágenes?  
2) Plan paso a paso (con supuestos/risgos) → Compara 2 alternativas clave y elige justificando.  
3) Entregar secciones SSS: Contexto; Tareas; Entradas/Salidas; Plan; Reglas (seguridad/perf/estilo); **UX/A11y**; Ejemplos (1 correcto y 1 antiejemplo); Verificación de precondiciones.  
4) Checklist final (KPIs, restricciones, UX/A11y, formato, permisos).

**[prompt_template]**

CONTEXTO (fijo):
- Stack: Vanilla HTML/CSS/JS (ES2020+) con módulos, sin bundlers ni librerías externas.
- Compatibilidad: Chrome, Firefox, Microsoft Edge (versiones actuales).
- Recursos base: el usuario aportará `index.html`, `script.js` y **imágenes de diseño**. Integra estilos inline o `style.css` mínimo si hace falta.
- Persistencia: **no requerida**.
- Formato de tiempo: **hh:mm:ss**.
- Idioma: **es-ES**.
- Accesibilidad: **WCAG 2.2 AA** (EN 301 549 UE).
- Funcionalidades obligatorias:
  1) **Cronómetro** (start/pause/resume/stop/reset).
  2) **Cuenta regresiva** configurable.
  3) **Múltiples instancias simultáneas** (crear/etiquetar/pausar/reanudar/eliminar, independientes).
  4) Al finalizar una cuenta regresiva: **notificación** (Notification API) + **sonido de alerta** (Web Audio API).
- UX: responsive móvil/desktop; dark mode; interfaz clara para crear/gestionar múltiples temporizadores; microcopy inclusivo.

TAREA:
Construir la UI y la lógica para cronómetros y cuentas regresivas múltiples, integrando las imágenes de diseño provistas, en **frontend puro**. Optimiza precisión sin Web Workers (si es posible); corrige drift usando tiempos absolutos (`performance.now()`/`Date.now()`) en lugar de incrementar contadores.

ENTRADAS:
- Desde UI: nombre/etiqueta del temporizador, tipo (cronómetro/regresiva), duración para regresiva (hh:mm:ss), acciones (start/pause/resume/reset/delete/duplicar opcional).
- Permisos: Notification.requestPermission() (solo bajo gesto de usuario).
- Audio: generar tono simple con Web Audio API (Oscillator + Gain, ADSR corto).

SALIDAS:
- DOM actualizado y accesible; notificación nativa (si permitido) con texto claro; sonido audible con control de volumen y `aria-live="assertive"` como fallback (si permisos denegados).

PLAN (paso a paso):
1) **Arquitectura**: módulo `timers/engine.js` con clase `Timer` y subtipos `Stopwatch`/`Countdown` que calculan tiempo por **instante objetivo** (t=now-start o end-now). Estado inmutable mínimo; eventos personalizados (`timer:tick`, `timer:done`).
2) **Gestor**: `timers/store.js` con Map<ID, Timer>, acciones puras (add/start/pause/resume/reset/delete). Validaciones y guardas.
3) **UI semántica**: `header`, `main`, `footer`; lista de temporizadores (list/grid responsive). Controles por tarjeta: etiqueta, tiempo, botones (orden tab lógico), menú de opciones.
4) **Accesibilidad**: foco visible; retorno de foco tras acciones; `aria-live="polite"` para ticks visibles y `"assertive"` al finalizar; roles/labels accesibles; tamaños táctiles.
5) **Notificaciones & Audio**: solicitar permiso bajo gesto (click). Si denegado → fallback con banner en-app y `aria-live`. Crear `createBeep({freq,duration})` con Web Audio; desbloquear AudioContext en primer gesto.
6) **Precisión**: usar `performance.now()`/`Date.now()` para calcular **tiempo transcurrido/restante** en cada frame/tick (via `requestAnimationFrame` o `setTimeout` ~250ms). Evitar incrementar contadores por intervalos. Corregir drift en reactivaciones de pestaña.
7) **Estados**: idle → running → paused → finished; transiciones y guardas.
8) **Estilos**: mobile-first; tokens mínimos (espaciado, radio, tipografía); `prefers-color-scheme` para dark; respeta `prefers-reduced-motion`.
9) **Pruebas rápidas**: unitarias de cálculo (pausa/reanudación, exactitud ±1s en 1h); accesibilidad con axe (manual); rendimiento (≥20 temporizadores activos p95 ≤100ms interacción).

ALTERNATIVAS (elige una):
A) **requestAnimationFrame** para pintar y calcular tiempo cada frame.  
- Pros: suavidad, sincronía con repintado. Contras: en background puede pausar → se corrige recalculando por tiempo absoluto.
B) **setTimeout(250ms)** para ticks lógicos y pintar.  
- Pros: eficiente; menos callbacks. Contras: throttling en background; misma corrección por tiempo absoluto.
**Elección**: [A|B] según simplicidad preferida; en ambos casos el **cálculo** usa tiempo absoluto para evitar drift.

REGLAS (seguridad/perf/estilo):
- Sin `eval` ni `innerHTML` inseguro; sanitiza entradas; usa `textContent`.
- Módulos ES, funciones puras, separación lógica/UI, nombres claros.
- No bloquear hilo principal; trabajo ligero por tick; desuscribir listeners al eliminar temporizadores.
- Sonido a volumen moderado y con opción “Silenciar” por temporizador.
- Manejo de errores: try/catch con mensajes accesibles.

UX/A11y (obligatorio):
- Landmarks (`header`, `nav` opcional, `main`, `footer`); HTML semántico.
- Teclado completo (Tab/Shift+Tab, Enter/Espacio); ESC para cerrar modales/menús.
- Foco visible y **retorno de foco** al origen tras acciones.
- `aria-live` en fin de cuenta (“Tiempo finalizado para [Etiqueta]”).
- Contraste ≥4.5:1; targets 44×44px; estados hover/focus/disabled.
- Responsive: grid/list adaptable; safe areas; zoom correcto.
- Microcopy claro: “Iniciar”, “Pausar”, “Reanudar”, “Restablecer”, “Eliminar”.

EJEMPLOS:
✔️ Correcto (cálculo por tiempo absoluto):
```js
// within tick():
const now = performance.now();
const elapsed = now - state.startAt - state.pausedAccumulated;
const seconds = Math.max(0, Math.floor(elapsed / 1000));
// pintar con seconds → hh:mm:ss


❌ Incorrecto (drift por incremento fijo):
```js
// NO: incrementa contadores por intervalos → deriva con throttling
setInterval(() => {
  elapsedSeconds++; // deriva en background
  render(elapsedSeconds);
}, 1000);

(Explicación: al depender del scheduler, al cambiar de pestaña el navegador “throttlea” y el conteo se desincroniza.)

### 🔍 VERIFICACIÓN DE PRECONDICIONES
- **Antes de reproducir sonido:** asegurar `audioCtx.state === "running"`; si está en `"suspended"`, reanudar en un gesto de usuario.  
- **Antes de notificar:** comprobar permiso (`Notification.permission`); si es `"denied"`, usar fallback accesible (`aria-live` + banner).  
- **Validar:** duración > 0 para regresiva y campos obligatorios completos.

---

### ✅ CRITERIOS DE ACEPTACIÓN
- Crear y gestionar **≥20 temporizadores mixtos** sin pérdida de interacción (**p95 ≤100 ms**).  
- Fin de cuenta regresiva: muestra **notificación (si permitido)** + reproduce **sonido (o fallback accesible)** siempre.  
- Cronómetro/regresiva: **start/pause/resume/reset** correctos; **sin drift observable** (±1 s en 1 h).  
- **Accesibilidad (A11y):** navegación completa por teclado; foco visible; contrastes adecuados; `aria-live` en eventos; **Lighthouse/Axe sin issues críticas**.  
- **Responsive:** visualización correcta en **móvil y desktop**; **dark mode** automático con opción de toggle.  
- **Sin errores** en consola.

---

### ❓ PREGUNTAS (solo si el usuario no lo ha definido)
- ¿Límite de temporizadores visibles (p. ej. 50)? Si no, usar **50 por defecto**.  
- ¿Etiquetas obligatorias? Por defecto **opcionales**, autogeneradas como “Temporizador #n”.  
- ¿Necesitas botón “Duplicar” temporizador? Por defecto **sí**.

---

### 💾 SALIDA ESPERADA
- **Código autocontenido (HTML/CSS/JS)** separado en dos archivos: `index.html` y `script.js`.  
- **Mini-checklist final** que verifique **KPIs**, **accesibilidad (A11y)** y **permisos** antes de entrega.
```

---

## 3) Ejecución del prompt
- Modelo: **GPT-5 (modo de pensamiento estándar, no ampliado)**.  
- Adjuntos: **imagen** y archivo `index.html`.  
- Resultado: **Generación directa del código final del ejercicio. No ha hecho falta iterar.**

---

## 4) Secuencia de prompts utilizada
1. **Prompt inicial** (metaprompt completo de la sección 2).  
2. “**Divide este código en dos archivos: `index.html` y `script.js`**” *(no lo hizo a la primera)*.  
3. “**Quiero poder ejecutar el código sin necesidad de lanzar un servidor http (cargando directamente `index.html` como `file://...`)**”.
