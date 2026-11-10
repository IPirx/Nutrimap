/* NutriMap Estudiantil · modelo compartido: locales, plan, lista de compras, gasto, etiquetas y artículos */
(function () {
  "use strict";
  const NM = window.NM, S = NM.S, D = window.NM_DATA;
  const { esc, money, money2, norm, distLabel, icon } = NM;

  /* ---------- Locales ---------- */
  NM.campus = (id) => D.campuses.find((c) => c.id === id) || D.campuses[0];
  NM.placeById = (id) => S.places.find((p) => p.id === id);
  NM.myPlace = () => S.places.find((p) => p.owner && p.owner === S.session);
  NM.priceLabel = (p) => (p.type === "mercado" ? "Desde " : "") + money(p.price);
  NM.typeLabel = (t) => D.offerTypes[t];
  /* US33 CA02: la etiqueta solo se muestra cuando un revisor la aprobó */
  NM.placeIron = (p) => p.menu.some((d) => d.ironStatus === "aprobada");
  NM.loc = () => (S.loc.mode === "gps" ? "tu ubicación actual" : NM.campus(S.loc.campus).name);
  NM.calcDist = (x, y) => {
    const dx = x - 50, dy = y - 56;
    const distance = Math.max(80, Math.round((Math.sqrt(dx * dx + dy * dy) * 28) / 10) * 10);
    return { distance, walk: Math.max(1, Math.round(distance / 75)) };
  };
  NM.updLabel = (p) => "Actualizado " + NM.fmtWhen(p.updatedAt);
  /* Hierro: color propio (no verde ni rojo de error) y siempre con su gota, para no depender solo del color */
  NM.ironBadge = (txt = "Fuente de hierro") => `<span class="badge badge-fe">${icon("fe", "icon icon-xs")}${esc(txt)}</span>`;
  /* Ícono según el tipo de local: menú, cafetería o puesto de mercado */
  NM.typeIcon = (t) => ({ mercado: "store", cafeteria: "cup" }[t] || "bowl");
  NM.placeBadges = (p) => [
    NM.placeIron(p) ? NM.ironBadge() : "",
    p.published ? (p.open ? NM.badge("Abierto", "success", true) : NM.badge("Cerrado", "error", true)) : NM.badge("Aún no publicado", "", false),
    p.closesSoon && p.open ? NM.badge("Cierra pronto", "warning") : "",
    p.stock === "pocas" ? NM.badge("Pocas porciones", "warning") : "",
    p.stock === "agotado" ? NM.badge("Agotado", "error") : "",
    p.noMenuToday ? NM.badge("Sin menú de hoy", "warning") : ""
  ].join("");
  NM.dishTag = (d) => [
    d.ironStatus === "aprobada" ? NM.ironBadge() : "",
    d.tag ? NM.badge(d.tag, "success") : "",
    d.avail === "agotado" ? NM.badge("Agotado", "error") : d.avail === "pocas" ? NM.badge("Pocas porciones", "warning") : ""
  ].join("");
  NM.placePhoto = (p) => {
    const kind = p.type === "mercado" ? "un puesto de mercado" : p.type === "cafeteria" ? "una cafetería" : "un restaurante de menú";
    const awn = p.type === "mercado" ? "#9A3E06" : p.type === "cafeteria" ? "#1E4E8C" : "#1B5E20";
    const label = `Foto referencial de ${p.name}: fachada de ${kind} con toldo y la pizarra del día.`;
    return `<figure class="place-photo"><svg viewBox="0 0 320 120" role="img" aria-label="${esc(label)}"><rect width="320" height="120" fill="#E3EBE5"/>
      <rect x="40" y="30" width="240" height="90" fill="#FFFFFF" stroke="#DDE4E0"/><path d="M30 30h260l-14 22H44z" fill="${awn}"/>
      <path d="M44 52h232" stroke="#fff" stroke-dasharray="14 10" stroke-width="3"/><rect x="62" y="66" width="60" height="54" fill="#D5DED8"/>
      <rect x="150" y="66" width="56" height="38" rx="4" fill="#1F2A24"/><path d="M158 78h40M158 88h28" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <rect x="222" y="66" width="40" height="30" fill="#CBE2D0"/></svg><figcaption>Foto referencial · datos de ejemplo</figcaption></figure>`;
  };

  /* ---------- Mapa de ejemplo (alternativa en lista: 4.1.5) ---------- */
  NM.mapHtml = (o) => {
    const pins = (o.pins || []).map((p) => `<button type="button" class="pin${p.iron ? " is-iron" : ""}${p.sel ? " is-sel" : ""}" style="left:${p.x}%;top:${p.y}%" data-act="pin" data-id="${p.id}"
      aria-pressed="${!!p.sel}" aria-label="${esc(p.name)}, ${esc(p.label)}, a ${distLabel(p.distance)}${p.iron ? ", con fuente de hierro revisada" : ""}">${p.iron ? icon("fe", "icon icon-xs") : ""}${esc(p.label)}</button>`).join("");
    const biz = o.biz ? `<span class="biz-pin" style="left:${o.biz.x}%;top:${o.biz.y}%">${esc(o.biz.label || "Tu negocio")}</span>` : "";
    const you = o.you === false ? "" : `<span class="map-you" aria-hidden="true"><span>Tú</span></span>`;
    const route = o.route ? `<svg class="map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${o.route}" fill="none" stroke="#1E4E8C" stroke-width="1.6" stroke-linejoin="round" stroke-dasharray="3 2"/></svg>` : "";
    return `<div class="map${o.cls ? " " + o.cls : ""}" style="${o.h ? `height:${o.h}px` : ""}"><div class="map-canvas" style="transform:scale(${o.zoom || 1})"><span class="map-campus" aria-hidden="true">Campus</span>${route}${you}${pins}${biz}</div>${o.zoomBtns ? `<div class="map-zoom" role="group" aria-label="Zoom del mapa">
      <button type="button" class="icon-btn" data-act="zoom" data-v="in" aria-label="Acercar">${icon("plus")}</button><button type="button" class="icon-btn" data-act="zoom" data-v="out" aria-label="Alejar">${icon("minus")}</button></div>` : ""}</div>`;
  };

  /* ---------- Sugerencias de búsqueda (US18) ---------- */
  const lev = (a, b) => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  };
  NM.suggest = (q) => { const n = norm(q); let best = null, bd = 3; D.searchTerms.forEach((t) => { const d = lev(n, norm(t)); if (d > 0 && d < bd) { best = t; bd = d; } }); return best; };

  /* ---------- Plan semanal (US03, US20, US25) ---------- */
  NM.slots = D.slots;
  NM.ALL = D.slots.map((s) => s.id);
  NM.mealById = (id) => D.meals.find((m) => m.id === id) || S.custom[id] || null;
  NM.bySlot = (slot) => D.meals.filter((m) => m.slot === slot).sort((a, b) => a.cost - b.cost);
  NM.planTotal = (p = S.plan) => (p ? p.reduce((s, day) => s + NM.slots.reduce((t, sl) => t + (day[sl.id] ? NM.mealById(day[sl.id]).cost : 0), 0), 0) : 0);
  NM.dayCost = (p, i) => NM.slots.reduce((t, sl) => t + (p[i][sl.id] ? NM.mealById(p[i][sl.id]).cost : 0), 0);
  NM.minCost = (ids = NM.ALL) => ids.reduce((s, id) => s + NM.bySlot(id)[0].cost, 0) * 7;
  NM.generatePlan = (budget, ids = NM.ALL, shift = 0) => {
    const p = D.days.map((d) => { const day = {}; NM.slots.forEach((sl) => { if (!ids.includes(sl.id)) { day[sl.id] = null; return; } const o = NM.bySlot(sl.id); day[sl.id] = o[(d.id * 2 + sl.id.length + shift) % o.length].id; }); return day; });
    const target = Math.max(NM.minCost(ids), budget * 0.9);
    let guard = 0;
    while (NM.planTotal(p) > target && guard++ < 200) {
      let worst = null;
      p.forEach((day, di) => ids.forEach((slot) => { const m = NM.mealById(day[slot]); const ch = NM.bySlot(slot)[0]; if (m.cost > ch.cost && (!worst || m.cost > worst.cost)) worst = { di, slot, cost: m.cost }; }));
      if (!worst) break;
      const o = NM.bySlot(worst.slot); const idx = o.findIndex((x) => x.id === p[worst.di][worst.slot]);
      p[worst.di][worst.slot] = o[Math.max(0, idx - 1)].id;
    }
    return p;
  };
  NM.archivePlan = () => {
    if (!S.plan) return;
    S.history.unshift({ weekStart: S.planWeek, plan: S.plan, budget: S.prefs.budget, cost: NM.planTotal(), meals: S.plan.reduce((n, d) => n + NM.slots.filter((s) => d[s.id]).length, 0) });
    S.history = S.history.slice(0, 8); NM.save("history");
  };
  /* US25: al cambiar la semana el plan anterior pasa al historial (últimas 8 semanas) */
  NM.ensureWeek = () => {
    if (S.plan && S.planWeek && S.planWeek + 7 * 864e5 <= Date.now()) { NM.archivePlan(); S.plan = null; S.planWeek = null; S.checked = {}; S.extras = []; S.removed = []; NM.save("plan", "planWeek", "checked", "extras", "removed"); }
    if (!S.seen.hist) {
      const w = NM.weekStart();
      [1, 2].forEach((k, i) => { const plan = NM.generatePlan(90, NM.ALL, k * 3); S.history.push({ weekStart: w - k * 7 * 864e5, plan, budget: 90, cost: NM.planTotal(plan) + (i ? 9 : 5), meals: 21 }); });
      S.seen.hist = true; NM.save("history", "seen");
    }
  };

  /* ---------- Lista de compras (US04, US22, US23) ---------- */
  NM.shopping = () => {
    const map = new Map();
    if (S.plan) S.plan.forEach((day) => NM.slots.forEach((sl) => {
      const m = day[sl.id] ? NM.mealById(day[sl.id]) : null;
      if (!m || !m.ingredients) return;
      m.ingredients.forEach(([name, cat, qty, unit, cost]) => { const it = map.get(name) || { name, cat, qty: 0, unit, cost: 0 }; it.qty += qty; it.cost += cost; map.set(name, it); });
    }));
    const items = Array.from(map.values()).filter((it) => !S.removed.includes(it.name));
    S.extras.forEach((x) => items.push({ name: x, cat: "Añadidos por ti", qty: null, unit: "", cost: 0, extra: true }));
    return items;
  };
  NM.qty = (it) => {
    if (it.qty === null) return "";
    if (it.unit === "g" && it.qty >= 1000) return (it.qty / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 }) + " kg";
    if (it.unit === "ml" && it.qty >= 1000) return (it.qty / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 }) + " l";
    return it.qty + " " + it.unit;
  };
  NM.itemLabel = (it) => S.renames[it.name] || it.name + (NM.qty(it) ? " " + NM.qty(it) : "");
  NM.shareText = () => {
    const items = NM.shopping().filter((i) => !S.checked[i.name]);
    const blocks = D.categories.concat("Añadidos por ti").map((cat) => { const g = items.filter((i) => i.cat === cat); return g.length ? cat + ":\n" + g.map((i) => "- " + NM.itemLabel(i)).join("\n") : ""; }).filter(Boolean);
    return { n: items.length, text: "Lista de compras NutriMap\n\n" + blocks.join("\n\n") };
  };

  /* ---------- Gasto de la semana (US26) ---------- */
  NM.weekSpend = () => { const a = NM.weekStart(), b = a + 7 * 864e5; return S.spend.filter((g) => g.at >= a && g.at < b); };
  NM.spendTotal = () => NM.weekSpend().reduce((s, g) => s + g.amount, 0);
  NM.spendPct = () => Math.round((NM.spendTotal() / S.prefs.budget) * 100);

  /* ---------- Reportes, etiquetas y artículos ---------- */
  NM.myReports = (status) => { const mine = S.places.filter((p) => p.owner === S.session).map((p) => p.id); return S.reports.filter((r) => mine.includes(r.placeId) && (!status || (status === "nuevo" ? r.status === "nuevo" : r.status !== "nuevo"))); };
  NM.newReports = () => (NM.role() === "com" ? NM.myReports("nuevo").length : 0);
  NM.labels = (status) => { const out = []; S.places.forEach((p) => p.menu.forEach((d, i) => { if (d.ironStatus && (!status || d.ironStatus === status)) out.push({ id: p.id + ":" + i, place: p, dish: d, idx: i }); })); return out; };
  NM.labelById = (id) => { const [pid, i] = id.split(":"); const p = NM.placeById(pid); return p && p.menu[+i] ? { id, place: p, dish: p.menu[+i], idx: +i } : null; };
  NM.article = (id) => S.articles.find((a) => a.id === id);
  NM.artStatus = (a) => ({ borrador: "Borrador", revision: "En revisión", publicado: "Publicado" }[a.status]);
  NM.addHist = (a, author, type, text) => { a.history.push({ ts: Date.now(), author, type, text }); };
  NM.REPORT_TYPES = { precio: "Precio", horario: "Horario", disponibilidad: "Disponibilidad", ubicacion: "Ubicación" };
  NM.initials = (s) => (s || "?")[0].toUpperCase();
})();
