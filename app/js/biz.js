/* NutriMap Estudiantil · comercio
   US06 oferta · US07 perfil y vista previa · US28 registro · US29 ubicación · US30 agotado · US31 reportes · US32 visibilidad · US33 etiqueta de hierro */
(function () {
  "use strict";
  const NM = window.NM, S = NM.S, D = window.NM_DATA;
  const { $, $$, esc, money, money2, distLabel, icon } = NM;
  const guard = (ctx) => (ctx.role === "com" ? null : "/acceso-rol?r=com");
  const GR = (path, def) => NM.route(path, Object.assign({ guard }, def));
  const needBiz = () => { const p = NM.myPlace(); return p ? null : "/com/registro"; };
  const needLoc = () => { const p = NM.myPlace(); return !p ? "/com/registro" : !p.located ? "/com/ubicacion" : null; };
  const stockLabel = { disponible: "Hay porciones", pocas: "Pocas porciones", agotado: "Agotado" };

  /* ---------- Registro de negocio · US28 ---------- */
  GR("/com/registro", { view: () => {
    const p = NM.myPlace(), edit = !!p;
    return { title: edit ? "Editar perfil" : "Registrar mi negocio", heading: edit ? "Editar perfil" : "Registrar mi negocio", sub: edit ? esc(p.name) : "Un solo formulario", back: edit ? "/com/perfil" : "/acceso-rol", nav: edit ? "com" : "none",
      html: `<form class="narrow stack" data-form="biz-reg" novalidate><p class="hint">Los campos con <span class="req">*</span> son obligatorios.</p>
        ${NM.field({ id: "bz-name", label: "Nombre del negocio", req: true, value: p ? p.name : "", auto: "organization" })}
        <fieldset class="field" id="bz-type" aria-describedby="bz-type-error"><legend>Tipo de negocio <span class="req" aria-hidden="true">*</span></legend><div class="chip-group">${[["menu", "Restaurante de menú"], ["cafeteria", "Cafetería"], ["mercado", "Puesto de mercado"]].map(([v, l]) => `<label class="chip-radio"><input type="radio" name="btype" value="${v}" ${p && p.type === v ? "checked" : ""}><span>${l}</span></label>`).join("")}</div><p id="bz-type-error" class="error-msg" hidden></p></fieldset>
        ${NM.field({ id: "bz-addr", label: "Dirección", req: true, value: p ? p.address : "", ph: "Ej.: Av. Primavera 1120", auto: "street-address", help: "La usamos para ubicar tu negocio en el mapa." })}
        <div class="row-2">${NM.field({ id: "bz-phone", label: "Teléfono o WhatsApp", req: true, value: p ? p.phone : "", ph: "9XX XXX XXX", type: "tel", inputmode: "tel", auto: "tel" })}${NM.field({ id: "bz-hours", label: "Horario de atención", req: true, value: p ? p.hours : "", ph: "12:00 a 4:00 p. m." })}</div>
        <button class="btn btn-primary btn-block" type="submit">${edit ? "Guardar cambios" : "Registrar negocio"}</button></form>` };
  } });
  NM.form["biz-reg"] = (f) => {
    const name = $("#bz-name"), addr = $("#bz-addr"), ph = $("#bz-phone"), hrs = $("#bz-hours"), tp = $("#bz-type");
    [name, addr, ph, hrs].forEach(NM.clr); tp.removeAttribute("aria-invalid"); $("#bz-type-error").hidden = true;
    const type = ($('input[name="btype"]:checked', f) || {}).value, phone = ph.value.replace(/\s+/g, "");
    if (!name.value.trim()) NM.err(name, "Escribe el nombre de tu negocio.");
    if (!type) { tp.setAttribute("aria-invalid", "true"); $("#bz-type-error").innerHTML = icon("alert", "icon icon-sm") + "<span>Elige el tipo de negocio.</span>"; $("#bz-type-error").hidden = false; }
    if (!addr.value.trim()) NM.err(addr, "La dirección es obligatoria. Escríbela para ubicar tu negocio.");
    if (!phone) NM.err(ph, "Escribe un teléfono o WhatsApp de contacto."); else if (!/^9\d{8}$/.test(phone)) NM.err(ph, "Escribe un celular de 9 dígitos que empiece con 9, por ejemplo 987 654 321.");
    if (!hrs.value.trim()) NM.err(hrs, "Escribe tu horario de atención, por ejemplo 12:00 a 4:00 p. m.");
    if ($('[aria-invalid="true"]', f)) { const first = $('[aria-invalid="true"]', f); (first.tagName === "FIELDSET" ? $("input", first) : first).focus(); return; }
    let p = NM.myPlace();
    if (p) { Object.assign(p, { name: name.value.trim(), type, address: addr.value.trim(), phone, hours: hrs.value.trim() }); NM.save("places"); NM.go("/com/perfil"); NM.snack("Guardamos los datos de tu negocio."); return; }
    let h = 0; for (const c of addr.value) h = (h * 31 + c.charCodeAt(0)) % 997;
    p = { id: "neg-" + NM.uid(), name: name.value.trim(), type, address: addr.value.trim(), phone, hours: hrs.value.trim(), x: 20 + (h % 60), y: 18 + ((h * 7) % 60), price: 0, stock: "disponible", open: true, closesSoon: false, published: false, located: false, noMenuToday: false, owner: S.session, updatedAt: null, firstPublishedAt: null, stats: { visits: 0, routes: 0 },
      menu: [["Entrada", ""], ["Segundo", ""], ["Refresco", ""]].map(([course, dish]) => ({ course, dish, tag: "", iron: false, ironStatus: null, avail: "disponible", note: "", requestedAt: null })) };
    Object.assign(p, NM.calcDist(p.x, p.y)); S.places.push(p); NM.save("places");
    NM.flash = NM.alert("success", "Negocio registrado", "Siguientes pasos: 1) confirma tu ubicación y 2) publica tu menú de hoy.");
    NM.go("/com/ubicacion");
  };

  /* ---------- Ubicación en el mapa · US29 ---------- */
  GR("/com/ubicacion", { guard: (c) => guard(c) || (NM.myPlace() ? null : "/com/registro"), view: () => {
    const p = NM.myPlace();
    return { title: "Ubicación de tu negocio", heading: "Ubicación de tu negocio", sub: p.located ? "Puedes ajustar el punto cuando quieras" : "Paso 1 de 2", back: p.located ? "/com/perfil" : "/com/registro", nav: p.located ? "com" : "none",
      html: `<div class="two-col"><div class="stack">${NM.mapHtml({ you: false, biz: { x: p.x, y: p.y }, h: 300 })}<p class="hint">Ubicamos tu negocio con la dirección. Mueve el punto con los botones; no hace falta arrastrar.</p></div>
        <div class="stack"><div class="move-pad" role="group" aria-label="Mover el punto del negocio"><button type="button" class="icon-btn up" data-act="bmove" data-v="up" aria-label="Mover al norte">${icon("up")}</button><button type="button" class="icon-btn left" data-act="bmove" data-v="left" aria-label="Mover al oeste">${icon("left")}</button><button type="button" class="icon-btn right" data-act="bmove" data-v="right" aria-label="Mover al este">${icon("right")}</button><button type="button" class="icon-btn down" data-act="bmove" data-v="down" aria-label="Mover al sur">${icon("down")}</button></div>
          <div class="card" aria-live="polite" data-bloc></div><button type="button" class="btn btn-primary btn-block" data-act="bconfirm">Confirmar ubicación</button><a class="btn-link center" href="#/com/registro">Volver a los datos</a></div></div>`,
      mount: () => paintLoc() };
  } });
  const paintLoc = () => { const p = NM.myPlace(), b = $("[data-bloc]"); if (b) b.innerHTML = `<strong>${esc(p.address)}</strong><br><span class="muted">Los estudiantes verán: ${distLabel(p.distance)} de ${esc(NM.campus(S.loc.campus).name)} · ${p.walk} min a pie</span>`; const bp = $(".biz-pin"); if (bp) { bp.style.left = p.x + "%"; bp.style.top = p.y + "%"; } };
  NM.act.bmove = (el) => { const p = NM.myPlace(), s = 4, v = el.dataset.v; if (v === "up") p.y = Math.max(6, p.y - s); if (v === "down") p.y = Math.min(94, p.y + s); if (v === "left") p.x = Math.max(6, p.x - s); if (v === "right") p.x = Math.min(94, p.x + s); Object.assign(p, NM.calcDist(p.x, p.y)); NM.save("places"); paintLoc(); };
  NM.act.bconfirm = () => { const p = NM.myPlace(), was = p.located; p.located = true; NM.save("places"); NM.go(was ? "/com/perfil" : "/com/oferta"); NM.snack(was ? "Guardamos la nueva ubicación de tu negocio." : "Ubicación confirmada. Ahora publica tu menú de hoy para aparecer en el radar."); };

  /* ---------- Disponibilidad: una sola fuente de verdad ----------
     Cada plato tiene su disponibilidad; la del menú se deriva de los platos (antes eran dos datos que podían contradecirse). */
  const AVAIL = { disponible: "Disponible", pocas: "Pocas", agotado: "Agotado" };
  const deriveStock = (p) => {
    const ds = p.menu.filter((d) => d.dish);
    if (!ds.length) return "disponible";
    if (ds.every((d) => d.avail === "agotado")) return "agotado";
    return ds.some((d) => d.avail === "pocas") ? "pocas" : "disponible";
  };
  NM.deriveStock = deriveStock;

  /* ---------- Hoy: la tarea diaria del comercio · US30, US06 ---------- */
  GR("/com/hoy", { guard: (c) => guard(c) || needLoc(), view: () => {
    const p = NM.myPlace(), nr = NM.myReports("nuevo").length, dishes = p.menu.map((d, i) => [d, i]).filter(([d]) => d.dish);
    const mine = NM.labels().filter((l) => l.place.id === p.id), obs = mine.filter((l) => l.dish.ironStatus === "observada").length, pend = mine.filter((l) => l.dish.ironStatus === "pendiente").length;
    const reports = nr ? `<a class="notice notice-warning notice-link" href="#/com/reportes">${icon("flag")}<div><p><strong>${nr} ${nr === 1 ? "reporte nuevo" : "reportes nuevos"} de estudiantes</strong></p><p>Revisa si tu ficha tiene un dato equivocado.</p></div>${icon("right")}</a>` : "";
    const status = p.published ? NM.alert("success", "", `Visible en el radar · Actualizado ${esc(NM.fmtWhen(p.updatedAt))}`) : "";
    if (!p.published || !dishes.length) return { title: "Hoy", heading: "Hoy", sub: esc(p.name),
      html: `<div class="narrow stack">${reports}<div class="empty-state">${icon("doc", "icon icon-lg")}<h2 class="h3">Publica tu menú de hoy</h2><p class="muted">Escribe tus platos y el precio. Después, desde aquí marcas lo que se acaba con un toque.</p><a class="btn btn-primary btn-compact" href="#/com/oferta">Escribir mi menú</a></div></div>` };
    const dishCard = ([d, i]) => `<div class="card stack dish-today"><div class="row-between wrap"><p><small class="muted">${esc(d.course)}</small><br><strong>${esc(d.dish)}</strong></p>${d.ironStatus === "aprobada" ? NM.ironBadge() : ""}</div>
      <div class="seg-av" role="group" aria-label="Disponibilidad de ${esc(d.dish)}">${Object.entries(AVAIL).map(([v, l]) => NM.chip(l, d.avail === v, `data-act="dish-av" data-id="${i}" data-v="${v}"`)).join("")}</div></div>`;
    const labelLine = obs ? `${obs} ${obs === 1 ? "etiqueta observada" : "etiquetas observadas"}: revisa el comentario` : pend ? `${pend} en revisión` : "Pide la etiqueta «Fuente de hierro» para tus platos";
    return { title: "Hoy", heading: "Hoy", sub: esc(p.name),
      html: `<div class="narrow stack">${reports}${status}
        <section class="stack" aria-labelledby="hoy-t"><h2 class="h3" id="hoy-t">¿Qué te queda?</h2><p class="hint">Un toque basta: los estudiantes lo ven al instante en el radar.</p>${dishes.map(dishCard).join("")}</section>
        <form class="card stack" data-form="hoy-price" novalidate>${NM.field({ id: "hp-price", label: "Precio del menú (S/)", req: true, value: p.price ? Number(p.price).toFixed(2) : "", inputmode: "decimal", prefix: "S/", help: "Solo números, por ejemplo 10.50." })}<button class="btn btn-secondary btn-block" type="submit">Actualizar precio</button></form>
        <nav class="link-list card" aria-label="Más tareas"><a href="#/com/oferta">${icon("edit", "icon icon-sm")}<span>Cambiar los platos de hoy</span>${icon("right", "icon icon-sm")}</a><a href="#/com/etiquetas">${icon("fe", "icon icon-sm")}<span>Etiquetas de hierro<small class="muted">${esc(labelLine)}</small></span>${icon("right", "icon icon-sm")}</a></nav></div>` };
  } });
  NM.form["hoy-price"] = () => {
    const p = NM.myPlace(), inp = $("#hp-price"), v = NM.parseAmount(inp.value.trim()), before = { price: p.price, updatedAt: p.updatedAt }; NM.clr(inp);
    if (!inp.value.trim()) { NM.err(inp, "Escribe el precio del menú."); inp.focus(); return; }
    if (Number.isNaN(v) || v <= 0) { NM.err(inp, "Escribe solo números, por ejemplo 10.50."); inp.focus(); return; }
    if (v === p.price) { NM.snack("El precio ya era ese; no cambiamos nada."); return; }
    p.price = v; p.updatedAt = Date.now(); NM.save("places"); NM.refresh();
    NM.snack(`Tu menú figura a ${NM.priceLabel(p)} en el radar.`, { onAction: () => { Object.assign(p, before); NM.save("places"); NM.refresh(); } });
  };
  NM.act["dish-av"] = (el) => {
    const p = NM.myPlace(), i = Number(el.dataset.id), d = p.menu[i], before = d.avail, beforeAt = p.updatedAt, v = el.dataset.v; if (before === v) return;
    d.avail = v; p.stock = deriveStock(p); p.updatedAt = Date.now(); NM.save("places"); NM.refresh();
    NM.snack(v === "agotado" ? `«${d.dish}» ahora figura como Agotado en el radar.` : v === "pocas" ? `«${d.dish}» figura con pocas porciones.` : `«${d.dish}» vuelve a estar disponible.`, { onAction: () => { d.avail = before; p.stock = deriveStock(p); p.updatedAt = beforeAt; NM.save("places"); NM.refresh(); } });
  };
  /* Ruta anterior de los mockups (M37): ahora es «Hoy» */
  GR("/com/platos", { view: () => ({ redirect: "/com/hoy" }) });

  /* ---------- Mi menú: platos y precio · US06, US07 ---------- */
  const draftOf = (p) => p.draft && p.draft.dishes ? p.draft : { dishes: p.menu.map((d) => ({ dish: d.dish })), price: p.price || "" };
  GR("/com/oferta", { guard: (c) => guard(c) || needLoc(), view: () => {
    const p = NM.myPlace(), dr = draftOf(p);
    const help = (d, i) => d.ironStatus === "aprobada" ? "Tiene la etiqueta «Fuente de hierro». Si cambias el plato, tendrás que volver a solicitarla." : i === 1 ? "Escribe el plato como lo verá el estudiante" : "";
    return { title: "Mi menú", heading: "Mi menú", sub: esc(p.name),
      actions: [`<button type="button" class="btn btn-secondary btn-compact" data-act="preview">${icon("eye", "icon icon-sm")}Vista previa</button>`],
      html: `<div class="two-col"><form class="stack" data-form="oferta" novalidate>
        ${p.published ? NM.alert("success", "", `Visible en el radar · Última actualización: ${esc(NM.fmtWhen(p.updatedAt))}`) : NM.alert("info", "", "Aún no publicas tu oferta: los estudiantes todavía no te ven en el radar.")}
        <div class="form-alert" data-oferta-alert role="alert" hidden></div>
        <div class="card stack" role="group" aria-labelledby="of-dishes-t"><h2 class="h3" id="of-dishes-t">Platos de hoy</h2>
          ${p.menu.map((d, i) => NM.field({ id: "of-d" + i, label: d.course, value: dr.dishes[i] ? dr.dishes[i].dish : d.dish, req: i === 1, ph: i === 1 ? "Ej.: Lentejas con arroz y huevo" : "Opcional", help: help(d, i) })).join("")}</div>
        ${NM.field({ id: "of-price", label: "Precio del menú (S/)", req: true, value: dr.price !== "" ? Number(dr.price).toFixed(2) : "", inputmode: "decimal", prefix: "S/", help: "Solo números, con hasta 2 decimales (por ejemplo 10.50)." })}
        <div class="btn-row"><button type="button" class="btn btn-secondary" data-act="draft" style="flex:1">Guardar borrador</button><button type="submit" class="btn btn-primary" style="flex:1">Publicar</button></div>
        <p class="hint kbd-hint">Atajo: Ctrl + Enter para publicar.</p></form>
        <aside class="stack"><nav class="link-list card" aria-label="Otras tareas"><a href="#/com/hoy">${icon("home", "icon icon-sm")}<span>Marcar platos agotados</span>${icon("right", "icon icon-sm")}</a><a href="#/com/etiquetas">${icon("fe", "icon icon-sm")}<span>Etiquetas de hierro</span>${icon("right", "icon icon-sm")}</a><a href="#/com/ubicacion">${icon("pin", "icon icon-sm")}<span>Ajustar mi ubicación</span>${icon("right", "icon icon-sm")}</a></nav></aside></div>`,
      mount: () => { const f = $("[data-form=oferta]"); f.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); f.requestSubmit(); } }); } };
  } });
  const readOferta = (p) => ({ dishes: p.menu.map((d, i) => ({ dish: $("#of-d" + i).value.trim() })), price: $("#of-price").value.trim() });
  NM.act.draft = () => { const p = NM.myPlace(); p.draft = readOferta(p); NM.save("places"); NM.snack("Guardamos tu borrador. Los estudiantes aún ven la oferta anterior."); };
  NM.form.oferta = (f) => {
    const p = NM.myPlace(), r = readOferta(p), second = $("#of-d1"), price = $("#of-price"), al = $("[data-oferta-alert]");
    [second, price].forEach(NM.clr); al.hidden = true;
    if (!r.dishes[1].dish) NM.err(second, "Escribe el plato de fondo; es lo primero que ven los estudiantes.");
    const v = NM.parseAmount(r.price);
    if (!r.price) NM.err(price, "Escribe el precio del menú."); else if (Number.isNaN(v) || v <= 0) NM.err(price, "Escribe solo números, por ejemplo 10.50.");
    if ($('[aria-invalid="true"]', f)) { al.hidden = false; al.textContent = "No se publicaron los cambios. Corrige los campos marcados."; NM.firstInvalid(f); return; }
    p.menu.forEach((d, i) => {
      const name = r.dishes[i].dish;
      /* La etiqueta se aprobó para un plato concreto: si el plato cambia, se retira y hay que volver a solicitarla */
      if (name !== d.dish && d.ironStatus) Object.assign(d, { iron: false, ironStatus: null, note: "", requestedAt: null, revCheck: null, ingredients: "", portion: "" });
      if (name !== d.dish) d.avail = "disponible";
      d.dish = name;
    });
    p.price = v; p.stock = deriveStock(p); p.open = true; p.published = true; p.noMenuToday = false; p.updatedAt = Date.now(); p.firstPublishedAt = p.firstPublishedAt || Date.now(); p.draft = null; NM.save("places");
    NM.flash = NM.alert("success", "Cambios publicados", `Última actualización: ${esc(NM.fmtWhen(p.updatedAt))}. Tu menú ya aparece en el radar.`);
    NM.go("/com/hoy");
    NM.snack("Cambios publicados. Tu menú ya aparece en el radar.", { actionLabel: "Ver como estudiante", onAction: () => NM.go("/local/" + p.id) });
  };
  NM.act.preview = () => {
    const p = NM.myPlace(), dr = $("[data-form=oferta]") ? readOferta(p) : draftOf(p), v = NM.parseAmount(String(dr.price)), prev = Object.assign({}, p, { price: Number.isNaN(v) ? 0 : v, menu: p.menu.map((d, i) => Object.assign({}, d, { dish: dr.dishes[i].dish || d.dish })) });
    NM.dialog({ title: "Vista previa", sub: "Así te verán los estudiantes", body: `<div class="stack"><div class="card place"><div class="place-thumb" aria-hidden="true">${icon(NM.typeIcon(prev.type))}</div><div class="place-main"><h3>${esc(prev.name)}</h3><p class="place-meta">${esc(NM.typeLabel(prev.type))} · <strong>${prev.price ? esc(NM.priceLabel(prev)) : "Precio por definir"}</strong> · ${distLabel(prev.distance)} · ${prev.walk} min a pie</p><div class="tags">${NM.placeBadges(prev)}</div></div></div>
      <ul class="menu-today card">${prev.menu.filter((m) => m.dish).map((m) => `<li><span><small>${esc(m.course)}</small>${esc(m.dish)}</span><span class="tags">${NM.dishTag(m)}</span></li>`).join("") || '<li class="muted">Aún no escribiste platos.</li>'}</ul><p class="hint">${esc(p.address)} · ${esc(p.hours)}</p><button type="button" class="btn btn-secondary btn-block" data-act="dlg-close">Cerrar vista previa</button></div>` });
  };

  /* ---------- Perfil público · US07, US32 ---------- */
  GR("/com/perfil", { guard: (c) => guard(c) || needLoc(), view: () => {
    const p = NM.myPlace(), nr = NM.myReports("nuevo").length, hasStats = p.published && p.firstPublishedAt && Date.now() - p.firstPublishedAt >= 7 * 864e5;
    return { title: "Perfil público", heading: "Perfil público", sub: "Así te ven los estudiantes", wide: true,
      actions: [`<button type="button" class="btn btn-secondary btn-compact" data-act="preview">${icon("eye", "icon icon-sm")}Vista previa</button>`],
      html: `<div class="grid-2"><div class="stack"><div class="card place"><div class="place-thumb" aria-hidden="true">${icon(NM.typeIcon(p.type))}</div><div class="place-main"><h2 class="h3">${esc(p.name)}</h2><p class="place-meta">${esc(NM.typeLabel(p.type))} · <strong>${p.published ? esc(NM.priceLabel(p)) : "Sin oferta publicada"}</strong> · ${distLabel(p.distance)} de ${esc(NM.campus(S.loc.campus).name)}</p><div class="tags">${NM.placeBadges(p)}</div>${p.published ? `<p class="place-upd">${icon("clock", "icon icon-sm")}${esc(NM.updLabel(p))}</p>` : ""}</div></div>
        ${p.published ? `<ul class="menu-today card">${p.menu.filter((m) => m.dish).map((m) => `<li><span><small>${esc(m.course)}</small>${esc(m.dish)}</span><span class="tags">${NM.dishTag(m)}</span></li>`).join("")}</ul>` : ""}
        <div class="card stack"><p class="muted small">Dirección y horario</p><p><strong>${esc(p.address)}</strong></p><p><strong>${esc(p.hours)}</strong></p><p class="muted">Contacto: WhatsApp ${esc(p.phone)}</p><div class="btn-row"><a class="btn btn-secondary btn-compact" href="#/com/registro">Editar perfil</a><a class="btn btn-secondary btn-compact" href="#/com/ubicacion">Ajustar ubicación</a><a class="btn-link" href="#/local/${p.id}">Ver como estudiante</a><a class="btn-link" href="#/com/cuenta">Cuenta y cerrar sesión</a></div></div></div>
        <div class="stack"><section class="card stack" aria-labelledby="vis-t"><div class="row-between"><h2 class="h3" id="vis-t">Visibilidad · últimos 7 días</h2><span class="muted small">Datos agregados</span></div>${hasStats ? `<div class="stats"><div class="stat"><strong>${p.stats.visits}</strong><span>visitas a la ficha</span></div><div class="stat"><strong>${p.stats.routes}</strong><span>usaron «Cómo llegar»</span></div></div><p class="hint">No identificamos a ningún estudiante.</p>` : `<p class="muted">Aún no hay datos. Los verás después de tu primera semana publicada.</p>`}<a href="#/com/visibilidad">Ver visibilidad ›</a></section>
        <section class="card stack" aria-labelledby="rp-t"><div class="row-between"><h2 class="h3" id="rp-t">Reportes de estudiantes</h2>${nr ? NM.badge(nr + (nr === 1 ? " nuevo" : " nuevos"), "warning") : NM.badge("Sin reportes nuevos", "success")}</div><a href="#/com/reportes">Revisar reportes ›</a></section>
        <section class="card stack"><h2 class="h3">Etiquetas de hierro</h2><p class="muted">${NM.labels("pendiente").filter((l) => l.place.id === p.id).length} pendientes · ${NM.labels("aprobada").filter((l) => l.place.id === p.id).length} aprobadas</p><a href="#/com/etiquetas">Ver estado de mis etiquetas ›</a></section></div></div>` };
  } });

  GR("/com/visibilidad", { guard: (c) => guard(c) || needLoc(), view: () => {
    const p = NM.myPlace(), ok = p.published && p.firstPublishedAt && Date.now() - p.firstPublishedAt >= 7 * 864e5;
    return { title: "Visibilidad", heading: "Visibilidad", sub: esc(p.name), back: "/com/perfil",
      html: ok ? `<div class="narrow stack"><div class="stats"><div class="stat"><strong>${p.stats.visits}</strong><span>estudiantes vieron tu ficha</span></div><div class="stat"><strong>${p.stats.routes}</strong><span>pidieron cómo llegar</span></div></div><p class="muted">Datos de la última semana, agregados: no identificamos a ningún estudiante.</p></div>`
        : `<div class="empty-state narrow">${icon("eye", "icon icon-lg")}<h2 class="h3">Aún no hay datos</h2><p class="muted">${p.published ? "Registraste tu negocio hace poco." : "Todavía no publicas tu oferta."} Verás cuántos estudiantes vieron tu ficha y pidieron cómo llegar después de tu primera semana publicada. Los datos se muestran agregados, sin identificar a nadie.</p>${p.published ? "" : '<a class="btn btn-primary btn-compact" href="#/com/oferta">Publicar mi menú de hoy</a>'}</div>` };
  } });

  /* ---------- Reportes recibidos · US31 ---------- */
  GR("/com/reportes", { guard: (c) => guard(c) || needLoc(), view: ({ q }) => {
    const tab = q.t === "cerrados" ? "cerrados" : "nuevos", p = NM.myPlace();
    const list = NM.myReports(tab === "nuevos" ? "nuevo" : "cerrado").sort((a, b) => b.at - a.at);
    const pub = (r) => ({ precio: NM.priceLabel(p), horario: p.hours, disponibilidad: stockLabel[p.stock], ubicacion: p.address }[r.type]);
    const st = { corregido: NM.badge("Corregido", "success"), "no-aplica": NM.badge("No aplica") };
    return { title: "Reportes de estudiantes", heading: "Reportes de estudiantes", sub: esc(p.name),
      html: `${NM.tabs([["nuevos", `Nuevos (${NM.myReports("nuevo").length})`, "/com/reportes"], ["cerrados", `Cerrados (${NM.myReports("cerrado").length})`, "/com/reportes?t=cerrados"]], tab, "Reportes")}
        <div class="stack narrow">${list.length ? list.map((r) => `<div class="card stack"><div class="row-between wrap">${NM.badge(NM.REPORT_TYPES[r.type])}${tab === "nuevos" ? NM.badge("Nuevo", "warning", true) : st[r.status] || ""}</div><p><strong>Valor reportado: ${esc(r.value)}</strong></p>${r.note ? `<p class="muted">«${esc(r.note)}»</p>` : ""}<p class="muted small">${esc(NM.fmtWhen(r.at))} · Publicado: ${esc(pub(r))}</p>
          ${tab === "nuevos" ? `<div class="btn-row"><button type="button" class="btn btn-secondary btn-compact" data-act="rep-na" data-id="${r.id}">No aplica</button><button type="button" class="btn btn-primary btn-compact" data-act="rep-fix" data-id="${r.id}">Corregir dato</button></div>` : ""}</div>`).join("")
          : `<div class="empty-state">${icon("flag", "icon icon-lg")}<h2 class="h3">${tab === "nuevos" ? "No tienes reportes nuevos" : "Aún no cerraste reportes"}</h2><p class="muted">Cuando un estudiante reporte un dato de tu ficha, lo verás aquí y te avisaremos.</p></div>`}
        ${tab === "nuevos" && list.length ? `<p class="hint">«Corregir dato» actualiza tu ficha y cierra el reporte. «No aplica» lo cierra sin cambiar la ficha.</p>` : ""}</div>` };
  } });
  NM.act["rep-na"] = (el) => { const r = S.reports.find((x) => x.id === el.dataset.id); r.status = "no-aplica"; NM.save("reports"); NM.refresh(); NM.snack("Reporte cerrado como «No aplica». Tu ficha no cambió.", { onAction: () => { r.status = "nuevo"; NM.save("reports"); NM.refresh(); } }); };
  NM.act["rep-fix"] = (el) => {
    const r = S.reports.find((x) => x.id === el.dataset.id), p = NM.myPlace();
    if (r.type === "ubicacion") { r.status = "corregido"; NM.save("reports"); NM.go("/com/ubicacion"); NM.snack("Ajusta el punto y confirma la ubicación; el reporte quedó cerrado."); return; }
    const field = r.type === "precio" ? NM.field({ id: "fx-v", label: "Precio correcto (S/)", req: true, value: p.price, inputmode: "decimal", prefix: "S/", help: "Solo números, por ejemplo 10.50." })
      : r.type === "horario" ? NM.field({ id: "fx-v", label: "Horario correcto", req: true, value: p.hours })
      : `<fieldset class="field"><legend>Disponibilidad correcta</legend><div class="chip-group">${Object.entries(stockLabel).map(([v, l]) => `<label class="chip-radio"><input type="radio" name="fxs" value="${v}" ${p.stock === v ? "checked" : ""}><span>${l}</span></label>`).join("")}</div></fieldset>`;
    NM.dialog({ title: "Corregir dato", sub: `${NM.REPORT_TYPES[r.type]} reportado: ${r.value}`, focus: "#fx-v, input[name=fxs]", body: `<form class="stack" data-form="rep-fix" data-id="${r.id}" novalidate>${field}<div class="btn-row"><button type="button" class="btn btn-secondary" data-act="dlg-close" style="flex:1">Cancelar</button><button type="submit" class="btn btn-primary" style="flex:1">Guardar y cerrar reporte</button></div></form>` });
  };
  NM.form["rep-fix"] = (f) => {
    const r = S.reports.find((x) => x.id === f.dataset.id), p = NM.myPlace(), inp = $("#fx-v");
    if (r.type === "precio") { const v = NM.parseAmount(inp.value); NM.clr(inp); if (Number.isNaN(v) || v <= 0) { NM.err(inp, "Escribe solo números, por ejemplo 10.50."); inp.focus(); return; } p.price = v; }
    else if (r.type === "horario") { NM.clr(inp); if (!inp.value.trim()) { NM.err(inp, "Escribe el horario correcto."); inp.focus(); return; } p.hours = inp.value.trim(); }
    else { const v = $('input[name="fxs"]:checked', f).value; p.menu.forEach((d) => { if (d.dish) d.avail = v; }); p.stock = deriveStock(p); }
    r.status = "corregido"; p.updatedAt = Date.now(); NM.save("reports", "places"); NM.closeDialogs(); NM.refresh();
    NM.snack("Actualizamos tu ficha y cerramos el reporte.");
  };

  /* ---------- Etiquetas de hierro: estado y solicitud · US33 ----------
     La solicitud vive aquí y no en el menú diario: se pide pocas veces y necesita ingredientes y porción. */
  GR("/com/etiquetas", { guard: (c) => guard(c) || needLoc(), view: () => {
    const p = NM.myPlace(), k = { aprobada: "success", pendiente: "warning", observada: "error" }, lb = { aprobada: "Aprobada", pendiente: "En revisión", observada: "Observada" };
    const reqForm = (d, i) => `<form class="stack" data-form="lab-req" data-i="${i}" novalidate>${d.ironStatus === "observada" ? NM.alert("warning", "Comentario del revisor", esc(d.note || "sin comentario"), "msg") : ""}
      ${NM.field({ id: "lr-g" + i, label: "Ingredientes", req: true, value: d.ingredients || NM_SEED.ingredients[d.dish] || "", ph: "Ej.: lentejas, arroz, huevo, cebolla" })}
      ${NM.field({ id: "lr-p" + i, label: "Porción", req: true, value: d.portion || NM_SEED.portions[d.dish] || "", ph: "Ej.: 1 plato · 150 g de lentejas", help: "Indica el tamaño del plato y la cantidad del ingrediente con hierro." })}
      <button class="btn btn-primary btn-block" type="submit">${d.ironStatus === "observada" ? "Volver a solicitar" : "Solicitar etiqueta"}</button></form>`;
    const card = ([d, i]) => {
      const head = `<div class="row-between wrap"><p><small class="muted">${esc(d.course)}</small><br><strong>${esc(d.dish)}</strong></p>${d.ironStatus ? NM.badge(lb[d.ironStatus], k[d.ironStatus], true) : ""}</div>`;
      if (d.ironStatus === "aprobada") return `<div class="card stack">${head}<p class="muted">Visible para los estudiantes en el radar y en tu ficha.</p></div>`;
      if (d.ironStatus === "pendiente") return `<div class="card stack">${head}<p class="muted">Enviada ${esc(NM.fmtWhen(d.requestedAt))} · un nutricionista la está revisando.</p></div>`;
      if (d.ironStatus === "observada") return `<div class="card stack">${head}${reqForm(d, i)}</div>`;
      return `<details class="card lab-ask"><summary>${head}<span class="link-like">Solicitar etiqueta para este plato</span></summary>${reqForm(d, i)}</details>`;
    };
    const dishes = p.menu.map((d, i) => [d, i]).filter(([d]) => d.dish);
    return { title: "Etiquetas de hierro", heading: "Etiquetas de hierro", sub: esc(p.name), back: "/com/hoy",
      html: `<div class="narrow stack">${NM.alert("info", "", "Pide la etiqueta solo para platos con una fuente de hierro (sangrecita, hígado, menestras, espinaca…). Un nutricionista la revisa y recién entonces la ven los estudiantes.")}
        ${dishes.length ? dishes.map(card).join("") : `<div class="empty-state"><h2 class="h3">Aún no tienes platos</h2><p class="muted">Escribe tu menú de hoy para pedir etiquetas.</p><a class="btn btn-primary btn-compact" href="#/com/oferta">Escribir mi menú</a></div>`}</div>` };
  } });
  NM.form["lab-req"] = (f) => {
    const i = Number(f.dataset.i), p = NM.myPlace(), d = p.menu[i], g = $("#lr-g" + i), por = $("#lr-p" + i); [g, por].forEach(NM.clr);
    if (!g.value.trim()) NM.err(g, "Escribe los ingredientes: el nutricionista los necesita para revisar.");
    if (!por.value.trim()) NM.err(por, "Escribe la porción, por ejemplo «1 plato · 150 g de lentejas».");
    if ($('[aria-invalid="true"]', f)) { NM.firstInvalid(f); return; }
    Object.assign(d, { ingredients: g.value.trim(), portion: por.value.trim(), iron: true, ironStatus: "pendiente", requestedAt: Date.now(), note: "", revCheck: null });
    NM.save("places"); NM.refresh(); NM.snack(`Enviamos «${d.dish}» a revisión. Te avisaremos cuando un nutricionista responda.`);
  };
})();
