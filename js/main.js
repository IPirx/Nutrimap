/* NutriMap Estudiantil · interacciones de la landing page (sitio informativo)
   La app vive aparte, en ../app/index.html. Cada bloque indica la historia de usuario (HU) que implementa.
   Sin dependencias externas: HTML, CSS y JavaScript nativos. */
(function () {
  "use strict";
  const D = window.NM_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const distLabel = (m) => (m >= 1000 ? (m / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 }) + " km" : m + " m");
  const icon = (id, cls = "icon icon-sm") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k, f) { try { const v = localStorage.getItem("nml." + k); return v === null ? f : JSON.parse(v); } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem("nml." + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  function announce(msg) { const a = $("[data-announcer]"); a.textContent = ""; setTimeout(() => { a.textContent = msg; }, 60); }

  /* Aviso temporal (role=status) */
  const snack = (() => {
    const el = $("[data-snackbar]"), text = $("[data-snackbar-text]"); let t = null;
    const hide = () => { el.hidden = true; clearTimeout(t); };
    $("[data-snackbar-close]").addEventListener("click", hide);
    return { show(msg) { clearTimeout(t); text.textContent = msg; el.hidden = false; t = setTimeout(hide, 10000); } };
  })();

  /* Errores de formulario: ícono + texto + borde (H9) */
  const errEl = (i) => { const id = (i.getAttribute("aria-describedby") || "").split(/\s+/).find((x) => x.endsWith("-error")); return id ? document.getElementById(id) : null; };
  const setError = (i, msg) => { i.setAttribute("aria-invalid", "true"); const e = errEl(i); if (e) { e.textContent = msg; e.hidden = false; } };
  const clearError = (i) => { i.removeAttribute("aria-invalid"); const e = errEl(i); if (e) { e.textContent = ""; e.hidden = true; } };
  const wireClear = (form) => { form.addEventListener("input", (e) => { if (e.target.hasAttribute("aria-invalid")) clearError(e.target); }); form.addEventListener("change", (e) => { if (e.target.hasAttribute("aria-invalid")) clearError(e.target); }); };
  const firstInvalid = (form) => { const f = form.querySelector('[aria-invalid="true"]'); if (f) f.focus(); return !!f; };
  function withPending(btn, label, fn) { const o = btn.textContent; btn.disabled = true; btn.textContent = label; setTimeout(() => { btn.disabled = false; btn.textContent = o; fn(); }, 600); }

  /* Navegación principal · US45 CA03: menú desplegable por debajo de 1024 px */
  const menuBtn = $(".menu-toggle"), nav = $("#menu-principal");
  function setMenu(open) {
    nav.classList.toggle("is-open", open); menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    $(".menu-toggle-label").textContent = open ? "Cerrar" : "Menú"; $("use", menuBtn).setAttribute("href", open ? "#i-close" : "#i-menu");
  }
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); } });
  document.addEventListener("click", (e) => { if (nav.classList.contains("is-open") && !e.target.closest(".site-header")) setMenu(false); });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", () => setMenu(false));

  /* Los enlaces internos mueven también el foco al destino (teclado y lector de pantalla) */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute("href").length < 2) return;
    const t = document.getElementById(a.getAttribute("href").slice(1)); if (!t) return;
    e.preventDefault(); history.replaceState(null, "", a.getAttribute("href"));
    t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    const h = t.matches("section") ? t.querySelector("h1, h2") || t : t; if (!h.matches("a, button, input, select, textarea, [tabindex]")) h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
  });
  const links = $$(".main-nav ul a");
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) links.forEach((l) => (l.getAttribute("href") === "#" + en.target.id ? l.setAttribute("aria-current", "true") : l.removeAttribute("aria-current"))); }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((l) => { const s = document.getElementById(l.getAttribute("href").slice(1)); if (s) spy.observe(s); });

  /* US39 · Pestañas por perfil, operables con flechas, Inicio y Fin */
  $$("[data-tabs]").forEach((wrap) => {
    const list = $('[role="tablist"]', wrap), tabs = () => $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs().forEach((t) => { const on = t === tab; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; const p = document.getElementById(t.getAttribute("aria-controls")); if (p) p.hidden = !on; });
      if (focus) tab.focus();
    }
    list.addEventListener("click", (e) => { const t = e.target.closest('[role="tab"]'); if (t) select(t, false); });
    list.addEventListener("keydown", (e) => {
      const l = tabs(), i = l.indexOf(document.activeElement); if (i < 0) return;
      const nx = e.key === "ArrowRight" ? l[(i + 1) % l.length] : e.key === "ArrowLeft" ? l[(i - 1 + l.length) % l.length] : e.key === "Home" ? l[0] : e.key === "End" ? l[l.length - 1] : null;
      if (nx) { e.preventDefault(); select(nx, true); }
    });
  });

  /* US40 · Radar de ejemplo: filtra por presupuesto y distancia; indica que los datos son simulados */
  (() => {
    const f = { price: null, distance: 2000 };
    const list = $("[data-demo-list]"), empty = $("[data-demo-empty]"), count = $("[data-demo-count]");
    function render() {
      $$("[data-demo-group=price] .chip").forEach((c) => c.setAttribute("aria-pressed", String((c.dataset.value === "" && f.price === null) || Number(c.dataset.value) === f.price)));
      $$("[data-demo-group=distance] .chip").forEach((c) => c.setAttribute("aria-pressed", String(Number(c.dataset.value) === f.distance)));
      const items = D.places.filter((p) => (f.price === null || p.price <= f.price) && p.distance <= f.distance).sort((a, b) => a.distance - b.distance);
      count.textContent = items.length ? `${items.length} ${items.length === 1 ? "local de ejemplo" : "locales de ejemplo"} · ordenados por distancia` : "Sin resultados";
      list.hidden = !items.length; empty.hidden = !!items.length;
      list.innerHTML = items.map((p) => `<li class="place"><div class="place-thumb" aria-hidden="true">${icon(p.type === "mercado" ? "store" : "leaf", "icon")}</div>
        <div><h3>${esc(p.name)}</h3><p class="place-meta">${esc(D.offerTypes[p.type])} · <strong>${esc(p.priceLabel)}</strong> · ${distLabel(p.distance)} · ${p.walk} min a pie</p>
        <div class="place-tags">${p.iron ? '<span class="badge badge-fe"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.2 4.4 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 2.8-6.6 6-11z"/></svg>Fuente de hierro</span>' : ""}<span class="badge badge-warning">Ejemplo</span></div></div></li>`).join("");
      if (!items.length) $("[data-demo-empty-text]").textContent = "No hay locales de ejemplo con estos filtros. Restablece el filtro para ver todos.";
    }
    $$("[data-demo-group]").forEach((g) => g.addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      if (g.dataset.demoGroup === "price") f.price = c.dataset.value === "" ? null : Number(c.dataset.value); else f.distance = Number(c.dataset.value);
      render(); announce(count.textContent);
    }));
    $("[data-demo-reset]").addEventListener("click", () => { f.price = null; f.distance = 2000; render(); announce("Filtro restablecido."); });
    render();
  })();

  /* US43 · Preguntas frecuentes: una abierta a la vez, con teclado */
  (() => {
    const acc = $("[data-accordion]");
    acc.addEventListener("click", (e) => {
      const b = e.target.closest("button[aria-expanded]"); if (!b) return;
      const open = b.getAttribute("aria-expanded") === "true";
      $$("button[aria-expanded]", acc).forEach((x) => { x.setAttribute("aria-expanded", "false"); document.getElementById(x.getAttribute("aria-controls")).hidden = true; });
      if (!open) { b.setAttribute("aria-expanded", "true"); document.getElementById(b.getAttribute("aria-controls")).hidden = false; }
    });
  })();

  /* US41 · Solicitud de información */
  (() => {
    const form = $("[data-contact-form]"), el = form.elements, count = $("#ct-msg-count");
    wireClear(form);
    el.message.addEventListener("input", () => { count.textContent = `${el.message.value.length} de 500 caracteres`; });
    form.addEventListener("submit", (e) => {
      e.preventDefault(); $("[data-contact-success]").hidden = true;
      [el.name, el.email, el.profile, el.message].forEach(clearError);
      if (!el.name.value.trim()) setError(el.name, "Escribe tu nombre completo.");
      const email = el.email.value.trim();
      if (!email) setError(el.email, "Escribe tu correo electrónico."); else if (!EMAIL_RE.test(email)) setError(el.email, "Ingresa un correo válido, por ejemplo nombre@correo.com.");
      if (!el.profile.value) setError(el.profile, "Selecciona tu perfil para orientarte mejor.");
      if (el.message.value.trim().length < 10) setError(el.message, "Cuéntanos en al menos 10 caracteres qué necesitas.");
      if (firstInvalid(form)) return;
      const name = el.name.value.trim().split(" ")[0];
      withPending(form.querySelector('button[type="submit"]'), "Enviando…", () => {
        const ok = $("[data-contact-success]"); ok.textContent = `Recibimos tu solicitud, ${name}. Te escribiremos a ${email} en un plazo de 2 días hábiles.`; ok.hidden = false; form.reset(); count.textContent = "0 de 500 caracteres";
      });
    });
  })();

  /* US42 · Lista de espera: correo y campus, consentimiento obligatorio, sin duplicados */
  (() => {
    const form = $("[data-waitlist-form]"), el = form.elements;
    $$("[data-campus-select]").forEach((s) => { s.innerHTML = `<option value="">${esc(s.dataset.placeholder || "Selecciona")}</option>` + D.campuses.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("") + '<option value="otro">Otro campus o distrito</option>'; });
    wireClear(form);
    form.addEventListener("submit", (e) => {
      e.preventDefault(); $("[data-waitlist-success]").hidden = true;
      [el.email, el.campus, el.consent].forEach(clearError);
      const email = el.email.value.trim().toLowerCase(), list = store.get("waitlist", []);
      if (!email) setError(el.email, "Escribe tu correo electrónico."); else if (!EMAIL_RE.test(email)) setError(el.email, "Ingresa un correo válido, por ejemplo nombre@upc.edu.pe."); else if (list.includes(email)) setError(el.email, "Este correo ya está en la lista de espera. No lo registramos dos veces.");
      if (!el.campus.value) setError(el.campus, "Elige tu campus o distrito.");
      if (!el.consent.checked) setError(el.consent, "Debes aceptar el uso de tu correo para unirte a la lista.");
      if (firstInvalid(form)) return;
      const place = el.campus.value === "otro" ? "tu distrito" : (D.campuses.find((c) => c.id === el.campus.value) || {}).name;
      withPending(form.querySelector('button[type="submit"]'), "Registrando…", () => { list.push(email); store.set("waitlist", list); const ok = $("[data-waitlist-success]"); ok.textContent = `Listo. Te avisaremos en ${email} cuando NutriMap llegue a ${place}.`; ok.hidden = false; form.reset(); });
    });
  })();
  void snack;
})();
