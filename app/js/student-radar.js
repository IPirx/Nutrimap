/* NutriMap Estudiantil · estudiante: ubicación, radar, ficha del local, ruta, reporte y comparación
   US01 US02 US10 US15 US16 US17 US18 US19 US27 US09 US47 */
(function () {
  "use strict";
  const NM = window.NM, S = NM.S, D = window.NM_DATA, R = NM.R;
  const { $, $$, esc, money, norm, distLabel, icon } = NM;
  /* Mismo juego de chips en la app, la landing y los mockups */
  const PRICES = [5, 8, 10, 12];
  const TYPES = Object.keys(D.offerTypes);

  /* ---------- Ubicación · US10 ---------- */
  NM.route("/bienvenida", { view: () => ({
    title: "Bienvenida", heading: "Encuentra comida cerca de tu campus", nav: "none",
    html: `<div class="narrow stack">
      <img class="hero-img" src="../assets/images/hero-ilustracion.svg" width="480" height="360" alt="Mapa alrededor del campus con locales marcados por su precio y tu ubicación en el centro.">
      <p>Para mostrarte opciones cercanas necesitamos saber dónde estás. Solo usamos tu ubicación mientras buscas y nunca la compartimos con otras personas.</p>
      <ul class="checks"><li>${icon("check", "icon icon-sm")}Se usa solo con la app abierta</li><li>${icon("check", "icon icon-sm")}Puedes cambiarlo en Perfil › Privacidad</li></ul>
      <p class="form-alert is-info" data-gps-msg role="status" hidden></p>
      <button class="btn btn-primary btn-block" type="button" data-act="loc-gps">${icon("gps", "icon icon-sm")}Usar mi ubicación actual</button>
      <a class="btn btn-secondary btn-block" href="#/ubicacion?next=/radar">Elegir campus manualmente</a>
      <button class="btn-link center" type="button" data-act="loc-later">Ahora no</button></div>`
  }) });
  NM.act["loc-later"] = () => { S.loc.asked = true; NM.save("loc"); NM.snack(`De acuerdo. Mostramos opciones cerca de ${NM.campus(S.loc.campus).name}; puedes cambiarlo cuando quieras.`); NM.go("/radar"); };
  NM.act["loc-gps"] = () => {
    const msg = $("[data-gps-msg]");
    msg.hidden = false; msg.className = "form-alert is-info";
    if (!("geolocation" in navigator)) { msg.className = "form-alert"; msg.textContent = "Tu navegador no permite compartir la ubicación. Elige tu campus en la lista."; return; }
    msg.textContent = "Pidiendo permiso a tu navegador…";
    navigator.geolocation.getCurrentPosition(
      () => { S.loc.mode = "gps"; S.loc.asked = true; NM.save("loc"); NM.snack("Usamos tu ubicación actual solo mientras usas NutriMap."); NM.go("/radar"); },
      () => { msg.className = "form-alert"; msg.textContent = "No pudimos obtener tu ubicación. Elige tu campus manualmente; las distancias se calcularán desde ahí."; },
      { timeout: 8000 });
  };

  NM.route("/ubicacion", { view: ({ q }) => ({
    title: "Elegir ubicación", heading: "Elegir ubicación", sub: "Ubicación manual", back: q.next || "/radar",
    html: `<form class="narrow stack" data-form="loc" data-next="${esc(q.next || "/radar")}" novalidate>
      ${NM.field({ id: "loc-q", label: "Campus o dirección", value: NM.campus(S.loc.campus).name, help: "Escribe al menos 3 letras para ver sugerencias", extra: 'data-inp="loc-q"', auto: "off" })}
      <fieldset class="field"><legend>Campus sugeridos</legend><div class="radio-list" data-campus-list></div></fieldset>
      <fieldset class="field"><legend>Radio de búsqueda</legend><div class="chip-group">${[500, 1000, 2000].map((r) => `<label class="chip-radio"><input type="radio" name="radius" value="${r}" ${S.loc.radius === r ? "checked" : ""}><span>${distLabel(r)}</span></label>`).join("")}</div></fieldset>
      <button class="btn btn-primary btn-block" type="submit">Confirmar ubicación</button></form>`,
    mount: () => paintCampuses(NM.campus(S.loc.campus).name)
  }) });
  function paintCampuses(text) {
    const n = norm(text), cur = ($('input[name="campus"]:checked') || {}).value || S.loc.campus;
    const list = D.campuses.filter((c) => n.length < 3 || norm(c.name + " " + c.address).includes(n) || c.id === cur);
    $("[data-campus-list]").innerHTML = list.map((c) => `<label class="radio"><input type="radio" name="campus" value="${c.id}" ${c.id === cur ? "checked" : ""}><span>${esc(c.name)} <span class="hint">${esc(c.address)}</span></span></label>`).join("") || '<p class="muted">No encontramos ese campus. Prueba con otro nombre.</p>';
  }
  NM.inp["loc-q"] = (el) => paintCampuses(el.value);
  NM.form.loc = (f) => {
    const campus = ($('input[name="campus"]:checked', f) || {}).value || S.loc.campus;
    const radius = Number(($('input[name="radius"]:checked', f) || {}).value || 1000);
    S.loc = { campus, radius, mode: "campus", asked: true }; NM.save("loc");
    R.distance = radius;
    NM.snack(`Buscando alrededor de ${NM.campus(campus).name}, radio de ${distLabel(radius)}.`);
    NM.go(f.dataset.next || "/radar");
  };

  /* ---------- Radar ---------- */
  const chipFromBudget = () => { const cap = S.prefs.budget / 7; let c = PRICES[0]; PRICES.forEach((x) => { if (x <= cap) c = x; }); return c; };
  NM.resetRadar = () => { R.price = chipFromBudget(); R.touched = false; R.distance = S.loc.radius; R.types = new Set(TYPES); R.iron = false; R.open = false; R.q = ""; };
  const initRadar = () => { if (!R.ready) { NM.resetRadar(); R.ready = true; R.sort = "distance"; R.zoom = 1; R.sel = null; } };
  const matches = (p) => {
    if (!p.published) return false;
    if (R.price !== null && p.price > R.price) return false;
    if (p.distance > R.distance) return false;
    if (!R.types.has(p.type)) return false;
    if (R.iron && !NM.placeIron(p)) return false;
    if (R.open && !p.open) return false;
    if (R.q) { const hay = norm([p.name, NM.typeLabel(p.type), ...p.menu.map((m) => m.dish)].join(" ")); if (!norm(R.q).split(/\s+/).every((w) => hay.includes(w))) return false; }
    return true;
  };
  const activeCount = () => (R.price !== null ? 1 : 0) + (R.distance !== S.loc.radius ? 1 : 0) + (R.types.size < TYPES.length ? 1 : 0) + (R.iron ? 1 : 0) + (R.open ? 1 : 0);
  const sorted = (arr) => arr.slice().sort((a, b) => (S.prefs.iron ? Number(NM.placeIron(b)) - Number(NM.placeIron(a)) : 0) || (R.sort === "price" ? a.price - b.price : a.distance - b.distance) || a.distance - b.distance);

  NM.favBtn = (id, name, cls = "icon-btn") => { const on = S.favs.includes(id); return `<button type="button" class="${cls}" data-act="fav" data-id="${id}" data-name="${esc(name)}" aria-pressed="${on}" aria-label="${on ? "Quitar de favoritos" : "Guardar en favoritos"}: ${esc(name)}">${icon(on ? "starf" : "star")}</button>`; };
  const card = (p) => {
    const cmp = S.compare.includes(p.id);
    return `<li class="place card"><div class="place-thumb" aria-hidden="true">${icon(NM.typeIcon(p.type))}</div>
      <div class="place-main"><h3><a class="place-title" href="#/local/${p.id}">${esc(p.name)}</a></h3>
        <p class="place-meta">${esc(NM.typeLabel(p.type))} · <strong>${esc(NM.priceLabel(p))}</strong> · ${distLabel(p.distance)} · ${p.walk} min a pie</p>
        <div class="tags">${NM.placeBadges(p)}</div><p class="place-upd">${icon("clock", "icon icon-sm")}${esc(NM.updLabel(p))}</p></div>
      <div class="place-actions">${NM.favBtn(p.id, p.name)}<button type="button" class="chip cmp" data-act="cmp" data-id="${p.id}" data-name="${esc(p.name)}" aria-pressed="${cmp}">Comparar<span class="sr-only"> ${esc(p.name)}</span></button></div></li>`;
  };
  const filtersHtml = () => `<div class="filters"><div class="f-row"><h2 class="f-title">Filtros</h2><button type="button" class="btn-link" data-act="f-reset">Restablecer</button></div>
    <fieldset class="field"><legend>Presupuesto por comida</legend><div class="chip-group">${PRICES.map((v) => NM.chip("Hasta S/ " + v, R.price === v, `data-act="f-price" data-v="${v}"`)).join("")}${NM.chip("Sin límite", R.price === null, 'data-act="f-price" data-v=""')}</div></fieldset>
    <fieldset class="field"><legend>Distancia máxima</legend><div class="chip-group">${[500, 1000, 2000].map((v) => NM.chip(distLabel(v), R.distance === v, `data-act="f-dist" data-v="${v}"`)).join("")}</div></fieldset>
    <fieldset class="field"><legend>Tipo de oferta</legend>${TYPES.map((t) => `<label class="check"><input type="checkbox" value="${t}" data-chg="f-type" ${R.types.has(t) ? "checked" : ""}> ${esc(D.offerTypes[t])}</label>`).join("")}</fieldset>
    ${NM.sw("Solo con fuentes de hierro", R.iron, 'data-act="f-iron"', "Según etiquetas revisadas")}${NM.sw("Abierto ahora", R.open, 'data-act="f-open"')}</div>`;

  function paintFilters() { $$(".filters-host").forEach((h) => { const fk = document.activeElement; h.innerHTML = filtersHtml(); }); const n = $("[data-sheet-count]"); if (n) n.textContent = `Ver ${sorted(NM.places().filter(matches)).length} resultados`; }
  NM.places = () => S.places;

  function paint(immediate) {
    const box = $("[data-results]"); if (!box) return;
    const items = sorted(S.places.filter(matches));
    const chips = [];
    if (R.price !== null) chips.push(["price", "Hasta " + money(R.price) + (R.price === chipFromBudget() && !R.touched ? " · según tu presupuesto" : "")]);
    if (R.distance !== S.loc.radius) chips.push(["dist", distLabel(R.distance)]);
    if (R.types.size < TYPES.length) R.types.forEach((t) => chips.push(["type:" + t, D.offerTypes[t]]));
    /* El hierro tiene su propio chip fijo (siempre visible), así que no se repite entre los filtros activos */
    { const fe = $("[data-fe-chip]"); if (fe) fe.setAttribute("aria-pressed", String(R.iron)); }
    if (R.open) chips.push(["open", "Abierto ahora"]);
    if (R.q) chips.push(["q", "“" + R.q + "”"]);
    $("[data-chips]").innerHTML = chips.map(([k, l]) => `<button type="button" class="chip chip-remove" data-act="f-rm" data-v="${esc(k)}" aria-label="Quitar filtro ${esc(l)}">${esc(l)}${icon("close", "icon icon-sm")}</button>`).join("");
    const n = activeCount(); $("[data-fbtn]").innerHTML = `${icon("filter", "icon icon-sm")}Filtros${n ? ` (${n})` : ""}`;
    clearTimeout(R.timer);
    const done = () => {
      if (!$("[data-results]")) return;
      box.setAttribute("aria-busy", "false");
      $("[data-count]").textContent = items.length ? `${items.length} ${items.length === 1 ? "opción" : "opciones"} · ordenadas por ${R.sort === "price" ? "precio" : "distancia"}` : "Sin resultados";
      box.innerHTML = items.length ? `<div class="res-list"><ul class="place-list">${items.map(card).join("")}</ul></div>${mapPane(items)}` : empty();
      box.dataset.view = S.view;
    };
    if (immediate) done();
    else { box.setAttribute("aria-busy", "true"); $("[data-count]").textContent = "Cargando resultados…"; box.innerHTML = '<div class="res-list"><ul class="place-list"><li class="card skeleton" aria-hidden="true"></li><li class="card skeleton" aria-hidden="true"></li><li class="card skeleton" aria-hidden="true"></li></ul></div>'; R.timer = setTimeout(done, 350); }
  }
  const mapPane = (items) => {
    const sel = items.find((p) => p.id === R.sel);
    return `<div class="res-map">${NM.mapHtml({ pins: items.map((p) => ({ id: p.id, x: p.x, y: p.y, label: money(p.price), iron: NM.placeIron(p), sel: p.id === R.sel, name: p.name, distance: p.distance })), zoom: R.zoom, zoomBtns: true, h: 300 })}
      <p class="map-legend"><span><span class="lg-pin lg-fe" aria-hidden="true">${icon("fe", "icon icon-xs")}S/</span>Con fuente de hierro revisada</span><span><span class="lg-pin" aria-hidden="true">S/</span>Sin etiqueta</span></p><p class="hint">Cada pin muestra el precio. Puedes recorrerlos con Tab; la vista de lista tiene la misma información.</p>${sel ? `<ul class="place-list">${card(sel)}</ul>` : ""}</div>`;
  };
  function empty() {
    const sug = R.q ? NM.suggest(R.q) : null;
    const base = S.places.filter((p) => p.published && (R.price === null || p.price <= R.price) && R.types.has(p.type) && (!R.iron || NM.placeIron(p)) && (!R.open || p.open) && (!R.q || true));
    const nextR = R.distance < 1000 ? 1000 : 2000;
    const countAt = (m) => S.places.filter((p) => { const d = R.distance; R.distance = m; const ok = matches(p); R.distance = d; return ok; }).length;
    let h, acts = "";
    if (R.q) {
      h = `<h3>0 resultados para «${esc(R.q)}» con tus filtros</h3><p class="muted">Buscamos en platos, insumos y locales.</p>`;
      if (sug) { h += `<p><strong>¿Quisiste decir «${esc(sug)}»?</strong></p>`; acts += `<button type="button" class="btn btn-primary btn-compact" data-act="try-term" data-v="${esc(sug)}">Buscar «${esc(sug)}»</button>`; }
      else h += `<p class="muted">Prueba con otro nombre, como lentejas, menestras o frejoles.</p>`;
    } else if (R.distance < 2000 && base.length && countAt(nextR) > 0) {
      h = `<h3>No hay opciones a ${distLabel(R.distance)}</h3><p class="muted">Aún no hay locales registrados en este radio. Amplía la búsqueda para ver más.</p>`;
      acts += `<button type="button" class="btn btn-primary btn-compact" data-act="widen" data-v="${nextR}">Ampliar a ${distLabel(nextR)} (${countAt(nextR)} ${countAt(nextR) === 1 ? "opción" : "opciones"})</button>`;
      if (nextR === 1000 && countAt(2000) > countAt(1000)) acts += `<button type="button" class="btn btn-secondary btn-compact" data-act="widen" data-v="2000">Ampliar a 2 km</button>`;
    } else h = `<h3>No hay locales con estos filtros</h3><p class="muted">Quita alguno de los filtros activos para ver más opciones.</p>`;
    return `<div class="empty-state">${icon("search", "icon icon-lg")}${h}<div class="btn-row center">${acts}<button type="button" class="btn btn-secondary btn-compact" data-act="f-reset">Restablecer filtros</button></div></div>`;
  }
  const changed = (immediate) => { paintFilters(); paint(immediate); };

  NM.route("/radar", {
    guard: () => (S.loc.asked ? null : "/bienvenida"),
    view: () => {
      initRadar();
      const off = navigator.onLine === false;
      return {
        title: "Radar", heading: "Radar", sub: `${esc(NM.campus(S.loc.campus).name)} · radio ${distLabel(S.loc.radius)}`, wide: true,
        html: `<div class="radar">
          <aside class="filters-panel card filters-host" aria-label="Filtros"></aside>
          <div class="radar-main">
            <form class="search" role="search" data-form="rsearch"><label for="rq" class="sr-only">Buscar plato, insumo o local</label>
              <div class="input-icon">${icon("search")}<input id="rq" type="search" value="${esc(R.q)}" placeholder="Menú, lentejas, mercado…" autocomplete="off" list="rterms" data-inp="rq"><datalist id="rterms">${D.searchTerms.map((t) => `<option value="${t}">`).join("")}</datalist></div></form>
            <div class="chips-row"><button type="button" class="chip filters-btn" data-act="f-open-sheet" data-fbtn></button><button type="button" class="chip chip-fe" data-act="f-iron" data-fe-chip aria-pressed="${R.iron}">${icon("fe", "icon icon-sm")}Fuente de hierro</button><div class="chip-group" data-chips aria-label="Filtros activos"></div></div>
            <div class="res-bar"><p class="res-count" data-count aria-live="polite"></p>
              <div class="res-ctl"><label for="rsort" class="sr-only">Ordenar por</label><select id="rsort" data-chg="rsort"><option value="distance" ${R.sort === "distance" ? "selected" : ""}>Por distancia</option><option value="price" ${R.sort === "price" ? "selected" : ""}>Por precio</option></select>
                <div class="segmented" role="group" aria-label="Vista de resultados"><button type="button" data-act="view" data-v="map" aria-pressed="${S.view === "map"}">${icon("map", "icon icon-sm")}Mapa</button><button type="button" data-act="view" data-v="list" aria-pressed="${S.view === "list"}">${icon("list", "icon icon-sm")}Lista</button></div></div></div>
            ${off ? `<p class="hint">Sin conexión: mostramos los últimos resultados guardados.</p>` : ""}
            <div class="cmp-bar" data-cmp-bar></div>
            <div class="results" data-results aria-busy="false" data-view="${S.view}"></div>
          </div></div>`,
        mount: () => { paintFilters(); paint(true); paintCmp(); }
      };
    }
  });
  NM.inp.rq = (el) => { clearTimeout(R.qt); R.qt = setTimeout(() => { R.q = el.value.trim(); paint(); }, 350); };
  NM.form.rsearch = () => { R.q = $("#rq").value.trim(); paint(); };
  NM.chg.rsort = (el) => { R.sort = el.value; paint(true); };
  NM.chg["f-type"] = (el) => { if (el.checked) R.types.add(el.value); else R.types.delete(el.value); if (!R.types.size) TYPES.forEach((t) => R.types.add(t)); changed(); };
  NM.act["f-price"] = (el) => { R.touched = true; R.price = el.dataset.v === "" ? null : Number(el.dataset.v); changed(); };
  NM.act["f-dist"] = (el) => { R.distance = Number(el.dataset.v); changed(); };
  NM.act["f-iron"] = () => { R.iron = !R.iron; changed(); };
  NM.act["f-open"] = () => { R.open = !R.open; changed(); };
  NM.act["f-reset"] = () => { NM.resetRadar(); const q = $("#rq"); if (q) q.value = ""; changed(true); NM.announce("Filtros restablecidos."); };
  NM.act.widen = (el) => { R.distance = Number(el.dataset.v); changed(); };
  NM.act["try-term"] = (el) => { R.q = el.dataset.v; $("#rq").value = R.q; paint(true); };
  NM.act["f-rm"] = (el) => {
    const k = el.dataset.v;
    if (k === "price") R.price = null; else if (k === "dist") R.distance = S.loc.radius; else if (k === "iron") R.iron = false; else if (k === "open") R.open = false;
    else if (k === "q") { R.q = ""; $("#rq").value = ""; } else if (k.startsWith("type:")) { R.types.delete(k.slice(5)); if (!R.types.size) TYPES.forEach((t) => R.types.add(t)); }
    changed(true); $("#rq").focus();
  };
  NM.act["f-open-sheet"] = () => {
    NM.dialog({ title: "Filtros", focus: ".chip", body: `<div class="filters-host"></div><div class="btn-row"><button type="button" class="btn btn-secondary" data-act="f-reset" style="flex:1">Restablecer</button><button type="button" class="btn btn-primary" data-act="dlg-close" data-sheet-count style="flex:1.2"></button></div>` });
    paintFilters();
  };
  NM.act.view = (el) => { S.view = el.dataset.v; NM.save("view"); $$("[data-act=view]").forEach((b) => b.setAttribute("aria-pressed", String(b === el))); const r = $("[data-results]"); if (r) r.dataset.view = S.view; };
  NM.act.zoom = (el) => { R.zoom = Math.min(1.6, Math.max(1, R.zoom + (el.dataset.v === "in" ? 0.2 : -0.2))); $$(".res-map .map-canvas").forEach((c) => { c.style.transform = `scale(${R.zoom})`; }); NM.announce(`Zoom al ${Math.round(R.zoom * 100)} %`); };
  NM.act.pin = (el) => { R.sel = R.sel === el.dataset.id ? null : el.dataset.id; paint(true); const b = $(`.pin[data-id="${R.sel}"]`); if (b) b.focus(); };

  /* Favoritos · US09 */
  NM.act.fav = (el) => {
    const id = el.dataset.id, name = el.dataset.name || (NM.placeById(id) || {}).name || "", on = !S.favs.includes(id);
    NM.setFav(id, on, name);
    if (on) NM.announce(`${name} guardado en favoritos.`);
    else NM.snack(`Quitaste «${name}» de favoritos.`, { onAction: () => { NM.setFav(id, true, name); NM.announce(`${name} volvió a tus favoritos.`); } });
  };
  NM.setFav = (id, on, name) => {
    S.favs = S.favs.filter((x) => x !== id); if (on) S.favs.push(id); NM.save("favs");
    if (/^\/perfil/.test(NM.cur().path)) { NM.refresh(); return; }
    $$(`[data-act=fav][data-id="${id}"]`).forEach((x) => { x.setAttribute("aria-pressed", String(on)); x.setAttribute("aria-label", `${on ? "Quitar de favoritos" : "Guardar en favoritos"}: ${name}`); const u = x.querySelector("use"); if (u) u.setAttribute("href", on ? "#i-starf" : "#i-star"); const t = x.querySelector(".fav-text"); if (t) t.textContent = on ? "Guardado en favoritos" : "Guardar en favoritos"; });
  };

  /* Comparar hasta 3 locales · US27 */
  const paintCmp = () => {
    const bar = $("[data-cmp-bar]"); if (!bar) return;
    const n = S.compare.length;
    bar.hidden = !n;
    bar.innerHTML = n ? `<p aria-live="polite">${n} de 3 locales para comparar${n < 2 ? " · elige al menos 2" : ""}</p><div class="btn-row"><button type="button" class="btn-link" data-act="cmp-clear">Limpiar</button><a class="btn btn-primary btn-compact${n < 2 ? " is-disabled" : ""}" ${n < 2 ? 'aria-disabled="true" tabindex="-1"' : 'href="#/comparar"'}>Comparar</a></div>` : "";
  };
  NM.act.cmp = (el) => {
    const id = el.dataset.id;
    if (S.compare.includes(id)) S.compare = S.compare.filter((x) => x !== id);
    else if (S.compare.length >= 3) { R.rejected = el.dataset.name; NM.snack("Puedes comparar hasta 3 locales a la vez. Quita uno para agregar otro."); return; }
    else S.compare.push(id);
    NM.save("compare");
    $$(`[data-act=cmp][data-id="${id}"]`).forEach((b) => b.setAttribute("aria-pressed", String(S.compare.includes(id))));
    paintCmp();
  };
  NM.act["cmp-clear"] = () => { S.compare = []; NM.save("compare"); $$("[data-act=cmp]").forEach((b) => b.setAttribute("aria-pressed", "false")); paintCmp(); };

  NM.route("/comparar", { view: () => {
    const ps = S.compare.map(NM.placeById).filter(Boolean);
    const rej = R.rejected; R.rejected = null;
    const rows = [["Precio", (p) => `<strong>${esc(NM.priceLabel(p))}</strong>`], ["Distancia", (p) => `${distLabel(p.distance)} · ${p.walk} min a pie`], ["Horario", (p) => esc(p.hours)], ["Estado", (p) => (p.open ? "Abierto" : "Cerrado")],
      ["Etiquetas", (p) => (NM.placeIron(p) ? NM.ironBadge() : "Sin etiquetas")], ["Actualizado", (p) => esc(NM.fmtWhen(p.updatedAt))]];
    return { title: "Comparar", heading: "Comparar", sub: `${ps.length} de 3 locales`, back: "/radar", wide: true,
      html: ps.length < 2 ? `<div class="empty-state">${icon("list", "icon icon-lg")}<h3>Elige al menos 2 locales</h3><p class="muted">Marca «Comparar» en las tarjetas del radar para verlos lado a lado.</p><a class="btn btn-primary btn-compact" href="#/radar">Volver al radar</a></div>`
        : `${rej ? NM.alert("warning", "Máximo 3 locales", `No se agregó «${esc(rej)}». Quita uno para comparar otro.`) : ps.length === 3 ? NM.alert("info", "", "Puedes comparar hasta 3 locales a la vez.") : ""}
        <div class="table-wrap"><table class="cmp-table"><caption class="sr-only">Comparación de ${ps.length} locales</caption><thead><tr><td></td>${ps.map((p) => `<th scope="col">${esc(p.name)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(([l, f]) => `<tr><th scope="row">${l}</th>${ps.map((p) => `<td>${f(p)}</td>`).join("")}</tr>`).join("")}
        <tr><th scope="row">Acciones</th>${ps.map((p) => `<td><a href="#/local/${p.id}">Ver ficha<span class="sr-only"> de ${esc(p.name)}</span></a> · <button type="button" class="btn-link" data-act="cmp-rm" data-id="${p.id}" data-name="${esc(p.name)}">Quitar<span class="sr-only"> ${esc(p.name)}</span></button></td>`).join("")}</tr></tbody></table></div>` };
  } });
  NM.act["cmp-rm"] = (el) => { S.compare = S.compare.filter((x) => x !== el.dataset.id); NM.save("compare"); NM.refresh(); };

  /* ---------- Ficha del local · US15, US09, US16, US19 ---------- */
  NM.route("/local/:id", { view: ({ params }) => {
    const p = NM.placeById(params.id);
    if (!p || (!p.published && p.owner !== S.session)) return { redirect: "/radar" };
    const on = S.favs.includes(p.id);
    return { title: p.name, heading: p.name, sub: "Ficha del local", back: "/radar",
      actions: [NM.favBtn(p.id, p.name)],
      html: `<div class="two-col"><div class="stack">${NM.placePhoto(p)}
        <div class="tags">${NM.placeBadges(p)}</div><p class="muted">${esc(NM.typeLabel(p.type))} · ${esc(p.address)} · ${esc(p.hours)}</p>
        <div class="stats"><div class="stat"><strong>${esc(NM.priceLabel(p))}</strong><span>${p.type === "mercado" ? "insumos" : "menú"}</span></div>
          <div class="stat"><strong>${distLabel(p.distance)}</strong><span>${p.walk} min a pie</span></div>
          <div class="stat"><strong>${p.noMenuToday ? "Sin menú" : p.stock === "pocas" ? "Pocas" : p.stock === "agotado" ? "Agotado" : "Hay"}</strong><span>${p.noMenuToday ? "hoy" : "porciones"}</span></div></div>
        ${p.noMenuToday ? NM.alert("warning", "El menú de hoy no está disponible", `Este comercio todavía no publicó su oferta de hoy. Última actualización: ${esc(NM.fmtWhen(p.updatedAt))}.`)
          : `<h2 class="h3">${p.type === "mercado" ? "Insumos destacados" : "Menú de hoy"}</h2><ul class="menu-today card">${p.menu.map((m) => `<li><span><small>${esc(m.course)}</small>${esc(m.dish)}</span><span class="tags">${NM.dishTag(m)}</span></li>`).join("")}</ul>
          <p class="hint">Etiquetas orientativas revisadas por nutricionistas. No reemplazan una consulta profesional.</p>`}</div>
        <div class="stack side"><p class="muted">${icon("clock", "icon icon-sm")} Precio actualizado por el comercio: ${esc(NM.fmtWhen(p.updatedAt)).replace(/\.?$/, ".")} Datos de ejemplo.</p>
          <a class="btn btn-primary btn-block" href="#/local/${p.id}/ruta">${icon("walk", "icon icon-sm")}Cómo llegar</a>
          <button class="btn btn-secondary btn-block" type="button" data-act="add-plan" data-id="${p.id}">${icon("plus", "icon icon-sm")}Añadir a mi plan</button>
          <button class="btn btn-secondary btn-block" type="button" data-act="fav" data-id="${p.id}" data-name="${esc(p.name)}" aria-pressed="${on}">${icon(on ? "starf" : "star", "icon icon-sm")}<span class="fav-text">${on ? "Guardado en favoritos" : "Guardar en favoritos"}</span></button>
          <a class="btn btn-secondary btn-block" href="#/local/${p.id}/reportar">${icon("flag", "icon icon-sm")}Reportar un dato</a></div></div>`,
      mount: () => { const k = "v:" + p.id; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, "1"); p.stats.visits++; NM.save("places"); } }
    };
  } });

  NM.route("/local/:id/ruta", { view: ({ params }) => {
    const p = NM.placeById(params.id); if (!p) return { redirect: "/radar" };
    const from = S.loc.mode === "gps" ? "tu ubicación actual" : NM.campus(S.loc.campus).name;
    return { title: "Cómo llegar", heading: "Cómo llegar", sub: esc(p.name), back: "/local/" + p.id,
      html: `<div class="two-col"><div class="stack">${NM.mapHtml({ pins: [{ id: p.id, x: p.x, y: p.y, label: p.name, name: p.name, distance: p.distance, sel: true }], route: `50,56 ${p.x},56 ${p.x},${p.y}`, h: 280 })}
        <p class="hint">El mapa es una vista de ejemplo. Las indicaciones en texto tienen la misma información.</p></div>
        <div class="stack"><div class="card"><p class="big">${p.walk} min a pie · ${distLabel(p.distance)}</p><p class="muted">Llegas antes del cierre: ${esc(p.hours).replace(/\.?$/, ".")}</p></div>
          ${NM.alert("info", "", `Punto de partida: ${S.loc.mode === "gps" ? "tu ubicación actual" : `campus ${esc(from)} (ubicación elegida)`}. <a href="#/ubicacion?next=/local/${p.id}/ruta">Cambiar</a>`, "pin")}
          <ol class="steps-list card"><li>Sal por la puerta principal de ${esc(from)}.</li><li>Camina hacia ${esc(p.address)}.</li><li>El local está a ${p.walk} minutos; revisa el horario antes de salir.</li></ol>
          <a class="btn btn-secondary btn-block" href="#/local/${p.id}">Volver a la ficha</a></div></div>`,
      mount: () => { const k = "r:" + p.id; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, "1"); p.stats.routes++; NM.save("places"); } }
    };
  } });

  NM.route("/local/:id/reportar", { view: ({ params }) => {
    const p = NM.placeById(params.id); if (!p) return { redirect: "/radar" };
    return { title: "Reportar un dato", heading: "Reportar un dato", sub: esc(p.name), back: "/local/" + p.id,
      html: `<form class="narrow stack" data-form="report" data-id="${p.id}" novalidate><p class="muted">Cuéntanos qué dato no coincide. El comercio recibirá tu reporte para revisarlo.</p>
        <fieldset class="field"><legend>¿Qué dato no coincide? <span class="req" aria-hidden="true">*</span></legend><div class="radio-list">${Object.entries(NM.REPORT_TYPES).map(([v, l], i) => `<label class="radio"><input type="radio" name="rtype" value="${v}" data-chg="rtype" ${i === 0 ? "checked" : ""}><span>${l}</span></label>`).join("")}</div></fieldset>
        ${NM.field({ id: "rep-value", label: "Precio que viste (S/)", req: true, inputmode: "decimal", help: "Solo números, por ejemplo 12 o 12.50." })}
        ${NM.field({ id: "rep-note", label: "Comentario (opcional)", type: "textarea", max: 200, help: "Máximo 200 caracteres" })}
        <button class="btn btn-primary btn-block" type="submit">Enviar reporte</button></form>`
    };
  } });
  NM.chg.rtype = (el) => {
    const price = el.value === "precio", inp = $("#rep-value");
    $('label[for="rep-value"]').innerHTML = (price ? "Precio que viste (S/)" : "¿Qué viste?") + ' <span class="req" aria-hidden="true">*</span>';
    $("#rep-value-help").textContent = price ? "Solo números, por ejemplo 12 o 12.50." : { horario: "Ej.: cierran a las 3:00 p. m.", disponibilidad: "Ej.: ya no había lentejas a la 1:00 p. m.", ubicacion: "Ej.: el local está a media cuadra, frente al parque." }[el.value];
    inp.inputMode = price ? "decimal" : "text"; NM.clr(inp);
  };
  NM.form.report = (f) => {
    const inp = $("#rep-value"), type = $('input[name="rtype"]:checked', f).value, v = inp.value.trim();
    NM.clr(inp);
    if (!v) NM.err(inp, type === "precio" ? "Escribe el precio que viste, por ejemplo 12." : "Escribe qué dato viste.");
    else if (type === "precio" && Number.isNaN(NM.parseAmount(v))) NM.err(inp, "Escribe solo números, por ejemplo 12.");
    if (NM.firstInvalid(f)) return;
    const p = NM.placeById(f.dataset.id), note = $("#rep-note").value.trim();
    S.reports.unshift({ id: NM.uid(), placeId: p.id, type, value: type === "precio" ? money(NM.parseAmount(v)) : v, note, at: Date.now(), status: "nuevo" }); NM.save("reports");
    NM.snack(`Gracias. Enviamos tu reporte de ${NM.REPORT_TYPES[type].toLowerCase()} a ${p.name}; el comercio lo recibirá para revisarlo.`, { duration: 8000 });
    NM.go("/local/" + p.id);
  };
})();
