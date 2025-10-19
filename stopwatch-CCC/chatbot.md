# Informe de flujo de trabajo con ChatGPT para generar código (cronómetros múltiples)

> Archivo: `informe-flujo-chatgpt-cronometros.md`  
> Contexto breve: Usé **ChatGPT (GPT-5 Thinking)** con un **metaprompter** para generar el código de una app web con cronómetro y cuenta regresiva múltiples. No domino muchos detalles del código, así que me centré en **UX y accesibilidad** y en asegurar la **funcionalidad requerida**. El prompt funcionó a la **primera**, pero eché en falta más control paso a paso.
> Metarpompter: https://chatgpt.com/g/g-68f4b8b840588191bfe3432d1422c042-lidr-generadorpromptsprogramacion/
---

## 1) ¿**Qué chatbot(s)** usaste?
- **ChatGPT (GPT-5 Thinking)** en modo estándar.  
- Metodología: primero creé un **metaprompter** (rol, restricciones, criterios de calidad, verificación de precondiciones) y luego ejecuté un **prompt único** con imágenes y archivos base.  
- Objetivo del metaprompter: maximizar adherencia al prompt final, que incluyó preguntas sobre detalles de implementación como nivel de accesibilidad deseado, modo de notificar con sonidos, persistencia, compatibilidad con plataformas, stack de programación, persistencia, etc. 

---

## 2) ¿**Qué problemas** encontraste al interactuar con el modelo?
- **Código “caja negra”**: el modelo generó una solución extensa; **no entiendo la mitad** del código, lo que dificulta auditar arquitectura y rendimiento.
- **Control limitado del proceso**: el **prompt único** resolvió “de golpe”, pero **sin iteraciones guiadas** (plan → diseño → pruebas). Echo de menos checkpoints.
- **Dependencias implícitas del navegador**: manejo de permisos de **Notification** y desbloqueo de **AudioContext** requerían gestos de usuario; fácil de pasar por alto si no se valida explícitamente. No entiendo exactamente cómo se ha gestionado. 
- **Terminología/confusiones**: conceptos como *drift*, *laps*, o estrategias de tick (rAF vs setTimeout) me resultaron difíciles de entender sin una guía previa.
- **División de archivos**: el modelo no separó a la primera en `index.html` y `script.js` y tuve que insistir.
- **Ejecución `file://`**: tuve que recalcar que debía funcionar **sin servidor**, lo cual afecta a rutas y a ciertas APIs.

---

## 3) ¿**Qué decisiones** tuviste que tomar tú como desarrollador para mejorar el código propuesto?
En realidad no las tomé yo, sino que las tomó el modelo por mí. El prompt final incluía estas decisiones como requisitos obligatorios para la solución. Entre las más importantes:
- **UX/A11y exigentes**: cumplimiento **WCAG 2.2 AA**, dark mode por `prefers-color-scheme`, `aria-live` en eventos, foco visible y navegación completa por teclado.
- **Experiencia multi-temporizador**: tarjetas con controles **Iniciar/Pausar/Reanudar/Restablecer/Eliminar** y **etiquetas opcionales autogeneradas** (“Temporizador #n”).
- **Notificaciones y sonido**: uso de **Notification API** y **Web Audio API**; **fallback accesible** (`aria-live` + banner) si no hay permiso; desbloqueo de `AudioContext` bajo gesto de usuario.
- **Precisión sin drift**: cálculo por **tiempo absoluto** (`performance.now()` / `Date.now()`) en lugar de incrementos fijos; tolerancia **±1 s en 1 h**.
- **Rendimiento/KPIs**: **≥20 temporizadores activos**, **p95 ≤ 100 ms** en interacción, **sin memory leaks**.
- **Compatibilidad y stack**: **Chrome/Firefox/Edge** actuales; **Vanilla HTML/CSS/JS ES2020+**; **sin bundlers** ni librerías externas; **sin persistencia**.
- **Arquitectura y separación**: **módulos ES** (`engine`, `store`, `ui`) y **eventos** (`timer:tick`, `timer:done`) para aislar lógica y DOM.
- **Estados y guardas**: flujo `idle → running → paused → finished` con validaciones de transición.
- **Política de ticks**: preferencia por **`requestAnimationFrame`** (alternativa documentada **`setTimeout(250ms)`**), siempre corrigiendo por tiempo absoluto.
- **Manejo de errores y seguridad**: `try/catch`, evitar `innerHTML` inseguro, sanitizar entradas, funciones puras y nombres claros.
- **Pruebas mínimas**: unit tests de cálculo (pausa/reanudación/precisión) y auditorías manuales **Lighthouse/Axe**.
- **Microcopy en es-ES**: textos claros (“Iniciar”, “Pausar”, “Reanudar”, “Restablecer”, “Eliminar”; “Tiempo finalizado para [Etiqueta]”).


---

## 4) ¿**Cómo evaluarías** la utilidad de este flujo de trabajo real?
**Valor**  
- **Alta velocidad** para un MVP funcional y accesible.  
- Buen “andamiaje” si no dominas todos los detalles: puedes centrarte en **requisitos, UX y criterios de aceptación**.

**Riesgos**  
- **Comprensibilidad/mentenibilidad**: si no entiendes la arquitectura, cuesta depurar, optimizar o extender.  
- **Verificación insuficiente**: sin pasos intermedios, es fácil pasar por alto **edge cases** o problemas de rendimiento.

**Qué haría distinto la próxima vez (control paso a paso)**
1. **Fase 1 — Plan y contratos**: obtener **plan**, **diagrama de estados**, API de eventos y estructura de archivos antes de recibir código.  
2. **Fase 2 — Prototipo mínimo**: solo **un temporizador**, sin estilos, validando precisión y notificaciones/audio.  
3. **Fase 3 — Escalar a múltiples**: añadir gestor de instancias, rendimiento con ≥20 temporizadores.  
4. **Fase 4 — UX/A11y**: aplicar diseño responsivo, dark mode y auditorías A11y.  
5. **Fase 5 — Pruebas y checklist**: tests de cálculo, Lighthouse/Axe ≥90, pruebas `file://`, revisión de permisos.

**Conclusión**  
- **Útil** para acelerar resultados cuando el tiempo apremia y se prioriza **funcionalidad + UX básica**.  
- Para proyectos mantenibles, conviene **no ceder todo el control**: introducir **hitos intermedios**, exigir **explicaciones de diseño** y generar **pruebas** junto al código.
