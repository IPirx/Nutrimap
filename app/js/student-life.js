/* NutriMap Estudiantil · estudiante: inicio, plan, lista, gasto, historial, recordatorios, Aprende y perfil
   US03 US04 US05 US09 US10 US14 US20 US21 US22 US23 US24 US25 US26 US48 */
(function () {
  "use strict";
  const NM = window.NM, S = NM.S, D = window.NM_DATA, R = NM.R;
  const { $, $$, esc, money, money2, distLabel, icon } = NM;
  const DAYS = D.days;
  const dayIdx = () => (NM.planDay == null ? NM.todayIdx() : NM.planDay);
  const sub = (txt) => `${esc(txt)}`;

  /* ---------- Inicio · US26 ---------- */
  NM.route("/inicio", { view: ({ user }) => {
    NM.ensureWeek();
    const pct = NM.spendPct(), t = NM.spendTotal(), today = S.plan ? S.plan[NM.todayIdx()] : null;
    const big = (ic, t1, s1, href) => `<a class="card big-action" href="#${href}"><span class="big-ic">${icon(ic)}</span><strong>${t1}</strong><span class="muted">${s1}</span></a>`;
    return { title: "Inicio", heading: user ? `Hola, ${esc((user.name || "").split(" ")[0])}` : "Hola", sub: `Ubicación: ${esc(NM.loc())} · radio ${distLabel(S.loc.radius)}`, wide: true,
      html: `<div class="grid-2"><div class="stack">
        <div class="row-2">${big("radar", "Encontrar cerca", "Menús e insumos con precio y distancia", "/radar")}${big("plan", "Planificar mi semana", "Comidas y lista de compras", "/plan")}</div>
        <section class="card stack" aria-labelledby="hoy-t"><div class="row-between"><h2 class="h3" id="hoy-t">Tu plan de hoy · ${DAYS[NM.todayIdx()].long}</h2><a href="#/plan">Ver plan</a></div>
          ${today ? NM.slots.map((sl) => { const m = today[sl.id] ? NM.mealById(today[sl.id]) : null; return m ? `<div><p class="muted small">${sl.label}${m.iron ? " " + NM.ironBadge() : ""}</p><p><strong>${esc(m.name)} · ${money(m.cost)}</strong></p></div>` : ""; }).join("") : `<p class="muted">Aún no tienes un plan para esta semana.</p><a class="btn btn-secondary btn-compact" href="#/plan">Generar mi plan</a>`}</section></div>
        <div class="stack"><section class="card stack" aria-labelledby="gasto-t"><div class="row-between"><h2 class="h3" id="gasto-t">Gasto de la semana</h2><a href="#/gasto">Registrar gasto</a></div>
          ${NM.prog(pct, "Gasto frente al presupuesto semanal", pct > 100)}<p>Gastado: <strong>${money2(t)} de ${money2(S.prefs.budget)} (${pct} %)</strong></p>${S.spend.some((x) => /^g[1-4]$/.test(x.id)) ? `<p class="hint">Datos de ejemplo: registra tu gasto para reemplazarlos.</p>` : ""}
          ${pct >= 80 ? NM.alert("warning", "Superaste el 80 % de tu presupuesto", `Te quedan ${money2(Math.max(0, S.prefs.budget - t))} hasta el domingo.`) : ""}</section>
          ${NM.alert("info", "¿Sabías que?", `La vitamina C del limón ayuda a aprovechar el hierro de las menestras. <a href="#/aprende">Leer más en Aprende ›</a>`)}</div></div>`
    };
  } });

  /* ---------- Plan semanal · US03, US14, US20, US25 ---------- */
  const planBlock = () => {
    const p = S.plan, total = NM.planTotal(), over = total > S.prefs.budget, d = dayIdx(), day = p[d];
    const meal = (sl) => {
      const m = day[sl.id] ? NM.mealById(day[sl.id]) : null;
      if (!m) return `<div class="card meal meal-empty"><div class="row-between"><span class="muted small">${sl.label}</span><span class="muted small">Sin comida</span></div><button type="button" class="btn-link" data-act="replace" data-v="${sl.id}">${icon("plus", "icon icon-sm")}Añadir ${sl.label.toLowerCase()}</button></div>`;
      const where = m.kind === "local" ? `En local · ${esc(m.name)}` : `Receta · ${m.time} min`;
      return `<div class="card meal"><div class="row-between"><span class="muted small">${sl.label}</span><strong>${money(m.cost)}</strong></div><p class="meal-name">${m.kind === "receta" ? `<a href="#/receta/${m.id}">${esc(m.name)}</a>` : esc(m.name)}</p>
        <div class="tags">${NM.badge(where)}${m.iron ? NM.ironBadge() : ""}</div>
        <div class="meal-actions"><button type="button" class="btn-link" data-act="replace" data-v="${sl.id}">${icon("swap", "icon icon-sm")}Reemplazar<span class="sr-only"> ${sl.label.toLowerCase()}</span></button>
        <button type="button" class="btn-link" data-act="remove" data-v="${sl.id}">${icon("close", "icon icon-sm")}Quitar<span class="sr-only"> ${sl.label.toLowerCase()}</span></button></div></div>`;
    };
    const wk = S.planWeek || NM.weekStart();
    return `<div class="plan-layout"><div class="plan-main stack">
      <div class="row-between wrap"><p class="muted">Semana planificada: <strong>${money2(total)} de ${money2(S.prefs.budget)}</strong></p>${over ? NM.badge("Supera el presupuesto en " + money2(total - S.prefs.budget), "error") : NM.badge("Dentro del presupuesto", "success")}</div>
      ${NM.prog(Math.round((total / S.prefs.budget) * 100), "Costo planificado frente al presupuesto", over)}
      ${weekGrid(wk, d)}
      <div class="day-chips" role="group" aria-label="Día de la semana">${DAYS.map((x) => { const dt = new Date(wk + x.id * 864e5).getDate(); return `<button type="button" class="chip day" data-act="plan-day" data-v="${x.id}" aria-pressed="${x.id === d}" aria-label="${x.long} ${dt}${x.id === NM.todayIdx() ? ", hoy" : ""}"><span>${"LMXJVSD"[x.id]}</span><strong>${dt}</strong></button>`; }).join("")}</div>
      <h2 class="h3 day-title">${DAYS[d].long}${d === NM.todayIdx() ? " · hoy" : ""}</h2>
      <div class="meals">${NM.slots.map(meal).join("")}</div>
      <p class="plan-links-mobile row-between wrap"><a href="#/lista">Lista de compras ›</a><a href="#/historial">Historial de planes ›</a></p></div>
      ${shopAside()}</div>`;
  };
  /* Escritorio (W03): la semana completa de un vistazo. Cada columna es un día y lleva a su detalle. */
  const weekGrid = (wk, d) => `<div class="week-grid" role="group" aria-label="Semana completa"><div class="wg-corner" aria-hidden="true"></div>
    ${DAYS.map((x) => { const dt = new Date(wk + x.id * 864e5).getDate(); return `<button type="button" class="wg-day" data-act="plan-day" data-v="${x.id}" aria-pressed="${x.id === d}">${x.long.slice(0, 3)} ${dt}${x.id === NM.todayIdx() ? "<small>hoy</small>" : ""}</button>`; }).join("")}
    ${NM.slots.map((sl) => `<div class="wg-slot">${sl.label}</div>${DAYS.map((x) => { const id = S.plan[x.id][sl.id], m = id ? NM.mealById(id) : null;
      return `<div class="wg-cell${x.id === d ? " on" : ""}${m ? "" : " empty"}">${m ? `<span class="wg-name">${esc(m.name)}</span><span class="wg-meta">${money(m.cost)}${m.iron ? ` · <span class="wg-iron">hierro</span>` : ""}</span>` : `<span class="muted small">—</span>`}</div>`; }).join("")}`).join("")}</div>`;
  /* Escritorio (W03): resumen de la lista de compras al costado del plan */
  const shopAside = () => {
    const items = NM.shopping(), left = items.filter((i) => !S.checked[i.name]), done = items.length - left.length;
    return `<aside class="plan-aside stack"><section class="card stack" aria-labelledby="pa-shop"><div class="row-between"><h2 class="h3" id="pa-shop">Lista de compras</h2><span class="muted small">${done} de ${items.length}</span></div>
      ${items.length ? `${NM.prog(Math.round((done / items.length) * 100), "Productos comprados")}<ul class="pa-list">${left.slice(0, 6).map((i) => `<li><span>${esc(NM.itemLabel(i))}</span>${i.cost ? `<span class="muted">${money2(i.cost)}</span>` : ""}</li>`).join("")}</ul>${left.length > 6 ? `<p class="muted small">y ${left.length - 6} productos más</p>` : ""}` : `<p class="muted">Tu lista se arma con los ingredientes del plan.</p>`}
      <a class="btn btn-secondary btn-block" href="#/lista">Ver lista completa</a></section>
      <nav class="link-list card" aria-label="Más del plan"><a href="#/historial">${icon("history", "icon icon-sm")}<span>Historial de planes</span>${icon("right", "icon icon-sm")}</a></nav></aside>`;
  };
  NM.route("/plan", { view: () => {
    NM.ensureWeek();
    return { title: "Mi plan", heading: "Mi plan", sub: `Semana del ${NM.weekLabel(S.planWeek || NM.weekStart())}`, wide: true,
      actions: [`<button type="button" class="btn btn-secondary btn-compact" data-act="gen-plan">${icon("refresh", "icon icon-sm")}${S.plan ? "Volver a generar" : "Generar plan"}</button>`],
      html: S.plan ? planBlock() : `<div class="empty-state">${icon("plan", "icon-lg icon")}<h2 class="h3">Aún no tienes un plan</h2><p class="muted">NutriMap arma un plan de 7 días con desayuno, almuerzo y cena que respeta tu presupuesto semanal. Escribe cuánto tienes para la semana.</p><form class="narrow stack" data-form="plan-budget" novalidate>${NM.field({ id: "plan-budget", label: "Presupuesto semanal (S/)", type: "text", inputmode: "decimal", value: String(S.prefs.budget), req: true })}<button type="submit" class="btn btn-primary btn-block">Generar plan</button></form><p class="hint"><a href="#/historial">¿Quieres reutilizar un plan anterior? Ver historial</a></p></div>` };
  } });
  NM.act["plan-day"] = (el) => { NM.planDay = Number(el.dataset.v); NM.refresh(); };
  const applyPlan = (budget, ids) => {
    const prev = { plan: S.plan, week: S.planWeek, hist: S.history.slice(), checked: S.checked, removed: S.removed };
    if (S.plan) NM.archivePlan();
    S.prefs.budget = budget; S.plan = NM.generatePlan(budget, ids); S.planWeek = NM.weekStart(); S.checked = {}; S.removed = []; NM.planDay = NM.todayIdx();
    NM.save("plan", "planWeek", "prefs", "checked", "removed"); NM.resetRadar();
    const reduced = ids && ids.length < NM.ALL.length;
    NM.go("/plan");
    setTimeout(() => NM.snack(prev.plan ? "Generamos un plan nuevo con tu presupuesto." : `Tu plan de 7 días${reduced ? " (solo almuerzo y cena)" : ""} cuesta ${money2(NM.planTotal())} y está dentro de tu presupuesto. El radar ya lo usa como filtro.`,
      prev.plan ? { onAction: () => { S.plan = prev.plan; S.planWeek = prev.week; S.history = prev.hist; S.checked = prev.checked; S.removed = prev.removed; NM.save("plan", "planWeek", "history", "checked", "removed"); NM.refresh(); NM.announce("Recuperamos tu plan anterior."); } } : {}), 50);
  };
  NM.form["plan-budget"] = () => {
    const el = $("#plan-budget"); NM.clr(el);
    const v = Number(String(el.value).replace(",", "."));
    if (!(v > 0)) { NM.err(el, "El monto debe ser mayor a cero."); el.focus(); return; }
    S.prefs.budget = v; NM.save("prefs"); NM.resetRadar(); NM.act["gen-plan"]();
  };
  NM.act["gen-plan"] = () => {
    const b = S.prefs.budget;
    if (!(b > 0)) { NM.go("/perfil?t=pref"); return; }
    if (b < NM.minCost()) NM.go("/plan/presupuesto"); else applyPlan(b);
  };
  NM.route("/plan/presupuesto", { view: () => {
    const b = S.prefs.budget, full = NM.minCost(), red = NM.minCost(["almuerzo", "cena"]);
    return { title: "Presupuesto insuficiente", heading: "Mi plan", sub: "Presupuesto insuficiente", back: "/plan",
      html: `<form class="narrow stack" data-form="plan-fix" novalidate>${NM.alert("warning", "", `Con ${money2(b)} por semana no podemos cubrir desayuno, almuerzo y cena todos los días.`)}
        <div class="row-2"><div class="card"><p class="muted small">Tu presupuesto</p><p class="big">${money2(b)}</p></div><div class="card"><p class="muted small">Mínimo estimado</p><p class="big">${money2(full)}</p></div></div>
        <fieldset class="field"><legend>¿Cómo quieres continuar?</legend><div class="radio-list card">
          <label class="radio"><input type="radio" name="fix" value="raise" checked><span>Ajustar el monto a ${money2(full)} <span class="hint">Plan completo de 21 comidas</span></span></label>
          <label class="radio"><input type="radio" name="fix" value="reduce" ${b < red ? "disabled" : ""}><span>Reducir comidas <span class="hint">${b < red ? `Solo almuerzo y cena requiere al menos ${money2(red)}` : `Solo almuerzo y cena · estimado ${money2(red)}`}</span></span></label></div></fieldset>
        <button class="btn btn-primary btn-block" type="submit">Generar plan</button><a class="btn-link center" href="#/perfil?t=pref">Cambiar presupuesto en Preferencias</a></form>` };
  } });
  NM.form["plan-fix"] = (f) => { const v = $('input[name="fix"]:checked', f).value; if (v === "raise") applyPlan(NM.minCost()); else applyPlan(S.prefs.budget, ["almuerzo", "cena"]); };

  /* Quitar con «Deshacer» · Reemplazar dentro del presupuesto · US20 */
  NM.act.remove = (el) => {
    const slot = el.dataset.v, d = dayIdx(), before = S.plan[d][slot], name = NM.mealById(before).name;
    S.plan[d][slot] = null; NM.save("plan"); NM.refresh();
    const nx = $(`[data-act=replace][data-v="${slot}"]`); if (nx) nx.focus();
    NM.snack(`Quitaste «${name}» del ${DAYS[d].long.toLowerCase()}.`, { onAction: () => { S.plan[d][slot] = before; NM.save("plan"); NM.refresh(); NM.announce(`Recuperamos «${name}».`); } });
  };
  const RP = { slot: null, q: "", kinds: { receta: true, local: true } };
  const rpOptions = () => {
    const d = dayIdx(), cur = S.plan[d][RP.slot] ? NM.mealById(S.plan[d][RP.slot]) : null, base = NM.planTotal() - (cur ? cur.cost : 0);
    const all = NM.bySlot(RP.slot).filter((m) => (!cur || m.id !== cur.id) && RP.kinds[m.kind] && (!RP.q || NM.norm(m.name).includes(NM.norm(RP.q))));
    const fit = all.filter((m) => base + m.cost <= S.prefs.budget), hidden = all.length - fit.length;
    return { cur, fit, hidden, base };
  };
  const paintRp = () => {
    const { cur, fit, hidden } = rpOptions();
    $("[data-rp-opts]").innerHTML = fit.length ? fit.map((m, i) => `<label class="radio"><input type="radio" name="rpm" value="${m.id}" ${i === 0 ? "checked" : ""}><span><strong>${esc(m.name)}</strong> · ${money(m.cost)}<span class="hint">${m.kind === "local" ? "En local" : `Receta · ${m.time} min`}${m.iron ? " · Fuente de hierro" : ""} · ${cur ? (m.cost - cur.cost <= 0 ? "−" : "+") + money(Math.abs(m.cost - cur.cost)) + " frente a la actual" : "dentro de tu presupuesto"}</span></span></label>`).join("")
      : '<p class="muted">No hay opciones que entren en tu presupuesto con estos filtros. Quita otra comida o sube el presupuesto.</p>';
    $("[data-rp-note]").textContent = hidden ? `${hidden} ${hidden === 1 ? "opción supera" : "opciones superan"} tu presupuesto y no se muestran.` : "";
    $("[data-rp-ok]").disabled = !fit.length;
  };
  NM.act.replace = (el) => {
    RP.slot = el.dataset.v; RP.q = ""; RP.kinds = { receta: true, local: true };
    const d = dayIdx(), cur = S.plan[d][RP.slot] ? NM.mealById(S.plan[d][RP.slot]) : null, label = NM.slots.find((s) => s.id === RP.slot).label;
    NM.dialog({ title: (cur ? "Reemplazar " : "Añadir ") + label.toLowerCase(), sub: `${DAYS[d].long}${cur ? ` · actual: ${cur.name} (${money(cur.cost)})` : ""}`, focus: "#rp-q",
      body: `<form data-form="replace" class="stack">${NM.field({ id: "rp-q", label: "Buscar receta o local", extra: 'data-inp="rp-q"' })}
        <div class="chip-group" role="group" aria-label="Tipo de opción">${NM.chip("Recetas", true, 'data-act="rp-kind" data-v="receta"')}${NM.chip("Locales", true, 'data-act="rp-kind" data-v="local"')}</div>
        <p class="hint">Solo mostramos opciones que mantienen el plan dentro de tu presupuesto (${money2(S.prefs.budget)}).</p>
        <fieldset class="field"><legend class="sr-only">Opciones dentro del presupuesto</legend><div class="radio-list" data-rp-opts></div></fieldset><p class="hint" data-rp-note></p>
        <div class="btn-row"><button type="button" class="btn btn-secondary" data-act="dlg-close" style="flex:1">Cancelar</button><button type="submit" class="btn btn-primary" data-rp-ok style="flex:1">${cur ? "Reemplazar" : "Añadir"}</button></div></form>` });
    paintRp();
  };
  NM.inp["rp-q"] = (el) => { RP.q = el.value; paintRp(); };
  NM.act["rp-kind"] = (el) => { const k = el.dataset.v; RP.kinds[k] = !RP.kinds[k]; if (!RP.kinds.receta && !RP.kinds.local) RP.kinds[k === "receta" ? "local" : "receta"] = true; $$("[data-act=rp-kind]").forEach((b) => b.setAttribute("aria-pressed", String(RP.kinds[b.dataset.v]))); paintRp(); };
  NM.form.replace = (f) => {
    const sel = $('input[name="rpm"]:checked', f); if (!sel) return;
    const d = dayIdx(), slot = RP.slot, before = S.plan[d][slot];
    S.plan[d][slot] = sel.value; NM.save("plan"); NM.closeDialogs(); NM.refresh();
    const m = NM.mealById(sel.value);
    NM.snack(before ? `Reemplazaste «${NM.mealById(before).name}» por «${m.name}». El costo de la semana se recalculó.` : `Añadiste «${m.name}».`, { onAction: () => { S.plan[d][slot] = before; NM.save("plan"); NM.refresh(); NM.announce("Cambio deshecho."); } });
  };
  /* Añadir un local o una receta al plan */
  const needPlan = () => { NM.snack("Primero genera tu plan semanal con tu presupuesto.", { actionLabel: "Ir a Mi plan", onAction: () => NM.go("/plan") }); };
  const addToPlan = (id, slot, d) => {
    const before = S.plan[d][slot]; S.plan[d][slot] = id; NM.save("plan");
    const m = NM.mealById(id), over = NM.planTotal() > S.prefs.budget;
    NM.snack(`Añadiste «${m.name}» al ${NM.slots.find((s) => s.id === slot).label.toLowerCase()} del ${DAYS[d].long.toLowerCase()}.` + (over ? " Ahora el plan supera tu presupuesto." : ""), { onAction: () => { S.plan[d][slot] = before; NM.save("plan"); NM.announce("Cambio deshecho."); } });
  };
  NM.act["add-plan"] = (el) => {
    if (!S.plan) return needPlan();
    const p = NM.placeById(el.dataset.id), id = "custom-" + p.id;
    S.custom[id] = { id, slot: "almuerzo", name: p.name, cost: p.price, iron: NM.placeIron(p), kind: "local", place: p.id }; NM.save("custom");
    addToPlan(id, "almuerzo", dayIdx());
  };
  NM.act["add-recipe"] = (el) => { if (!S.plan) return needPlan(); const m = NM.mealById(el.dataset.id); addToPlan(m.id, m.slot, Number($("#rday").value)); };

  /* ---------- Lista de compras · US04, US22, US23 ---------- */
  const groups = () => { const items = NM.shopping(); return D.categories.concat("Añadidos por ti").map((cat) => [cat, items.filter((i) => i.cat === cat)]).filter(([, g]) => g.length); };
  NM.route("/lista", { view: ({ q }) => {
    const items = NM.shopping(), done = items.filter((i) => S.checked[i.name]).length, cost = items.reduce((s, i) => s + i.cost, 0), edit = q.edit === "1";
    const row = (it) => {
      const ck = !!S.checked[it.name];
      if (edit) return `<li class="shop-item edit"><label class="sr-only" for="ren-${esc(it.name)}">Editar ${esc(it.name)}</label><input id="ren-${esc(it.name)}" type="text" value="${esc(NM.itemLabel(it))}" data-orig="${esc(it.name)}" data-extra="${it.extra ? 1 : 0}" name="ren" autocomplete="off">
        <button type="button" class="btn-link danger" data-act="del-item" data-id="${esc(it.name)}">${icon("trash", "icon icon-sm")}Eliminar<span class="sr-only"> ${esc(it.name)}</span></button></li>`;
      return `<li class="shop-item${ck ? " is-done" : ""}"><label class="check"><input type="checkbox" data-chg="shop" value="${esc(it.name)}" ${ck ? "checked" : ""}><span class="shop-name"><span class="shop-text">${esc(NM.itemLabel(it))}</span>${ck ? "<small>Comprado</small>" : ""}</span></label>${it.cost ? `<span class="shop-price${ck ? " strike" : ""}">${money2(it.cost)}</span>` : ""}</li>`;
    };
    const body = items.length ? groups().map(([cat, g]) => `<section class="card shop-group"><h2 class="h4">${esc(cat)}</h2><ul>${g.map(row).join("")}</ul></section>`).join("") : `<div class="empty-state">${icon("list", "icon icon-lg")}<h2 class="h3">Tu lista está vacía</h2><p class="muted">La lista se arma con los ingredientes de tu plan semanal. Genera tu plan o añade productos a mano.</p><a class="btn btn-primary btn-compact" href="#/plan">Ir a Mi plan</a></div>`;
    return { title: edit ? "Editar lista" : "Lista de compras", heading: edit ? "Editar lista" : "Lista de compras", sub: S.plan ? `Generada desde tu plan · ${NM.weekLabel(S.planWeek)}` : "Sin plan todavía", back: "/plan",
      actions: edit ? [`<button type="submit" form="edit-form" class="btn btn-primary btn-compact">Listo</button>`] : [`<button type="button" class="btn btn-secondary btn-compact" data-act="share">${icon("share", "icon icon-sm")}Compartir</button>`, `<a class="btn btn-secondary btn-compact" href="#/lista?edit=1">${icon("edit", "icon icon-sm")}Editar</a>`],
      html: `${!edit && items.length ? `<div class="card stack"><div class="row-between wrap"><strong>${done} de ${items.length} comprados · faltan ${items.length - done}</strong><span class="muted">Costo estimado de insumos ${money2(cost)}</span></div><p class="hint">Este monto suma solo los productos de la lista. El costo del plan suma el precio de cada comida, por eso no coinciden.</p>${NM.prog(items.length ? Math.round((done / items.length) * 100) : 0, "Productos comprados")}</div>` : ""}
        <form id="edit-form" data-form="edit-list" class="stack" novalidate>${body}</form>
        <form class="card stack add-item" data-form="add-item" novalidate>${NM.field({ id: "add-item", label: "Añadir producto", ph: "Ej.: avena 1 kg" })}<button class="btn btn-secondary btn-compact" type="submit">${icon("plus", "icon icon-sm")}Añadir</button></form>
        <a class="btn btn-secondary btn-block" href="#/radar?mercado=1" data-act="where-buy" data-native>${icon("pin", "icon icon-sm")}Ver dónde comprar cerca</a>` };
  } });
  NM.chg.shop = (el) => { if (el.checked) S.checked[el.value] = true; else delete S.checked[el.value]; NM.save("checked"); NM.refresh(); };
  NM.act["where-buy"] = (el, e) => { e.preventDefault(); NM.resetRadar(); R.types = new Set(["mercado"]); NM.go("/radar"); };
  NM.form["add-item"] = (f) => {
    const inp = $("#add-item"), v = inp.value.trim(); NM.clr(inp);
    if (!v) NM.err(inp, "Escribe el producto que quieres añadir, por ejemplo «avena 1 kg»."); else if (NM.shopping().some((i) => NM.norm(i.name) === NM.norm(v))) NM.err(inp, "Ese producto ya está en tu lista.");
    if (NM.firstInvalid(f)) return;
    S.extras.push(v); NM.save("extras"); NM.refresh(); $("#add-item").focus();
    NM.snack(`Agregaste «${v}». El costo estimado se actualizó.`, { duration: 6000 });
  };
  NM.form["edit-list"] = (f) => {
    $$('input[name="ren"]', f).forEach((i) => {
      const orig = i.dataset.orig, val = i.value.trim(); if (!val) return;
      if (i.dataset.extra === "1") { S.extras = S.extras.map((x) => (x === orig ? val : x)); delete S.checked[orig]; }
      else { const it = NM.shopping().find((x) => x.name === orig), def = it.name + (NM.qty(it) ? " " + NM.qty(it) : ""); if (val === def) delete S.renames[orig]; else S.renames[orig] = val; }
    });
    NM.save("extras", "renames", "checked"); NM.go("/lista"); NM.snack("Guardamos los cambios de tu lista.", { duration: 5000 });
  };
  NM.act["del-item"] = (el) => {
    const name = el.dataset.id, extra = S.extras.includes(name);
    if (extra) S.extras = S.extras.filter((x) => x !== name); else S.removed.push(name);
    NM.save("extras", "removed"); NM.refresh();
    NM.snack(`Eliminaste «${name}» de la lista.`, { onAction: () => { if (extra) S.extras.push(name); else S.removed = S.removed.filter((x) => x !== name); NM.save("extras", "removed"); NM.refresh(); } });
  };
  NM.act.share = () => {
    const { n, text } = NM.shareText();
    NM.dialog({ title: "Compartir lista", sub: "Se comparten los productos pendientes, agrupados por categoría y con sus cantidades.",
      body: `<div class="stack"><div class="card share-prev"><p class="muted small">Vista previa</p><pre>${esc(text)}</pre>${n ? "" : '<p class="muted">No hay productos pendientes para compartir.</p>'}</div>
        <div class="btn-row"><a class="btn btn-primary" style="flex:1" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}" ${n ? "" : 'aria-disabled="true"'}>${icon("external", "icon icon-sm")}WhatsApp<span class="sr-only"> (se abre en una pestaña nueva)</span></a>
        <button type="button" class="btn btn-secondary" style="flex:1" data-act="copy-list">${icon("copy", "icon icon-sm")}Copiar lista</button></div><button type="button" class="btn-link center" data-act="dlg-close">Cancelar</button></div>` });
  };
  NM.act["copy-list"] = () => {
    const { n, text } = NM.shareText();
    const ok = () => { NM.closeDialogs(); NM.snack(`Lista copiada: ${n} productos pendientes, agrupados por categoría.`); }, fail = () => NM.snack("No pudimos copiar la lista. Selecciona el texto y cópialo a mano.");
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fail);
    else { const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy") ? ok() : fail(); } catch (e) { fail(); } ta.remove(); }
  };

  /* ---------- Gasto semanal · US26 ---------- */
  NM.route("/gasto", { view: () => {
    const t = NM.spendTotal(), pct = NM.spendPct(), list = NM.weekSpend().slice().sort((a, b) => b.at - a.at);
    return { title: "Gasto de la semana", heading: "Gasto de la semana", sub: `Semana del ${NM.weekLabel(NM.weekStart())}`, back: "/inicio",
      html: `<div class="two-col"><div class="stack"><div class="card stack"><p class="big">${money2(t)} de ${money2(S.prefs.budget)}</p>${NM.prog(pct, "Porcentaje del presupuesto usado", pct > 100)}<p><strong>${pct} % usado</strong> <span class="muted">· gastado, presupuesto y porcentaje</span></p></div>
        ${pct >= 80 ? NM.alert("warning", "Superaste el 80 % de tu presupuesto", `Te quedan ${money2(Math.max(0, S.prefs.budget - t))} hasta el domingo.`) : ""}
        <h2 class="h3">Gastos registrados</h2>${list.length ? `<ul class="card spend-list">${list.map((g) => `<li><span class="muted small">${NM.cap(new Date(g.at).toLocaleDateString("es-PE", { weekday: "short" }))}</span><span>${esc(g.desc)}</span><strong>${money2(g.amount)}</strong><button type="button" class="btn-link danger" data-act="del-spend" data-id="${g.id}">Quitar<span class="sr-only"> ${esc(g.desc)}</span></button></li>`).join("")}</ul>` : `<p class="muted">Aún no registraste gastos esta semana.</p>`}</div>
        <form class="card stack" data-form="spend" novalidate><h2 class="h3">Registrar un gasto</h2>${NM.field({ id: "sp-amount", label: "Monto (S/)", req: true, inputmode: "decimal", help: "Solo números, con hasta 2 decimales", prefix: "S/" })}${NM.field({ id: "sp-desc", label: "Descripción", ph: "Almuerzo en cafetería" })}<button class="btn btn-primary" type="submit">Registrar gasto</button></form></div>` };
  } });
  NM.form.spend = (f) => {
    const a = $("#sp-amount"), v = NM.parseAmount(a.value); NM.clr(a);
    if (!a.value.trim()) NM.err(a, "Escribe el monto que gastaste, por ejemplo 12."); else if (Number.isNaN(v) || v <= 0) NM.err(a, "Escribe solo números mayores a cero, por ejemplo 12.50.");
    if (NM.firstInvalid(f)) return;
    const before = NM.spendPct();
    S.spend.push({ id: NM.uid(), at: Date.now(), desc: $("#sp-desc").value.trim() || "Gasto", amount: v }); NM.save("spend"); NM.refresh();
    const after = NM.spendPct();
    NM.snack(after >= 80 && before < 80 ? `Registraste ${money2(v)}. Superaste el 80 % de tu presupuesto semanal.` : `Registraste ${money2(v)}. Llevas ${after} % de tu presupuesto.`);
  };
  NM.act["del-spend"] = (el) => { const g = S.spend.find((x) => x.id === el.dataset.id); S.spend = S.spend.filter((x) => x.id !== g.id); NM.save("spend"); NM.refresh(); NM.snack(`Quitaste el gasto «${g.desc}».`, { onAction: () => { S.spend.push(g); NM.save("spend"); NM.refresh(); } }); };

  /* ---------- Historial de planes · US25 ---------- */
  NM.route("/historial", { view: () => {
    NM.ensureWeek();
    const list = S.history.slice(0, 8);
    return { title: "Historial de planes", heading: "Historial de planes", sub: "Últimas 8 semanas", back: "/plan",
      html: list.length ? `<div class="stack narrow">${NM.alert("info", "", "Al copiar un plan recalculamos su costo con los precios de hoy.")}${list.map((h, i) => { const now = NM.planTotal(h.plan); return `<div class="card stack"><div class="row-between"><strong>Semana ${NM.weekLabel(h.weekStart)}</strong><strong>${money2(h.cost)}</strong></div><p class="muted">${h.meals} comidas · hoy costaría ${money2(now)}${now !== h.cost ? ` (antes ${money2(h.cost)})` : ""}</p><button type="button" class="btn btn-secondary btn-compact" data-act="reuse" data-v="${i}">Usar esta semana</button></div>`; }).join("")}<p class="hint">Se guardan las últimas 8 semanas.</p></div>`
        : `<div class="empty-state">${icon("clock", "icon icon-lg")}<h2 class="h3">Aún no hay planes guardados</h2><p class="muted">Cuando generes tus primeros planes, aquí podrás reutilizarlos.</p><a class="btn btn-primary btn-compact" href="#/plan">Generar un plan</a></div>` };
  } });
  NM.act.reuse = (el) => {
    const h = S.history[Number(el.dataset.v)], prev = { plan: S.plan, week: S.planWeek };
    if (S.plan) NM.archivePlan();
    S.plan = JSON.parse(JSON.stringify(h.plan)); S.planWeek = NM.weekStart(); S.checked = {}; S.removed = []; NM.save("plan", "planWeek", "checked", "removed");
    NM.go("/plan");
    setTimeout(() => NM.snack(`Copiamos el plan a esta semana con el costo recalculado: ${money2(NM.planTotal())} (antes ${money2(h.cost)}).`, { onAction: () => { S.plan = prev.plan; S.planWeek = prev.week; NM.save("plan", "planWeek"); NM.refresh(); } }), 50);
  };

  /* ---------- Recordatorios · US24 ---------- */
  NM.route("/recordatorios", { view: () => {
    const card = (sl) => { const r = S.reminders[sl.id]; return `<div class="card stack"><div class="switch-row"><span><strong>${sl.label}</strong></span><button type="button" class="switch" role="switch" aria-checked="${r.on}" aria-label="Recordatorio de ${sl.label.toLowerCase()}" data-act="rem-toggle" data-v="${sl.id}"><span class="switch-text">${r.on ? "Activado" : "Desactivado"}</span></button></div>
      ${r.on ? `<div class="field"><label for="rem-${sl.id}">Hora del recordatorio</label><input id="rem-${sl.id}" type="time" value="${r.time}" data-chg="rem-time" data-v="${sl.id}"></div>` : ""}</div>`; };
    const pre = S.reminders.almuerzo.on ? "almuerzo" : S.reminders.cena.on ? "cena" : S.reminders.desayuno.on ? "desayuno" : null;
    const m = pre && S.plan ? S.plan[NM.todayIdx()][pre] : null;
    return { title: "Recordatorios", heading: "Recordatorios", sub: "Perfil › Preferencias", back: "/perfil?t=pref",
      html: `<div class="narrow stack">${NM.slots.map(card).join("")}<div class="card"><p class="muted small">Vista previa de la notificación</p><p><strong>NutriMap · ${pre ? S.reminders[pre].time : "--:--"}</strong></p><p class="muted">${pre ? `${NM.cap(pre)} de hoy: ${m ? esc(NM.mealById(m).name) + " · " + money(NM.mealById(m).cost) : "sin comida planificada"}` : "Activa un recordatorio para ver cómo se verá."}</p></div>
        <p class="hint">Los recordatorios funcionan con NutriMap abierta o con las notificaciones del navegador permitidas.</p><button type="button" class="btn btn-primary btn-block" data-act="rem-save">Guardar recordatorios</button></div>` };
  } });
  NM.act["rem-toggle"] = (el) => { const r = S.reminders[el.dataset.v]; r.on = !r.on; NM.save("reminders"); NM.refresh(); };
  NM.chg["rem-time"] = (el) => { S.reminders[el.dataset.v].time = el.value || "12:30"; NM.save("reminders"); NM.refresh(); };
  NM.act["rem-save"] = () => {
    NM.save("reminders");
    if (Object.values(S.reminders).some((r) => r.on) && "Notification" in window && Notification.permission === "default") Notification.requestPermission();
    NM.snack("Guardamos tus recordatorios.");
  };
  NM.startReminders = () => setInterval(() => {
    const now = new Date(), hm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"), day = now.toDateString();
    NM.slots.forEach((sl) => {
      const r = S.reminders[sl.id], k = "rem:" + sl.id + day;
      if (!r.on || r.time !== hm || S.seen[k] || !S.plan) return;
      const id = S.plan[NM.todayIdx()][sl.id], m = id && NM.mealById(id); if (!m) return;
      S.seen[k] = true; NM.save("seen");
      const txt = `${sl.label} de hoy: ${m.name} · ${money(m.cost)}`;
      if ("Notification" in window && Notification.permission === "granted") new Notification("NutriMap · " + hm, { body: txt }); else NM.snack(txt);
    });
  }, 30000);

  /* ---------- Aprende: artículos y recetas · US05, US21 ---------- */
  const RF = (NM.RF = { cheap: false, quick: false, iron: false, q: "" });
  const recipes = () => D.meals.filter((m) => m.kind === "receta").filter((m) => (!RF.cheap || m.cost <= 5) && (!RF.quick || m.time <= 30) && (!RF.iron || m.iron) && (!RF.q || NM.norm(m.name + " " + m.ingredients.map((i) => i[0]).join(" ")).includes(NM.norm(RF.q))));
  const recipeCard = (m) => `<li class="card place"><div class="place-main"><h3><a class="place-title" href="#/receta/${m.id}">${esc(m.name)}</a></h3><p class="place-meta"><strong>${money(m.cost)}</strong> · ${m.time} min · ${NM.slots.find((s) => s.id === m.slot).label}</p><div class="tags">${m.iron ? NM.ironBadge() : ""}</div></div>
    <div class="place-actions">${NM.favBtnR(m.id, m.name)}</div></li>`;
  NM.favBtnR = (id, name) => { const on = S.favRecipes.includes(id); return `<button type="button" class="icon-btn" data-act="fav-r" data-id="${id}" data-name="${esc(name)}" aria-pressed="${on}" aria-label="${on ? "Quitar de favoritos" : "Guardar en favoritos"}: ${esc(name)}">${icon(on ? "starf" : "star")}</button>`; };
  NM.act["fav-r"] = (el) => {
    const id = el.dataset.id, name = el.dataset.name, on = !S.favRecipes.includes(id);
    const set = (v) => { S.favRecipes = S.favRecipes.filter((x) => x !== id); if (v) S.favRecipes.push(id); NM.save("favRecipes"); if (/^\/perfil/.test(NM.cur().path)) NM.refresh(); else $$(`[data-act=fav-r][data-id="${id}"]`).forEach((b) => { b.setAttribute("aria-pressed", String(v)); b.querySelector("use").setAttribute("href", v ? "#i-starf" : "#i-star"); b.setAttribute("aria-label", `${v ? "Quitar de favoritos" : "Guardar en favoritos"}: ${name}`); }); };
    set(on); if (!on) NM.snack(`Quitaste «${name}» de favoritos.`, { onAction: () => set(true) });
  };
  NM.route("/aprende", { view: ({ q }) => {
    const tab = q.t === "recetas" ? "recetas" : "art";
    const arts = S.articles.filter((a) => a.status === "publicado");
    const items = tab === "recetas" ? recipes() : [];
    const body = tab === "art"
      ? `${NM.alert("warning", "Contenido educativo", "NutriMap no diagnostica anemia ni recomienda suplementos. Si tienes cansancio o palidez persistentes, consulta a un profesional de salud.")}
        <ul class="place-list">${arts.map((a) => `<li class="card stack"><h2 class="h3"><a href="#/articulo/${a.id}">${esc(a.title)}</a></h2><div class="tags">${NM.badge("Revisado por nutricionista", "success")}</div><p class="muted small">Revisado el ${NM.fmtDate(a.reviewedAt)} · ${a.readMin} min</p></li>`).join("") || '<li class="muted">Aún no hay artículos publicados.</li>'}</ul>
        <a class="btn btn-secondary btn-compact" href="#/radar" data-act="iron-cta" data-native>Ver opciones cerca con fuentes de hierro</a>`
      : `<div class="stack"><div class="input-icon">${icon("search")}<input id="rcq" type="search" value="${esc(RF.q)}" placeholder="Buscar receta o ingrediente" aria-label="Buscar receta o ingrediente" autocomplete="off" data-inp="rcq"></div>
        <div class="chip-group" role="group" aria-label="Filtrar recetas">${NM.chip("Hasta S/ 5", RF.cheap, 'data-act="rf" data-v="cheap"')}${NM.chip("Hasta 30 min", RF.quick, 'data-act="rf" data-v="quick"')}${NM.chip("Con hierro", RF.iron, 'data-act="rf" data-v="iron"')}</div>
        <p class="muted" aria-live="polite" data-rc-count>${items.length ? `${items.length} ${items.length === 1 ? "receta" : "recetas"} · costo estimado por porción` : ""}</p><div data-rc-list>${recList(items)}</div></div>`;
    return { title: "Aprende", heading: "Aprende", sub: tab === "recetas" ? "Recetas económicas y rápidas" : "Contenido revisado por nutricionistas", wide: true,
      html: `${NM.tabs([["art", "Artículos", "/aprende"], ["recetas", "Recetas", "/aprende?t=recetas"]], tab, "Aprende")}<div class="stack">${body}</div>` };
  } });
  const recList = (items) => items.length ? `<ul class="place-list">${items.map(recipeCard).join("")}</ul>` : `<div class="empty-state">${icon("search", "icon icon-lg")}<h3>No hay recetas con estos filtros</h3><p class="muted">Quita alguno para ver más recetas.</p><button type="button" class="btn btn-primary btn-compact" data-act="rf-reset">Restablecer filtros</button></div>`;
  const repaintRc = () => { const it = recipes(); $("[data-rc-count]").textContent = it.length ? `${it.length} ${it.length === 1 ? "receta" : "recetas"} · costo estimado por porción` : ""; $("[data-rc-list]").innerHTML = recList(it); $$("[data-act=rf]").forEach((b) => b.setAttribute("aria-pressed", String(RF[b.dataset.v]))); };
  NM.act.rf = (el) => { RF[el.dataset.v] = !RF[el.dataset.v]; repaintRc(); };
  NM.act["rf-reset"] = () => { RF.cheap = RF.quick = RF.iron = false; RF.q = ""; $("#rcq").value = ""; repaintRc(); };
  NM.inp.rcq = (el) => { RF.q = el.value.trim(); repaintRc(); };
  NM.act["iron-cta"] = (el, e) => { e.preventDefault(); NM.resetRadar(); R.iron = true; if (!S.loc.asked) { S.loc.asked = true; NM.save("loc"); } NM.go("/radar"); };

  NM.route("/articulo/:id", { view: ({ params }) => {
    const a = NM.article(params.id);
    if (!a || a.status !== "publicado") return { redirect: "/aprende" };
    const sz = S.prefs.textSize || "normal";
    return { title: a.title, heading: a.title, sub: `${NM.badge("Revisado por nutricionista", "success")} Revisado el ${NM.fmtDate(a.reviewedAt)} · ${a.readMin} min`, back: "/aprende",
      html: `<article class="article narrow stack">${NM.alert("warning", "Contenido educativo", "NutriMap no diagnostica anemia ni recomienda suplementos. Si tienes cansancio o palidez persistentes, consulta a un profesional de salud.")}
        <div class="text-size" role="group" aria-label="Tamaño de texto del artículo"><span class="muted" aria-hidden="true">Aa</span>${NM.chip("Normal", sz === "normal", 'data-act="tsize" data-v="normal"')}${NM.chip("Grande", sz === "large", 'data-act="tsize" data-v="large"')}${NM.chip("Muy grande", sz === "xlarge", 'data-act="tsize" data-v="xlarge"')}</div>
        <div class="article-body size-${sz}">${a.body.map((s) => `<h2>${esc(s.h)}</h2><p>${esc(s.p)}</p>`).join("")}</div>
        <p class="source">Fuente: <a href="${esc(a.source.url)}" target="_blank" rel="noopener">${esc(a.source.label)}${icon("external", "icon icon-sm")}<span class="sr-only"> (se abre en una pestaña nueva)</span></a></p>
        <a class="btn btn-primary" href="#/radar" data-act="iron-cta" data-native>Ver opciones cerca con fuentes de hierro</a></article>` };
  } });
  NM.act.tsize = (el) => { S.prefs.textSize = el.dataset.v; NM.save("prefs"); NM.refresh(); };

  NM.route("/receta/:id", { view: ({ params }) => {
    const m = NM.mealById(params.id); if (!m || m.kind !== "receta") return { redirect: "/aprende?t=recetas" };
    return { title: m.name, heading: m.name, sub: "Receta económica", back: "/aprende?t=recetas", actions: [NM.favBtnR(m.id, m.name)],
      html: `<div class="narrow stack"><div class="tags">${NM.badge("Costo " + money(m.cost))}${NM.badge(m.time + " min")}${NM.badge(NM.slots.find((s) => s.id === m.slot).label)}${m.iron ? NM.ironBadge() : ""}</div>
        <h2 class="h3">Ingredientes</h2><ul class="card bullets">${m.ingredients.map((i) => `<li>${esc(i[0])} · ${i[2]} ${esc(i[3])} <span class="muted">(${money2(i[4])})</span></li>`).join("")}</ul>
        <h2 class="h3">Preparación · ${m.time} min</h2><ol class="steps-list card">${m.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        <div class="card stack"><label for="rday">Día de la semana</label><select id="rday">${DAYS.map((d) => `<option value="${d.id}" ${d.id === dayIdx() ? "selected" : ""}>${d.long}</option>`).join("")}</select><button type="button" class="btn btn-primary" data-act="add-recipe" data-id="${m.id}">${icon("plus", "icon icon-sm")}Añadir a mi plan</button></div></div>` };
  } });

  /* ---------- Perfil · US09, US10, US14, US48 ---------- */
  NM.route("/perfil", { view: ({ q, user }) => {
    const tab = ["fav", "pref", "priv"].includes(q.t) ? q.t : "fav";
    const tabs = NM.tabs([["fav", "Favoritos", "/perfil?t=fav"], ["pref", "Preferencias", "/perfil?t=pref"], ["priv", "Privacidad", "/perfil?t=priv"]], tab, "Secciones del perfil");
    const guest = user ? "" : NM.alert("info", "Estás usando NutriMap sin cuenta", `Crea una cuenta para guardar tu plan, tus preferencias y tus favoritos. <a href="#/registro">Crear cuenta</a> · <a href="#/ingresar">Iniciar sesión</a>`);
    let body = "";
    if (tab === "fav") {
      const ps = S.favs.map(NM.placeById).filter(Boolean), rs = S.favRecipes.map(NM.mealById).filter(Boolean);
      body = `<h2 class="h3">Locales (${ps.length})</h2>${ps.length ? `<ul class="place-list">${ps.map((p) => `<li class="card place"><div class="place-main"><h3><a class="place-title" href="#/local/${p.id}">${esc(p.name)}</a></h3><p class="place-meta"><strong>${esc(NM.priceLabel(p))}</strong> · ${distLabel(p.distance)}</p><div class="tags">${NM.placeIron(p) ? NM.ironBadge() : ""}</div></div><div class="place-actions">${NM.favBtn(p.id, p.name)}</div></li>`).join("")}</ul>` : `<p class="muted">Aún no guardaste locales. Toca la estrella en el radar o en la ficha de un local.</p>`}
        <h2 class="h3">Recetas (${rs.length})</h2>${rs.length ? `<ul class="place-list">${rs.map(recipeCard).join("")}</ul>` : `<p class="muted">Aún no guardaste recetas.</p>`}`;
    } else if (tab === "pref") {
      body = `<form class="narrow stack" data-form="prefs" novalidate><p class="muted">Estos valores se aplican solos al abrir el radar.</p>
        ${NM.field({ id: "pf-budget", label: "Presupuesto semanal (S/)", req: true, value: S.prefs.budget, inputmode: "decimal", prefix: "S/", help: "Debe ser mayor a cero. Se aplica al plan y como filtro inicial del radar. Puedes cambiarlo cuando quieras." })}
        <fieldset class="field"><legend>Distancia predeterminada</legend><div class="chip-group">${[500, 1000, 2000].map((r) => `<label class="chip-radio"><input type="radio" name="pdist" value="${r}" ${S.loc.radius === r ? "checked" : ""}><span>${distLabel(r)}</span></label>`).join("")}</div></fieldset>
        <div class="card">${NM.sw("Priorizar fuentes de hierro", S.prefs.iron, 'data-act="pref-iron"', "Aparecen primero en el radar")}<a class="row-link" href="#/recordatorios">Recordatorios de comidas${icon("right", "icon icon-sm")}<span class="sr-only">: configurar</span></a></div>
        ${NM.alert("info", "", `Uso de ubicación: ${({ session: "solo mientras usas la app", campus: "siempre un campus fijo", none: "no se usa" })[S.prefs.locPref || "session"]}. <a href="#/perfil?t=priv">Gestionar en Privacidad ›</a>`, "pin")}
        <button class="btn btn-primary btn-block" type="submit">Guardar preferencias</button></form>`;
    } else {
      const lp = S.prefs.locPref || "session";
      body = `<div class="narrow stack"><fieldset class="field"><legend>Uso de tu ubicación</legend><div class="radio-list card">${[["session", "Solo mientras uso NutriMap", "Recomendado"], ["campus", "Usar siempre un campus fijo", "No se usa el GPS"], ["none", "No usar mi ubicación", "Elegirás un campus en cada búsqueda"]].map(([v, l, h]) => `<label class="radio"><input type="radio" name="locpref" value="${v}" data-chg="locpref" ${lp === v ? "checked" : ""}><span>${l} <span class="hint">${h}</span></span></label>`).join("")}</div></fieldset>
        ${NM.alert("info", "Tus datos están protegidos", "Tu contraseña se guarda cifrada y, al publicar la app, toda la comunicación usa conexión segura (HTTPS). Pedimos tu consentimiento antes de guardar datos personales, como exige la Ley N.° 29733.", "lock")}
        <button type="button" class="btn btn-secondary btn-block" data-act="download">${icon("dl", "icon icon-sm")}Descargar mis datos</button>
        ${user ? `<button type="button" class="btn btn-secondary btn-block" data-act="logout">Cerrar sesión</button>` : ""}
        <button type="button" class="btn btn-danger btn-block" data-act="del-open">${icon("trash", "icon icon-sm")}Eliminar mi cuenta y mis datos</button></div>`;
    }
    return { title: "Perfil", heading: "Perfil", sub: user ? `Estudiante · ${esc(NM.campus(user.campus).name)}` : "Invitado", wide: true, html: `${guest}${tabs}<div class="stack">${body}</div>` };
  } });
  NM.act["pref-iron"] = () => { S.prefs.iron = !S.prefs.iron; NM.save("prefs"); NM.refresh(); };
  NM.chg.locpref = (el) => { S.prefs.locPref = el.value; if (el.value !== "session" && S.loc.mode === "gps") S.loc.mode = "campus"; NM.save("prefs", "loc"); NM.snack("Guardamos tu preferencia de ubicación."); };
  NM.form.prefs = (f) => {
    const b = $("#pf-budget"), v = NM.parseAmount(b.value); NM.clr(b);
    if (!b.value.trim()) NM.err(b, "Escribe tu presupuesto semanal, por ejemplo 90."); else if (Number.isNaN(v)) NM.err(b, "Escribe solo números, por ejemplo 90 o 85.50."); else if (v <= 0) NM.err(b, "El monto debe ser mayor a cero. Ejemplo: 90");
    if (NM.firstInvalid(f)) return;
    S.prefs.budget = v; S.loc.radius = Number($('input[name="pdist"]:checked', f).value); NM.save("prefs", "loc"); NM.resetRadar();
    NM.snack(`Guardamos tu presupuesto de ${money2(v)}. Se aplica al plan y al radar.`); NM.refresh();
  };
  NM.act.download = () => {
    const u = NM.user();
    const out = { cuenta: u ? { correo: u.email, nombre: u.name, campus: NM.campus(u.campus).name, consentimientoAceptadoEl: u.consentAt } : "Sin cuenta (datos solo de este navegador)", presupuestoSemanal: S.prefs.budget, plan: S.plan, favoritos: { locales: S.favs, recetas: S.favRecipes }, gastos: S.spend, exportadoEl: new Date().toISOString() };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = "nutrimap-mis-datos.json"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); NM.snack("Descargamos tus datos en un archivo JSON. La contraseña no se incluye.");
  };
  NM.act.logout = () => { S.session = null; S.entry = null; NM.save("session", "entry"); NM.go("/rol"); NM.snack("Cerraste sesión."); };
  NM.act["del-open"] = () => {
    NM.dialog({ kind: "alert", title: "¿Eliminar tu cuenta?", focus: "#del-c",
      body: `<div class="stack"><p>Se borrarán tu plan, tus favoritos, tus preferencias y tus datos personales. Esta acción no se puede deshacer.</p>${NM.field({ id: "del-c", label: "Escribe ELIMINAR para confirmar", extra: 'data-inp="del-c" autocapitalize="characters"' })}
        <div class="btn-row"><button type="button" class="btn btn-secondary" data-act="dlg-close" style="flex:1">Cancelar</button><button type="button" class="btn btn-danger" data-act="del-ok" data-del-ok disabled style="flex:1">Eliminar</button></div></div>` });
  };
  NM.inp["del-c"] = (el) => { $("[data-del-ok]").disabled = el.value.trim().toUpperCase() !== "ELIMINAR"; };
  NM.act["del-ok"] = () => {
    const u = NM.user(); if (u) { delete S.users[u.email]; S.session = null; S.entry = null; NM.save("users", "session", "entry"); }
    NM.wipePersonal(); NM.resetRadar(); NM.closeDialogs(); NM.go("/inicio");
    NM.snack("Eliminamos tu cuenta y todos tus datos personales.");
  };
})();
