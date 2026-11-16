/* NutriMap Estudiantil · núcleo de la app
   Almacenamiento local, enrutador por hash, diálogos, avisos con «Deshacer» y validaciones compartidas.
   Sin dependencias: HTML, CSS y JavaScript nativos. */
(function () {
  "use strict";
  const NM = (window.NM = { act: {}, form: {}, chg: {}, inp: {}, R: {} });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  NM.$ = $; NM.$$ = $$;

  /* ---------- Utilidades ---------- */
  NM.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  NM.money = (n) => "S/ " + (Number.isInteger(n) ? n : Number(n).toFixed(2));
  NM.money2 = (n) => "S/ " + Number(n).toFixed(2);
  NM.norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  NM.distLabel = (m) => (m >= 1000 ? (m / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 }) + " km" : m + " m");
  NM.icon = (id, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  NM.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  NM.EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  NM.parseAmount = (raw) => { const v = String(raw).trim().replace(",", "."); return /^\d+(\.\d{1,2})?$/.test(v) ? Number(v) : NaN; };
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const hm = (d) => d.toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit" });
  NM.hm = hm;
  NM.fmtWhen = (ts) => {
    const d = new Date(ts), n = new Date(), y = new Date(); y.setDate(n.getDate() - 1);
    if (d.toDateString() === n.toDateString()) return "hoy " + hm(d);
    if (d.toDateString() === y.toDateString()) return "ayer " + hm(d);
    return d.getDate() + " " + MES[d.getMonth()] + " · " + hm(d);
  };
  NM.fmtDate = (ts) => { const d = new Date(ts); return `${d.getDate()} de ${MESL[d.getMonth()]} de ${d.getFullYear()}`; };
  NM.weekStart = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };
  NM.weekLabel = (start) => {
    const a = new Date(start), b = new Date(start + 6 * 864e5);
    return a.getMonth() === b.getMonth() ? `${a.getDate()} al ${b.getDate()} de ${MESL[b.getMonth()]}` : `${a.getDate()} de ${MESL[a.getMonth()]} al ${b.getDate()} de ${MESL[b.getMonth()]}`;
  };
  NM.todayIdx = () => (new Date().getDay() + 6) % 7;
  NM.cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Almacenamiento ---------- */
  const PFX = "nma.";
  const store = (NM.store = {
    get(k, f) { try { const v = localStorage.getItem(PFX + k); return v === null ? f : JSON.parse(v); } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(PFX + k); } catch (e) { /* sin almacenamiento */ } }
  });
  const S = (NM.S = {});
  const clone = (o) => JSON.parse(JSON.stringify(o));
  NM.load = () => {
    const keys = Object.keys(NM_SEED.defaults);
    if (store.get("ver", 0) !== NM_SEED.ver) { keys.forEach(store.del); store.set("ver", NM_SEED.ver); }
    keys.forEach((k) => { const v = store.get(k, undefined); S[k] = v === undefined ? clone(NM_SEED.defaults[k]) : v; });
  };
  NM.save = (...ks) => ks.forEach((k) => store.set(k, S[k]));
  NM.wipePersonal = () => {
    ["favs", "favRecipes", "plan", "planWeek", "checked", "extras", "removed", "renames", "spend", "history", "compare", "recovery", "reminders"].forEach((k) => { S[k] = clone(NM_SEED.defaults[k]); });
    S.spend = []; S.prefs = clone(NM_SEED.defaults.prefs);
    NM.save("favs", "favRecipes", "plan", "planWeek", "checked", "extras", "removed", "renames", "spend", "history", "compare", "recovery", "reminders", "prefs");
  };

  /* ---------- Cuenta ---------- */
  NM.user = () => { const u = S.session && S.users[S.session]; return u ? Object.assign({ email: S.session }, u) : null; };
  NM.role = () => (NM.user() || {}).role || "est";
  NM.home = (role) => ({ est: "/inicio", com: "/com/hoy", rev: "/rev" }[role] || "/inicio");
  NM.hash = async (text) => {
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 5381; for (const c of text) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
    return "djb2-" + h.toString(16);
  };
  NM.pwRules = { len: (p) => p.length >= 8, letter: (p) => /[a-záéíóúñ]/i.test(p), digit: (p) => /\d/.test(p) };
  NM.pwOk = (p) => Object.values(NM.pwRules).every((r) => r(p));

  /* ---------- Anuncios y aviso temporal (4.1.4: role=status, mínimo 10 s con «Deshacer») ---------- */
  NM.announce = (msg) => { const a = $("#announcer"); a.textContent = ""; setTimeout(() => { a.textContent = msg; }, 60); };
  const snackEl = () => $("#snack");
  let snackTimer = null, snackH = null, shownAt = 0, dur = 10000, snackAt = "";
  NM.snackHide = () => { const el = snackEl(); el.hidden = true; clearTimeout(snackTimer); snackH = null; };
  const resume = () => { if (!snackEl().hidden) { clearTimeout(snackTimer); snackTimer = setTimeout(NM.snackHide, Math.max(dur - (Date.now() - shownAt), 4000)); } };
  NM.snack = (msg, opts = {}) => {
    const el = snackEl(); clearTimeout(snackTimer);
    $("#snack-text").textContent = msg;
    snackH = opts.onAction || null;
    const b = $("#snack-act"); b.hidden = !snackH; b.textContent = opts.actionLabel || "Deshacer";
    el.hidden = false; shownAt = Date.now(); dur = opts.duration || 10000; snackAt = location.hash;
    snackTimer = setTimeout(NM.snackHide, dur);
  };
  NM.initSnack = () => {
    const el = snackEl();
    $("#snack-act").addEventListener("click", () => { const h = snackH; NM.snackHide(); if (h) h(); });
    $("#snack-x").addEventListener("click", NM.snackHide);
    el.addEventListener("mouseenter", () => clearTimeout(snackTimer));
    el.addEventListener("mouseleave", resume);
    el.addEventListener("focusin", () => clearTimeout(snackTimer));
    el.addEventListener("focusout", resume);
  };
  /* Aviso que se muestra tras la siguiente navegación (p. ej., «Cambios publicados») */
  NM.flash = null;

  /* ---------- Diálogos y hojas inferiores (4.1.4: dialog/alertdialog, foco atrapado, cierre con botón) ---------- */
  NM.dialog = (o) => {
    const d = document.createElement("dialog");
    d.className = "dlg " + (o.kind || "sheet");
    if (o.kind === "alert") d.setAttribute("role", "alertdialog");
    d.setAttribute("aria-labelledby", "dlg-title");
    d.innerHTML = `<div class="dlg-in"><div class="dlg-head"><h2 id="dlg-title">${NM.esc(o.title)}</h2>
      <button type="button" class="icon-btn" data-act="dlg-close" aria-label="Cerrar">${NM.icon("close")}</button></div>
      ${o.sub ? `<p class="muted dlg-sub">${NM.esc(o.sub)}</p>` : ""}<div class="dlg-body">${o.body}</div></div>`;
    document.body.appendChild(d);
    d.addEventListener("close", () => { d.remove(); if (o.onClose) o.onClose(); });
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    d.showModal();
    const f = o.focus ? $(o.focus, d) : null; if (f) f.focus();
    return d;
  };
  NM.closeDialogs = () => $$("dialog[open]").forEach((d) => d.close());
  NM.act["dlg-close"] = (el) => el.closest("dialog").close();
  NM.act["demo-reset"] = () => NM.dialog({ kind: "alert", title: "¿Restablecer la demostración?", body: `<div class="stack"><p>Se borran en este navegador todos los cambios hechos en la demo: artículos publicados, comentarios, etiquetas, platos, reportes, planes y cuentas creadas. La app vuelve a su estado inicial, como si nadie la hubiera usado.</p><div class="btn-row"><button type="button" class="btn btn-secondary" data-act="dlg-close" style="flex:1">Cancelar</button><button type="button" class="btn btn-danger" data-act="demo-reset-go" style="flex:1">Restablecer</button></div></div>` });
  NM.act["demo-reset-go"] = () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith("nma.")).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* sin almacenamiento */ }
    location.hash = "#/inicio"; location.reload();
  };

  /* ---------- Validaciones: ícono + texto + borde, nunca solo color (H9) ---------- */
  const errEl = (inp) => { const id = inp.id ? inp.id + "-error" : null; return id ? document.getElementById(id) : null; };
  NM.err = (inp, msg) => {
    inp.setAttribute("aria-invalid", "true");
    const e = errEl(inp); if (e) { e.innerHTML = NM.icon("alert", "icon icon-sm") + `<span>${NM.esc(msg)}</span>`; e.hidden = false; }
  };
  NM.clr = (inp) => { inp.removeAttribute("aria-invalid"); const e = errEl(inp); if (e) { e.innerHTML = ""; e.hidden = true; } };
  NM.firstInvalid = (root) => { const f = $('[aria-invalid="true"]', root); if (f) f.focus(); return !!f; };
  NM.field = (o) => {
    const id = o.id, desc = [o.help ? id + "-help" : "", id + "-error"].filter(Boolean).join(" ");
    const attrs = [o.type === "textarea" ? "" : `type="${o.type || "text"}"`, o.inputmode ? `inputmode="${o.inputmode}"` : "", o.auto ? `autocomplete="${o.auto}"` : "autocomplete=\"off\"", o.ph ? `placeholder="${NM.esc(o.ph)}"` : "", o.req ? 'required aria-required="true"' : "", o.name ? `name="${o.name}"` : "", o.max ? `maxlength="${o.max}"` : "", o.extra || ""].join(" ");
    const val = NM.esc(o.value == null ? "" : o.value);
    const control = o.type === "textarea" ? `<textarea id="${id}" rows="${o.rows || 3}" ${attrs} aria-describedby="${desc}">${val}</textarea>`
      : o.type === "select" ? `<select id="${id}" ${attrs} aria-describedby="${desc}">${o.options}</select>`
      : `<input id="${id}" value="${val}" ${attrs} aria-describedby="${desc}">`;
    const wrapped = o.prefix ? `<div class="input-prefix"><span aria-hidden="true">${o.prefix}</span>${control}</div>` : o.suffixBtn ? `<div class="input-action">${control}${o.suffixBtn}</div>` : control;
    return `<div class="field${o.cls ? " " + o.cls : ""}"><label for="${id}">${NM.esc(o.label)}${o.req ? ' <span class="req" aria-hidden="true">*</span>' : ""}</label>${wrapped}
      ${o.help ? `<p id="${id}-help" class="hint">${NM.esc(o.help)}</p>` : ""}<p id="${id}-error" class="error-msg" hidden></p></div>`;
  };
  NM.badge = (t, k = "", dot = false) => `<span class="badge${k ? " badge-" + k : ""}${dot ? " badge-dot" : ""}">${NM.esc(t)}</span>`;
  NM.alert = (kind, title, text, ic) => `<div class="notice notice-${kind}" role="${kind === "error" || kind === "warning" ? "alert" : "status"}">${NM.icon(ic || (kind === "success" ? "check" : kind === "info" ? "info" : "alert"))}<div>${title ? `<p><strong>${NM.esc(title)}</strong></p>` : ""}${text ? `<p>${text}</p>` : ""}</div></div>`;
  NM.chip = (label, pressed, attrs = "") => `<button type="button" class="chip" aria-pressed="${!!pressed}" ${attrs}>${label}</button>`;
  NM.sw = (label, on, attrs, hint) => `<div class="switch-row"><span>${NM.esc(label)}${hint ? ` <span class="hint">${NM.esc(hint)}</span>` : ""}</span>
    <button type="button" class="switch" role="switch" aria-checked="${!!on}" aria-label="${NM.esc(label)}" ${attrs}><span class="switch-text">${on ? "Activado" : "Desactivado"}</span></button></div>`;
  /* Las rutas de la app viven en el hash: «/aprende» debe ir como «#/aprende» o el navegador busca un archivo que no existe */
  NM.tabs = (items, active, label) => `<nav class="tabs" aria-label="${NM.esc(label)}">${items.map(([k, t, href]) => `<a href="${href.startsWith("/") ? "#" + href : href}" ${k === active ? 'aria-current="page"' : ""}>${NM.esc(t)}</a>`).join("")}</nav>`;
  NM.prog = (pct, label, over) => `<div class="progress${over ? " is-over" : ""}" role="progressbar" aria-label="${NM.esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(pct, 100)}"><span class="progress-bar" style="width:${Math.min(pct, 100)}%"></span></div>`;

  /* ---------- Enrutador ---------- */
  const routes = [];
  NM.route = (pattern, def) => {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:([a-z]+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "$");
    routes.push({ re, keys, def });
  };
  const parse = () => { const raw = location.hash.replace(/^#/, "") || "/"; const [path, qs] = raw.split("?"); return { path: path || "/", q: Object.fromEntries(new URLSearchParams(qs || "")) }; };
  NM.go = (p, replace) => {
    /* Si el aviso se acaba de mostrar para acompañar esta navegación («snack» y luego «go»), viaja a la pantalla nueva */
    if (!snackEl().hidden && Date.now() - shownAt < 400) snackAt = "#" + p;
    if (location.hash === "#" + p) { NM.render(); return; }
    if (replace) location.replace("#" + p); else location.hash = p;
  };
  NM.cur = () => parse();
  NM.nav = {
    est: [["home", "Inicio", "/inicio"], ["radar", "Radar", "/radar"], ["plan", "Plan", "/plan"], ["learn", "Aprende", "/aprende"], ["user", "Perfil", "/perfil"]],
    com: [["home", "Hoy", "/com/hoy"], ["doc", "Mi menú", "/com/oferta"], ["pin", "Perfil público", "/com/perfil"], ["flag", "Reportes", "/com/reportes"]],
    rev: [["check", "Revisión", "/rev"], ["learn", "Contenido", "/rev/contenido"], ["user", "Cuenta", "/rev/cuenta"]]
  };
  const root = () => $("#root");
  const focusKey = (el) => (el && el.dataset && el.dataset.act ? el.dataset.act + "|" + (el.dataset.id || el.dataset.v || el.dataset.k || "") : el && el.id ? "#" + el.id : null);

  function shell(v, ctx) {
    const kind = v.nav || (ctx.role === "com" ? "com" : ctx.role === "rev" ? "rev" : "est");
    const items = kind === "none" ? [] : NM.nav[kind];
    const here = ctx.path;
    const active = (href) => here === href || (href !== "/rev" && here.startsWith(href + "/")) || (href === "/rev" && (here === "/rev" || here.startsWith("/rev/articulo") || here.startsWith("/rev/etiqueta") || here.startsWith("/rev/historial")));
    const badgeFor = (href) => (href === "/com/reportes" && NM.newReports ? NM.newReports() : 0);
    const link = (it, cls) => { const [ic, label, href] = it; const n = badgeFor(href); return `<a class="${cls}${active(href) ? " on" : ""}" href="#${href}" ${active(href) ? 'aria-current="page"' : ""}>${cls === "bn-it" ? `<span class="pill">${NM.icon(ic)}</span>` : ""}${label}${n ? `<span class="nav-count" aria-label="${n} nuevos">${n}</span>` : ""}</a>`; };
    const u = NM.user();
    const loc = S.loc.mode === "gps" ? "Tu ubicación actual" : (NM_DATA.campuses.find((c) => c.id === S.loc.campus) || NM_DATA.campuses[0]).name;
    const right = kind === "est"
      ? `<a class="loc-chip" href="#/ubicacion" aria-label="Ubicación: ${NM.esc(loc)}, radio ${NM.distLabel(S.loc.radius)}. Cambiar">${NM.icon("pin")}<span>${NM.esc(loc)} · ${NM.distLabel(S.loc.radius)}</span><span class="link-like">Cambiar</span></a>
         ${u ? `<a class="avatar" href="#/perfil" aria-label="Mi perfil">${NM.esc((u.name || u.email)[0].toUpperCase())}</a>` : `<a class="btn btn-secondary btn-compact" href="#/ingresar">Ingresar</a>`}`
      : kind === "none" ? "" : `<span class="who">${NM.esc(u ? u.name : "")}</span><a class="avatar" href="#${kind === "rev" ? "/rev/cuenta" : "/com/cuenta"}" aria-label="Mi cuenta">${NM.esc(u ? (u.name || "?")[0].toUpperCase() : "?")}</a>`;
    const back = v.back ? `<a class="icon-btn back-btn" href="#${v.back}" data-act="back" data-to="${v.back}" aria-label="Volver">${NM.icon("back")}</a>` : "";
    const acts = (v.actions || []).join("");
    return `<a class="skip-link" href="#main">Saltar al contenido principal</a>
      <header class="app-header"><div class="hd-in">
        <a class="brand" href="#${NM.home(ctx.role)}" aria-label="NutriMap, ir al inicio"><img src="../assets/images/logo.svg" alt="" width="28" height="28"><span>NutriMap</span>${kind === "com" || kind === "rev" ? `<span class="role-tag">${kind === "com" ? "Comercio" : "Nutricionista"}</span>` : ""}</a>
        <nav class="top-nav" aria-label="Principal">${items.map((it) => link(it, "tn-it")).join("")}</nav>
        <div class="hd-right">${right}<a class="site-link" href="../pages/index.html">Ir al sitio</a></div></div></header>
      <main id="main" class="app-main${v.wide ? " wide" : ""}" tabindex="-1">
        <div class="page-head">${back}<div class="ph-t"><h1>${NM.esc(v.heading || v.title)}</h1>${v.sub ? `<p class="ph-s">${v.sub}</p>` : ""}</div>${acts ? `<div class="ph-a">${acts}</div>` : ""}</div>
        ${NM.flash ? (() => { const f = NM.flash; NM.flash = null; return f; })() : ""}
        <div class="page-body">${v.html}</div></main>
      <footer class="app-foot"><a href="../pages/index.html">Ir al sitio de NutriMap</a><span> · La app es un espacio aparte del sitio informativo.</span><span> · </span><button type="button" class="btn-link foot-reset" data-act="change-role">Cambiar rol</button><span> · </span><button type="button" class="btn-link foot-reset" data-act="demo-reset">Restablecer demo</button></footer>
      ${items.length ? `<nav class="bottom-nav" aria-label="Principal">${items.map((it) => link(it, "bn-it")).join("")}</nav>` : ""}`;
  }

  /* Al marcar una casilla se vuelve a dibujar la pantalla: se conserva lo que la persona ya escribió y los formularios abiertos de [data-keep] */
  const snapDrafts = () => ({
    open: $$("[data-keep]").filter((h) => h.innerHTML.trim()).map((h) => [h.dataset.keep, h.innerHTML]),
    vals: $$("#main textarea[id], #main input[id]:not([type=checkbox]):not([type=radio])").filter((e) => e.value).map((e) => [e.id, e.value])
  });
  const restoreDrafts = (d) => {
    d.open.forEach(([k, html]) => { const h = $$("[data-keep]").find((x) => x.dataset.keep === k); if (h) h.innerHTML = html; });
    d.vals.forEach(([id, v]) => { const e = document.getElementById(id); if (e && !e.value) e.value = v; });
  };
  NM.render = (opts = {}) => {
    const { path, q } = parse();
    let m = null;
    for (const r of routes) { const x = r.re.exec(path); if (x) { m = { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(x[i + 1])])) }; break; } }
    if (!m) { NM.go("/inicio", true); return; }
    const user = NM.user(), role = user ? user.role : "est";
    /* Al abrir la app sin sesión ni rol elegido, primero se pregunta el rol */
    if (!user && !S.entry && path !== "/rol") { NM.go("/rol", true); return; }
    const ctx = { params: m.params, q, path, user, role };
    if (m.r.def.guard) { const to = m.r.def.guard(ctx); if (to) { NM.go(to, true); return; } }
    const v = m.r.def.view(ctx);
    if (v.redirect) { NM.go(v.redirect, true); return; }
    const y = window.scrollY, fk = opts.keep ? focusKey(document.activeElement) : null;
    /* Un aviso de otra pantalla no debe quedarse tapando la nueva */
    if (!opts.keep && !snackEl().hidden && location.hash !== snackAt) NM.snackHide();
    const drafts = opts.keep ? snapDrafts() : null;
    root().innerHTML = shell(v, ctx);
    if (drafts) restoreDrafts(drafts);
    document.title = (v.title || "NutriMap") + " · NutriMap Estudiantil";
    NM.cleanup && NM.cleanup(); NM.cleanup = null;
    if (v.mount) v.mount(ctx);
    if (opts.keep) {
      window.scrollTo(0, y);
      if (fk) { const t = fk[0] === "#" ? document.getElementById(fk.slice(1)) : $$("[data-act]").find((e) => focusKey(e) === fk); if (t) t.focus({ preventScroll: true }); }
    } else {
      window.scrollTo(0, 0);
      const h = $("#main h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      NM.announce((v.heading || v.title) + ".");
    }
  };
  NM.refresh = () => NM.render({ keep: true });

  /* ---------- Eventos delegados ---------- */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    const fn = NM.act[el.dataset.act];
    if (!fn) return;
    if (el.tagName === "A" && el.dataset.native === undefined) e.preventDefault();
    fn(el, e);
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    NM.form[f.dataset.form](f, e);
  });
  document.addEventListener("change", (e) => { const el = e.target.closest("[data-chg]"); if (el && NM.chg[el.dataset.chg]) NM.chg[el.dataset.chg](el, e); });
  document.addEventListener("input", (e) => {
    if (e.target.hasAttribute && e.target.hasAttribute("aria-invalid")) NM.clr(e.target);
    const el = e.target.closest("[data-inp]"); if (el && NM.inp[el.dataset.inp]) NM.inp[el.dataset.inp](el, e);
  });
  NM.act.back = (el) => { const to = el.dataset.to; if (history.length > 1 && document.referrer !== "" && NM.navCount > 1) history.back(); else NM.go(to || "/inicio"); };
  NM.navCount = 0;
  window.addEventListener("hashchange", () => { NM.navCount++; NM.closeDialogs(); NM.render(); });
})();
