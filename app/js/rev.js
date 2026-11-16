/* NutriMap Estudiantil · nutricionista revisor
   US08 aprobar contenido · US34 solicitar cambios por fragmento · US35 validar etiquetas · US36 historial de cambios */
(function () {
  "use strict";
  const NM = window.NM, S = NM.S;
  const { $, $$, esc, icon } = NM;
  const guard = (ctx) => (ctx.role === "rev" ? null : "/acceso-rol?r=rev");
  const GR = (path, def) => NM.route(path, Object.assign({ guard }, def));
  const revName = () => ((NM.user() || {}).name || "Revisor") + " (nutricionista)";
  const CHECK = NM_SEED.checklist;
  /* US35: los criterios de la etiqueta empiezan sin marcar y se guardan por solicitud; «Aprobar» depende de ellos */
  const LABEL_CRIT = NM_SEED.labelCriteria;
  const labelChecks = (d) => (Array.isArray(d.revCheck) && d.revCheck.length === LABEL_CRIT.length ? d.revCheck : LABEL_CRIT.map(() => false));
  const lid = (l) => encodeURIComponent(l.id);
  /* Cola de pendientes, la más antigua primero: es la que lleva más tiempo esperando */
  const sentAt = (a) => { const h = a.history.filter((x) => x.type === "Enviado a revisión"); return (h.length ? h[h.length - 1] : a.history[a.history.length - 1]).ts; };
  const queue = () => [
    ...S.articles.filter((a) => a.status === "revision").map((a) => ({ href: "/rev/articulo/" + a.id, title: a.title, meta: `Artículo · ${a.author}`, at: sentAt(a) })),
    ...NM.labels("pendiente").map((l) => ({ href: "/rev/etiqueta/" + encodeURIComponent(l.id), title: `Etiqueta · ${l.dish.dish}`, meta: l.place.name, at: l.dish.requestedAt || 0 }))
  ].sort((x, y) => x.at - y.at);
  /* Escritorio (W06): la bandeja queda a la izquierda del detalle para pasar de una solicitud a otra sin volver atrás */
  const rail = (here) => { const q = queue(); return `<aside class="rev-rail card stack" aria-labelledby="rail-t"><div class="row-between"><h2 class="h4" id="rail-t">En revisión (${q.length})</h2><a href="#/rev">Bandeja</a></div>
    ${q.length ? `<ul class="rail-list">${q.map((i) => `<li><a href="#${i.href}"${i.href === here ? ' aria-current="page"' : ""}><strong>${esc(i.title)}</strong><span>${esc(i.meta)} · ${esc(NM.fmtWhen(i.at))}</span></a></li>`).join("")}</ul>` : `<p class="muted small">No hay solicitudes pendientes.</p>`}</aside>`; };
  const split = (here, inner) => `<div class="rev-split">${rail(here)}<div class="rev-detail">${inner}</div></div>`;
  const stepper = (a) => `<div class="stepper" aria-label="Estado del contenido">${[["borrador", "Borrador"], ["revision", "En revisión"], ["publicado", "Publicado"]].map(([k, l]) => `<span class="step${a.status === k ? " on" : ""}"${a.status === k ? ' aria-current="step"' : ""}>${l}${a.status === k ? " (actual)" : ""}</span>`).join('<span class="step-sep" aria-hidden="true">›</span>')}</div>`;

  /* ---------- Bandeja · US08, US35 ---------- */
  GR("/rev", { view: ({ q }) => {
    const tab = ["borradores", "publicados"].includes(q.t) ? q.t : "revision", f = ["articulos", "etiquetas"].includes(q.f) ? q.f : "todos", text = (q.s || "").trim();
    const arts = (st) => S.articles.filter((a) => a.status === st), pend = NM.labels("pendiente");
    const counts = { revision: arts("revision").length + pend.length, borradores: arts("borrador").length, publicados: arts("publicado").length };
    const url = (t, ff) => `/rev?${t !== "revision" ? "t=" + t + "&" : ""}${ff !== "todos" ? "f=" + ff : ""}`.replace(/[?&]$/, "");
    const artCard = (a) => `<a class="card stack inbox-item" href="#/rev/articulo/${a.id}"><strong>${esc(a.title)}</strong><span class="muted small">${esc(a.author)} · ${a.status === "borrador" ? "con comentarios" : "enviado " + esc(NM.fmtWhen(a.history[a.history.length - 1].ts))}</span><span class="row-between">${a.status === "revision" ? "<span></span>" : NM.badge(NM.artStatus(a), a.status === "publicado" ? "success" : "", true)}<span class="link-like">${a.status === "revision" ? "Revisar" : "Ver"} ›</span></span></a>`;
    const labCard = (l) => `<a class="card stack inbox-item" href="#/rev/etiqueta/${lid(l)}"><strong>Etiqueta «Fuente de hierro» · ${esc(l.dish.dish)}</strong><span class="muted small">${esc(l.place.name)} · solicitada ${esc(NM.fmtWhen(l.dish.requestedAt))}</span><span class="row-between"><span></span><span class="link-like">Revisar ›</span></span></a>`;
    let items = [];
    if (tab === "revision") { const rv = []; if (f !== "etiquetas") arts("revision").forEach((a) => rv.push([sentAt(a), a.title, artCard(a)])); if (f !== "articulos") pend.forEach((l) => rv.push([l.dish.requestedAt || 0, l.dish.dish + " " + l.place.name, labCard(l)])); rv.sort((x, y) => x[0] - y[0]).forEach((r) => items.push([r[1], r[2]])); }
    else if (f !== "etiquetas") arts(tab === "borradores" ? "borrador" : "publicado").forEach((a) => items.push([a.title, artCard(a)]));
    if (text) items = items.filter(([t]) => NM.norm(t).includes(NM.norm(text)));
    return { title: "Revisión de contenido", heading: "Revisión de contenido", sub: `${esc((NM.user() || {}).name || "")} · Bienestar UPC`,
      html: `${NM.tabs([["revision", `En revisión (${counts.revision})`, url("revision", f)], ["borradores", `Borradores (${counts.borradores})`, url("borradores", f)], ["publicados", `Publicados (${counts.publicados})`, url("publicados", f)]], tab, "Estado del contenido")}
        <div class="stack narrow"><form class="search" role="search" data-form="rev-search" data-t="${tab}" data-f="${f}"><label class="sr-only" for="rs">Buscar contenido</label><div class="input-icon">${icon("search")}<input id="rs" type="search" value="${esc(text)}" placeholder="Hierro, menestras…" autocomplete="off"></div></form>
        <div class="chip-group" role="group" aria-label="Tipo de solicitud">${[["todos", "Todos"], ["articulos", `Artículos (${tab === "revision" ? arts("revision").length : tab === "borradores" ? counts.borradores : counts.publicados})`], ["etiquetas", `Etiquetas (${tab === "revision" ? pend.length : 0})`]].map(([k, l]) => `<a class="chip" href="#${url(tab, k)}" aria-pressed="${f === k}">${l}</a>`).join("")}</div>
        ${items.length ? items.map((i) => i[1]).join("") : `<div class="empty-state">${icon("inbox", "icon icon-lg")}<h2 class="h3">No hay solicitudes aquí</h2><p class="muted">Cuando llegue contenido para revisar, aparecerá en esta bandeja.</p></div>`}</div>` };
  } });
  NM.form["rev-search"] = (f) => { const s = $("#rs").value.trim(), t = f.dataset.t, ff = f.dataset.f; NM.go(`/rev?${t !== "revision" ? "t=" + t + "&" : ""}${ff !== "todos" ? "f=" + ff + "&" : ""}${s ? "s=" + encodeURIComponent(s) : ""}`.replace(/[?&]$/, "")); };

  /* ---------- Revisión de un artículo · US08, US34 ---------- */
  GR("/rev/articulo/:id", { view: ({ params }) => {
    const a = NM.article(params.id); if (!a) return { redirect: "/rev" };
    const rev = a.status === "revision", miss = a.check.findIndex((c) => !c), done = miss < 0;
    const para = (s, i) => {
      const cs = a.comments.filter((c) => c.idx === i);
      return `<div class="para card stack" data-para="${i}"><h2 class="h4">${esc(s.h)}</h2><p class="para-text" id="pt-${i}">${esc(s.p)}</p>
        ${cs.map((c) => `<div class="cmt"><p class="muted small">Fragmento: «${esc(c.frag)}»</p><p><strong>${esc(c.text)}</strong></p>${rev ? `<button type="button" class="btn-link danger" data-act="c-del" data-id="${c.id}">Quitar comentario</button>` : ""}</div>`).join("")}
        ${rev ? `<button type="button" class="btn-link" data-act="c-open" data-id="${i}">${icon("msg", "icon icon-sm")}Comentar este fragmento</button><div data-c-form="${i}" data-keep="${i}"></div>` : ""}</div>`;
    };
    return { title: a.title, heading: a.title, sub: stepper(a), back: "/rev", wide: true,
      actions: [`<a class="btn btn-secondary btn-compact" href="#/rev/historial/${a.id}">${icon("history", "icon icon-sm")}Ver historial</a>`],
      html: split("/rev/articulo/" + a.id, `<div class="grid-2"><div class="stack">${rev ? `<p class="hint">Revisa en 3 pasos: <strong>1</strong> comenta los párrafos que lo necesiten, <strong>2</strong> marca la lista de verificación y <strong>3</strong> decide. Los pasos están junto al texto, o al final de la página en el celular.</p>` : NM.alert("info", "", `Este contenido está en estado «${NM.artStatus(a)}». Solo se revisa el contenido «En revisión».`)}${a.body.map(para).join("")}
        <p class="muted small">Autor: ${esc(a.author)} · Fuente: <a href="${esc(a.source.url)}" target="_blank" rel="noopener">${esc(a.source.label)}${icon("external", "icon icon-sm")}<span class="sr-only"> (se abre en una pestaña nueva)</span></a></p></div>
        ${rev ? `<aside class="stack rev-steps" aria-label="Pasos de la revisión">
          <section class="card stack" aria-labelledby="s1-t"><h2 class="h3" id="s1-t"><span class="step-n" aria-hidden="true">1</span>Lee y comenta</h2><p class="muted small">Lee cada párrafo. Para pedir un cambio, selecciona el texto y toca «Comentar este fragmento» (si no seleccionas nada, se comenta el inicio del párrafo).</p><p><strong>${a.comments.length}</strong> ${a.comments.length === 1 ? "comentario escrito" : "comentarios escritos"}</p></section>
          <section class="card stack" aria-labelledby="chk-t"><h2 class="h3" id="chk-t"><span class="step-n" aria-hidden="true">2</span>Revisa la lista de verificación</h2>${CHECK.map((l, i) => `<div class="${!done && i === miss ? "check-miss" : ""}"><label class="check"><input type="checkbox" data-chg="chk" data-id="${a.id}" value="${i}" ${a.check[i] ? "checked" : ""}> ${esc(l)}</label>${!done && i === miss ? `<p class="error-msg">${icon("alert", "icon icon-sm")}<span>Falta este punto para poder aprobar</span></p>` : ""}</div>`).join("")}</section>
          <section class="card stack" aria-labelledby="dec-t"><h2 class="h3" id="dec-t"><span class="step-n" aria-hidden="true">3</span>Decide</h2><p class="error-msg" id="cmt-error" role="alert" hidden></p>
            <div class="decide stack"><p class="small"><strong>¿Hay algo que corregir?</strong> El artículo vuelve a «Borrador» y el autor verá tus ${a.comments.length} ${a.comments.length === 1 ? "comentario" : "comentarios"} junto a cada fragmento.</p><button type="button" class="btn btn-secondary btn-block" data-act="ask-changes" data-id="${a.id}">Pedir cambios</button></div>
            <div class="decide stack"><p class="small"><strong>¿Todo está bien?</strong> ${done ? "La lista está completa. Se pedirá una confirmación antes de publicar." : "Se habilita al completar la lista: falta «" + esc(CHECK[miss]) + "»."}</p><button type="button" class="btn btn-primary btn-block" data-act="approve" data-id="${a.id}" ${done ? "" : "disabled"}>Aprobar y publicar</button></div></section></aside>` : ""}</div>`) };
  } });
  NM.chg.chk = (el) => { const a = NM.article(el.dataset.id); a.check[Number(el.value)] = el.checked; NM.save("articles"); NM.refresh(); };
  NM.act["c-open"] = (el) => {
    const i = el.dataset.id, host = $(`[data-c-form="${i}"]`), sel = window.getSelection() ? window.getSelection().toString().trim() : "";
    const inPara = sel && $(`#pt-${i}`).textContent.includes(sel);
    host.innerHTML = `<form class="stack" data-form="c-add" data-i="${i}" data-frag="${esc(inPara ? sel : "")}" novalidate>${NM.field({ id: "cm-" + i, label: `Comentario${inPara ? ` sobre «${sel.slice(0, 40)}»` : ""}`, type: "textarea", req: true, ph: "Explica qué debe cambiar", rows: 2 })}<div class="btn-row"><button class="btn btn-primary btn-compact" type="submit">Guardar comentario</button><button type="button" class="btn-link" data-act="c-cancel" data-id="${i}">Cancelar</button></div></form>`;
    $("#cm-" + i).focus();
  };
  NM.act["c-cancel"] = (el) => { $(`[data-c-form="${el.dataset.id}"]`).innerHTML = ""; };
  NM.form["c-add"] = (f) => {
    const i = Number(f.dataset.i), t = $("#cm-" + i), a = NM.article(NM.cur().path.split("/").pop()); NM.clr(t);
    if (!t.value.trim()) { NM.err(t, "Escribe qué debe cambiar el autor en este fragmento."); t.focus(); return; }
    const text = a.body[i].p, frag = f.dataset.frag || text.split(/(?<=[.!?])\s/)[0].slice(0, 80);
    a.comments.push({ id: NM.uid(), idx: i, frag, text: t.value.trim() }); NM.save("articles"); $(`[data-c-form="${i}"]`).innerHTML = ""; NM.refresh(); NM.announce("Comentario guardado.");
  };
  NM.act["c-del"] = (el) => { const a = NM.article(NM.cur().path.split("/").pop()), c = a.comments.find((x) => x.id === el.dataset.id); a.comments = a.comments.filter((x) => x.id !== c.id); NM.save("articles"); NM.refresh(); NM.snack("Quitaste el comentario.", { onAction: () => { a.comments.push(c); NM.save("articles"); NM.refresh(); } }); };
  NM.act["ask-changes"] = (el) => {
    const a = NM.article(el.dataset.id), e = $("#cmt-error");
    if (!a.comments.length) { e.hidden = false; e.innerHTML = icon("alert", "icon icon-sm") + "<span>Escribe al menos un comentario para pedir cambios: indica qué debe cambiar el autor.</span>"; return; }
    a.status = "borrador"; NM.addHist(a, revName(), "Cambios solicitados", `${a.comments.length} ${a.comments.length === 1 ? "comentario" : "comentarios"} por fragmento`); NM.save("articles");
    NM.go("/rev"); NM.snack("Devolvimos el artículo a «Borrador» y notificamos al autor con tus comentarios.");
  };
  NM.act.approve = (el) => {
    const a = NM.article(el.dataset.id);
    NM.dialog({ kind: "alert", title: "¿Publicar este artículo?", body: `<div class="stack"><p>Los ${CHECK.length} puntos de la lista están completos. El estado pasará de «En revisión» a «Publicado» y los estudiantes lo verán de inmediato en Aprende.</p><div class="btn-row"><button type="button" class="btn btn-secondary" data-act="dlg-close" style="flex:1">Cancelar</button><button type="button" class="btn btn-primary" data-act="publish" data-id="${a.id}" style="flex:1">Publicar</button></div></div>` });
  };
  NM.act.publish = (el) => {
    const a = NM.article(el.dataset.id); a.status = "publicado"; a.reviewedAt = Date.now(); a.comments = []; NM.addHist(a, revName(), "Publicado", "Aprobado y publicado en Aprende"); NM.save("articles");
    NM.closeDialogs(); NM.go("/rev?t=publicados"); NM.snack(`«${a.title}» está publicado y ya aparece en Aprende.`, { actionLabel: "Ver en Aprende", onAction: () => NM.go("/articulo/" + a.id) });
  };

  /* ---------- Validar etiqueta · US35, US33 ---------- */
  GR("/rev/etiqueta/:id", { view: ({ params }) => {
    const l = NM.labelById(params.id); if (!l) return { redirect: "/rev" };
    const d = l.dish, pending = d.ironStatus === "pendiente";
    const ing = d.ingredients || NM_SEED.ingredients[d.dish] || "", por = d.portion || NM_SEED.portions[d.dish] || "";
    const checks = labelChecks(d), miss = checks.findIndex((c) => !c), done = miss < 0;
    const queue = NM.labels("pendiente"), pos = queue.findIndex((x) => x.id === l.id);
    const fact = (k, v, warn) => `<div class="fact"><dt>${k}</dt><dd>${v ? esc(v) : `<span class="fact-miss">${icon("alert", "icon icon-sm")}${warn}</span>`}</dd></div>`;
    const crit = (c, i) => `<div class="${!done && i === miss ? "check-miss" : ""}"><label class="check"><input type="checkbox" data-chg="lchk" data-id="${esc(l.id)}" value="${i}" ${checks[i] ? "checked" : ""}> ${esc(c)}</label>${i === 0 ? `<p class="hint">Referencia: hierro hemo (sangrecita, hígado, carnes) o no hemo (menestras, espinaca). La app aún no muestra mg por porción: decide según los ingredientes y la porción declarados.</p>` : ""}${i === 1 && !por ? `<p class="hint">El comercio no indicó la porción: no marques este punto; observa la solicitud y pídele que la agregue.</p>` : ""}${!done && i === miss ? `<p class="error-msg">${icon("alert", "icon icon-sm")}<span>Falta este punto para poder aprobar</span></p>` : ""}</div>`;
    return { title: "Validar etiqueta", heading: "Validar etiqueta", sub: `${esc(l.place.name)} · solicitada ${esc(NM.fmtWhen(d.requestedAt || Date.now()))}${pending && pos >= 0 ? ` · ${pos + 1} de ${queue.length} pendientes` : ""}`, back: "/rev?f=etiquetas", wide: true,
      html: split("/rev/etiqueta/" + lid(l), `<form class="narrow stack" data-form="label" data-id="${esc(l.id)}" novalidate><div class="card stack"><h2 class="h3">${esc(d.dish)}</h2>
        <dl class="facts">${fact("Comercio", `${l.place.name} · ${l.place.address}`)}${fact("Ingredientes", ing, "El comercio no indicó ingredientes")}${fact("Porción", por, "El comercio no indicó la porción")}${fact("Precio del menú", NM.priceLabel(l.place))}</dl>
        ${pending ? "" : NM.badge(d.ironStatus === "aprobada" ? "Aprobada" : "Observada", d.ironStatus === "aprobada" ? "success" : "error", true)}</div>
        ${pending ? `<fieldset class="field"><legend>Criterios (marca solo lo que verificaste)</legend>${LABEL_CRIT.map(crit).join("")}</fieldset>
        ${NM.field({ id: "lb-note", label: "Motivo (obligatorio si observas)", type: "textarea", rows: 3, ph: "Explica qué debe corregir el comercio" })}
        <div class="btn-row"><button type="button" class="btn btn-secondary" data-act="label-obs" style="flex:1">Observar</button><button type="submit" class="btn btn-primary" style="flex:1" ${done ? "" : "disabled"}>Aprobar</button></div>
        <p class="hint">${done ? "Antes de activar la etiqueta te pediremos una confirmación." : "«Aprobar» se habilita al marcar los " + LABEL_CRIT.length + " criterios: falta «" + esc(LABEL_CRIT[miss]) + "»."}</p>` : `<p class="muted">${esc(d.note || "")}</p><a class="btn btn-secondary btn-block" href="#/rev?f=etiquetas">Volver a la bandeja</a>`}</form>`) };
  } });
  const labelNow = (f) => NM.labelById(f.dataset.id);
  /* Tras decidir, el revisor pasa a la siguiente solicitud pendiente en vez de volver a la bandeja */
  const nextLabel = () => { const n = NM.labels("pendiente")[0]; NM.go(n ? "/rev/etiqueta/" + lid(n) : "/rev?f=etiquetas"); };
  const snapLabel = (d) => ({ ironStatus: d.ironStatus, note: d.note, iron: d.iron, revCheck: labelChecks(d).slice() });
  const undoLabel = (l, snap) => () => { Object.assign(l.dish, snap); NM.save("places"); NM.go("/rev/etiqueta/" + lid(l)); NM.announce("Deshiciste la decisión; la solicitud vuelve a estar pendiente."); };
  NM.chg.lchk = (el) => { const l = NM.labelById(el.dataset.id); if (!l) return; const c = labelChecks(l.dish).slice(); c[Number(el.value)] = el.checked; l.dish.revCheck = c; NM.save("places"); NM.refresh(); };
  NM.form.label = (f) => {
    const l = labelNow(f); if (!l || labelChecks(l.dish).some((c) => !c)) return;
    NM.dialog({ kind: "alert", title: "¿Activar la etiqueta «Fuente de hierro»?", body: `<div class="stack"><p>Los estudiantes verán la etiqueta en «${esc(l.dish.dish)}» de ${esc(l.place.name)}, en el radar y en la ficha del local, desde ahora.</p><div class="btn-row"><button type="button" class="btn btn-secondary" data-act="dlg-close" style="flex:1">Cancelar</button><button type="button" class="btn btn-primary" data-act="label-approve" data-id="${esc(l.id)}" style="flex:1">Activar etiqueta</button></div></div>` });
  };
  NM.act["label-approve"] = (el) => {
    const l = NM.labelById(el.dataset.id); if (!l) return; const snap = snapLabel(l.dish);
    Object.assign(l.dish, { ironStatus: "aprobada", note: "", iron: true }); NM.save("places"); NM.closeDialogs(); nextLabel();
    NM.snack(`Activamos la etiqueta en «${l.dish.dish}» y notificamos a ${l.place.name}.`, { onAction: undoLabel(l, snap) });
  };
  NM.act["label-obs"] = () => {
    const f = $("[data-form=label]"), n = $("#lb-note"); NM.clr(n);
    if (!n.value.trim()) { NM.err(n, "Escribe el motivo para observar la etiqueta."); n.focus(); return; }
    const l = labelNow(f), snap = snapLabel(l.dish); Object.assign(l.dish, { ironStatus: "observada", note: n.value.trim() }); NM.save("places");
    nextLabel(); NM.snack(`Marcamos la solicitud como observada y enviamos el motivo a ${l.place.name}.${NM.labels("pendiente").length ? " Pasamos a la siguiente solicitud pendiente." : ""}`, { onAction: undoLabel(l, snap) });
  };

  /* ---------- Historial inmutable · US36 ---------- */
  GR("/rev/historial/:id", { view: ({ params }) => {
    const a = NM.article(params.id); if (!a) return { redirect: "/rev" };
    const k = { Publicado: "success", "Cambios solicitados": "warning", "Enviado a revisión": "info" };
    return { title: "Historial de cambios", heading: "Historial de cambios", sub: esc(a.title), back: "/rev/articulo/" + a.id,
      html: `<div class="narrow stack">${NM.alert("info", "", "Registro de solo lectura: no se puede editar ni borrar. Orden: más reciente primero.", "lock")}<ol class="card timeline">${a.history.slice().sort((x, y) => y.ts - x.ts).map((h) => `<li><span class="dot" aria-hidden="true"></span><div>${NM.badge(h.type, k[h.type] || "")}<p><strong>${esc(h.text)}</strong></p><p class="muted small">${esc(NM.fmtDate(h.ts).replace(/ de \d{4}$/, ""))} · ${esc(NM.hm(new Date(h.ts)))} · ${esc(h.author)}</p></div></li>`).join("")}</ol><p class="hint">No hay opciones para editar o eliminar registros.</p></div>` };
  } });

  /* ---------- Contenido y vista del autor · US34 CA03 ---------- */
  GR("/rev/contenido", { view: ({ q }) => {
    const tab = q.t === "publicados" ? "publicados" : "borradores", list = S.articles.filter((a) => a.status === (tab === "publicados" ? "publicado" : "borrador"));
    return { title: "Contenido", heading: "Contenido", sub: "Vista del autor · Equipo NutriMap",
      html: `${NM.tabs([["borradores", `Borradores (${S.articles.filter((a) => a.status === "borrador").length})`, "/rev/contenido"], ["publicados", `Publicados (${S.articles.filter((a) => a.status === "publicado").length})`, "/rev/contenido?t=publicados"]], tab, "Contenido")}
        <div class="stack narrow">${list.length ? list.map((a) => `<a class="card stack inbox-item" href="#/rev/autor/${a.id}"><strong>${esc(a.title)}</strong><span class="row-between">${NM.badge(NM.artStatus(a), a.status === "publicado" ? "success" : "")}${a.comments.length ? NM.badge(a.comments.length + (a.comments.length === 1 ? " comentario" : " comentarios"), "warning") : ""}</span></a>`).join("") : `<div class="empty-state"><h2 class="h3">Sin contenido en esta lista</h2></div>`}</div>` };
  } });
  GR("/rev/autor/:id", { view: ({ params, q }) => {
    const a = NM.article(params.id); if (!a) return { redirect: "/rev/contenido" };
    const edit = q.edit === "1" && a.status === "borrador", last = a.history.slice().reverse().find((h) => h.type === "Cambios solicitados");
    return { title: a.title, heading: a.title, sub: stepper(a), back: "/rev/contenido",
      actions: [`<a class="btn btn-secondary btn-compact" href="#/rev/historial/${a.id}">${icon("history", "icon icon-sm")}Ver historial</a>`],
      html: edit ? `<form class="narrow stack" data-form="art-edit" data-id="${a.id}" novalidate>${a.body.map((s, i) => NM.field({ id: "ed-" + i, label: s.h, type: "textarea", rows: 4, value: s.p })).join("")}<div class="btn-row"><button class="btn btn-primary" type="submit">Guardar cambios</button><a class="btn btn-secondary" href="#/rev/autor/${a.id}">Cancelar</a></div></form>`
        : `<div class="narrow stack"><div class="tags">${NM.badge(NM.artStatus(a), a.status === "publicado" ? "success" : "")}${a.comments.length ? NM.badge(a.comments.length + (a.comments.length === 1 ? " comentario" : " comentarios"), "warning") : ""}</div>
        ${a.comments.length && last ? NM.alert("warning", "El nutricionista pidió cambios", `${esc(NM.fmtWhen(last.ts))} · ${esc(last.author)}`, "msg") : ""}
        ${a.comments.map((c, i) => `<div class="card stack"><p class="muted small">Fragmento ${i + 1}</p><p class="muted">«${esc(c.frag)}»</p><p><strong>${esc(c.text)}</strong></p></div>`).join("")}
        ${!a.comments.length && a.status === "borrador" ? `<p class="muted">Este borrador no tiene comentarios pendientes.</p>` : ""}
        ${a.status === "borrador" ? `<div class="btn-row"><a class="btn btn-secondary" href="#/rev/autor/${a.id}?edit=1" style="flex:1">${icon("edit", "icon icon-sm")}Editar artículo</a><button type="button" class="btn btn-primary" data-act="resubmit" data-id="${a.id}" style="flex:1">Volver a enviar a revisión</button></div>` : `<p class="muted">Solo los borradores se pueden editar y reenviar.</p>`}</div>` };
  } });
  NM.form["art-edit"] = (f) => {
    const a = NM.article(f.dataset.id); a.body.forEach((s, i) => { s.p = $("#ed-" + i).value.trim() || s.p; });
    NM.addHist(a, a.author, "Editado", "Texto actualizado"); NM.save("articles"); NM.go("/rev/autor/" + a.id); NM.snack("Guardamos tus cambios. Cuando termines, vuelve a enviar el artículo a revisión.");
  };
  NM.act.resubmit = (el) => {
    const a = NM.article(el.dataset.id), v = a.history.filter((h) => h.type === "Enviado a revisión").length + 1;
    a.status = "revision"; a.comments = []; a.check = [false, false, false, false]; NM.addHist(a, a.author, "Enviado a revisión", `Versión ${v} enviada`); NM.save("articles");
    NM.go("/rev/contenido"); NM.snack("Enviaste el artículo a revisión. El nutricionista lo verá en su bandeja.");
  };

  GR("/rev/cuenta", { view: () => { const u = NM.user(); return { title: "Cuenta", heading: "Cuenta", sub: "Nutricionista · Bienestar UPC",
    html: `<div class="narrow stack"><div class="card stack"><p><strong>${esc(u.name)}</strong></p><p class="muted">${esc(u.email)}</p></div><a class="btn btn-secondary btn-block" href="../pages/index.html">Ir al sitio de NutriMap</a><button type="button" class="btn btn-danger btn-block" data-act="logout">Cerrar sesión</button></div>` }; } });
  NM.route("/com/cuenta", { guard: (c) => (c.role === "com" ? null : "/acceso-rol?r=com"), view: () => { const u = NM.user(); return { title: "Cuenta", heading: "Cuenta", sub: "Comercio", back: "/com/perfil",
    html: `<div class="narrow stack"><div class="card stack">${NM.myPlace() ? `<p><strong>${esc(NM.myPlace().name)}</strong></p><p class="muted small">Negocio registrado</p>` : ""}<p>${esc(u.name)}</p><p class="muted">${esc(u.email)}</p></div><a class="btn btn-secondary btn-block" href="../pages/index.html">Ir al sitio de NutriMap</a><button type="button" class="btn btn-danger btn-block" data-act="logout">Cerrar sesión</button></div>` }; } });
})();
