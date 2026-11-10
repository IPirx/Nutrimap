/* NutriMap Estudiantil · cuenta y acceso
   US11 registro · US12 inicio de sesión · US13 recuperar contraseña · US48 consentimiento · acceso por rol (comercio y nutricionista) */
(function () {
  "use strict";
  const NM = window.NM, S = NM.S, D = window.NM_DATA;
  const { $, $$, esc, icon } = NM;
  const passField = (id, label, extra = {}) => NM.field(Object.assign({ id, label, type: "password", req: true, auto: extra.auto || "current-password", suffixBtn: `<button type="button" class="btn-link" data-act="toggle-pass" data-v="${id}" aria-pressed="false">Mostrar</button>` }, extra));
  const rulesHtml = (id) => `<ul class="pass-rules" id="${id}" aria-label="Requisitos de la contraseña"><li data-rule="len">8 o más caracteres</li><li data-rule="letter">Letras</li><li data-rule="digit">Números</li></ul>`;
  NM.act["toggle-pass"] = (el) => { const i = $("#" + el.dataset.v), show = i.type === "password"; i.type = show ? "text" : "password"; el.textContent = show ? "Ocultar" : "Mostrar"; el.setAttribute("aria-pressed", String(show)); i.focus(); };
  const paintRules = (id, val) => $$(`#${id} li`).forEach((li) => { const ok = NM.pwRules[li.dataset.rule](val); li.classList.toggle("is-ok", ok); li.dataset.mark = ok ? "✓" : "✕"; });
  NM.inp["pw-reg"] = (el) => paintRules("reg-rules", el.value);
  NM.inp["pw-new"] = (el) => paintRules("new-rules", el.value);
  const afterLogin = (u, next) => {
    const home = NM.home(u.role);
    NM.go(next && next.startsWith("/") && (u.role === "est" || next.startsWith(u.role === "com" ? "/com" : "/rev")) ? next : home);
    /* Los reportes nuevos del comercio se muestran como aviso fijo en «Hoy», no como snackbar que tapa el formulario */
  };

  /* ---------- Elegir rol al abrir la app ---------- */
  const ROLE_DEST = { est: "/inicio", com: "/acceso-rol?r=com", rev: "/acceso-rol?r=rev" };
  NM.route("/rol", { view: () => {
    const tile = (r, ic, t, s) => `<a class="card role" href="#${ROLE_DEST[r]}" data-act="pick-role" data-v="${r}">${icon(ic)}<span><strong>${t}</strong><br><span class="muted small">${s}</span></span>${icon("right", "icon icon-sm")}</a>`;
    return { title: "¿Quién eres?", heading: "¿Cómo vas a usar NutriMap?", sub: "Elige tu rol para ver lo que necesitas", nav: "none",
      html: `<div class="narrow stack">${tile("est", "user", "Soy estudiante", "Encuentra comida cercana, planifica tu semana y cuida tu gasto")}${tile("com", "shop", "Soy comercio", "Publica tu menú, precios y disponibilidad")}${tile("rev", "learn", "Soy nutricionista", "Revisa contenido y valida etiquetas de hierro")}
        <p class="muted small center">Podrás cambiar de rol cerrando sesión o desde «Cambiar rol» en el pie de página.</p></div>` };
  } });
  NM.act["pick-role"] = (el) => { const r = el.dataset.v; S.entry = r; NM.save("entry"); NM.go(ROLE_DEST[r] || "/inicio"); };
  NM.act["change-role"] = () => { S.entry = null; NM.save("entry"); NM.go("/rol"); };

  /* ---------- Registro de estudiante · US11, US48 ---------- */
  NM.route("/registro", { view: () => ({
    title: "Crear cuenta", heading: "Crear cuenta", back: "/inicio", nav: "none",
    html: `<form class="narrow stack" data-form="register" novalidate>
      ${NM.field({ id: "rg-name", label: "Nombre completo", req: true, auto: "name" })}
      ${NM.field({ id: "rg-email", label: "Correo electrónico", req: true, type: "email", auto: "email", ph: "nombre@upc.edu.pe" })}
      <div class="btn-row dup" data-dup hidden><a href="#/ingresar" class="btn-link">Iniciar sesión</a><a href="#/recuperar" class="btn-link">Recuperar contraseña</a></div>
      ${passField("rg-pass", "Contraseña", { auto: "new-password", extra: 'data-inp="pw-reg"' })}${rulesHtml("reg-rules")}
      ${NM.field({ id: "rg-campus", label: "Campus", req: true, type: "select", options: D.campuses.map((c) => `<option value="${c.id}" ${c.id === S.loc.campus ? "selected" : ""}>${esc(c.name)}</option>`).join("") })}
      <div class="field"><label class="check"><input type="checkbox" id="rg-consent" aria-describedby="rg-consent-error"><span>Acepto la política de privacidad y el uso de mis datos personales para el servicio (Ley N.° 29733). <span class="req" aria-hidden="true">*</span></span></label><p id="rg-consent-error" class="error-msg" hidden></p></div>
      <button class="btn btn-primary btn-block" type="submit">Crear cuenta</button><p class="center">¿Ya tienes cuenta? <a href="#/ingresar">Iniciar sesión</a></p></form>`
  }) });
  NM.form.register = async (f) => {
    const name = $("#rg-name"), email = $("#rg-email"), pass = $("#rg-pass"), cons = $("#rg-consent");
    [name, email, pass, cons].forEach(NM.clr); $("[data-dup]").hidden = true;
    const e = email.value.trim().toLowerCase();
    if (!name.value.trim()) NM.err(name, "Escribe tu nombre completo.");
    if (!e) NM.err(email, "Escribe tu correo electrónico."); else if (!NM.EMAIL_RE.test(e)) NM.err(email, "Escribe un correo válido, por ejemplo nombre@upc.edu.pe.");
    else if (S.users[e]) { NM.err(email, "Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña."); $("[data-dup]").hidden = false; }
    if (!NM.pwOk(pass.value)) NM.err(pass, "La contraseña debe tener 8 o más caracteres, con letras y números.");
    if (!cons.checked) NM.err(cons, "Debes aceptar la política de privacidad para crear la cuenta.");
    if (NM.firstInvalid(f)) return;
    S.users[e] = { name: name.value.trim(), hash: await NM.hash(e + ":" + pass.value), campus: $("#rg-campus").value, role: "est", consentAt: new Date().toISOString() };
    S.session = e; S.loc.campus = $("#rg-campus").value; NM.save("users", "session", "loc");
    NM.go("/inicio"); NM.snack("Tu cuenta está lista. Guardaremos tu plan y tus favoritos.");
  };

  /* ---------- Inicio de sesión · US12 ---------- */
  let lockTimer = null;
  const lockLeft = () => Math.ceil((S.lock.until - Date.now()) / 1000);
  function lockMsg() {
    const al = $("[data-login-alert]"); if (!al) return false;
    const left = lockLeft(), fmt = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
    if (left > 0) {
      if (!al.dataset.locked) { al.hidden = false; al.dataset.locked = "1"; al.className = "form-alert"; al.setAttribute("role", "alert"); al.innerHTML = `Por seguridad bloqueamos el acceso durante 15 minutos tras 5 intentos fallidos. Podrás intentarlo de nuevo a las ${NM.hm(new Date(S.lock.until))} (<span data-left aria-hidden="true">${fmt(left)}</span>). Si olvidaste tu contraseña, <a href="#/recuperar">recupérala</a>.`; }
      else { const s = $("[data-left]", al); if (s) s.textContent = fmt(left); }
      clearTimeout(lockTimer); lockTimer = setTimeout(lockMsg, 1000); return true;
    }
    if (al.dataset.locked) { delete al.dataset.locked; S.lock = { count: 0, until: 0 }; NM.save("lock"); al.className = "form-alert is-info"; al.textContent = "Ya puedes volver a intentarlo."; }
    return false;
  }
  const loginForm = (role) => `<form class="narrow stack" data-form="login" data-role="${role}" novalidate>
      <div class="form-alert" data-login-alert role="alert" hidden></div>
      ${NM.field({ id: "lg-email", label: role === "com" ? "Correo del negocio" : role === "rev" ? "Correo institucional" : "Correo electrónico", req: true, type: "email", auto: "email", ph: role === "com" ? "tunegocio@correo.pe" : role === "rev" ? "nombre@upc.edu.pe" : "" })}
      ${passField("lg-pass", "Contraseña")}
      ${role === "est" ? `<a class="btn-link" href="#/recuperar">¿Olvidaste tu contraseña?</a>` : ""}
      <button class="btn btn-primary btn-block" type="submit">Ingresar</button><p class="hint">Tras 5 intentos fallidos, el acceso se bloquea durante 15 minutos para proteger tu cuenta.</p></form>`;
  NM.route("/ingresar", { view: ({ q }) => ({
    title: "Iniciar sesión", heading: "Inicia sesión", back: "/inicio", nav: "none",
    html: `${loginForm("est")}<div class="narrow stack"><p class="center">¿No tienes cuenta? <a href="#/registro">Crear cuenta</a></p><a class="btn btn-secondary btn-block" href="#/acceso-rol">Soy comercio o nutricionista</a><div class="card demo-box"><p class="small"><strong>Cuenta de demostración</strong> (contraseña <code>Demo1234</code>)</p><ul class="small"><li><code>estudiante@demo.pe</code> · estudiante de ejemplo</li></ul></div></div>`,
    mount: () => { $("[data-form=login]").dataset.next = q.next || ""; if (S.lock.until > Date.now()) lockMsg(); }
  }) });
  NM.route("/acceso-rol", { view: ({ q }) => {
    const rol = q.r === "rev" ? "rev" : q.r === "com" ? "com" : null;
    const tile = (r, ic, t, s) => `<a class="card role${rol === r ? " on" : ""}" href="#/acceso-rol?r=${r}" ${rol === r ? 'aria-current="true"' : ""}>${icon(ic)}<span><strong>${t}</strong><br><span class="muted small">${s}</span></span>${icon("right", "icon icon-sm")}</a>`;
    const head = rol === "com" ? "Acceso para comercios" : rol === "rev" ? "Acceso para nutricionistas" : "Acceso por rol";
    const intro = rol === "com" ? "Entra con la cuenta de tu negocio para publicar tu menú, tus precios y tu disponibilidad." : rol === "rev" ? "Entra con tu cuenta institucional para revisar artículos y validar etiquetas de hierro." : "Elige tu rol para entrar con tu cuenta institucional.";
    return { title: head, heading: head, back: "/ingresar", nav: "none",
      html: `<div class="narrow stack"><p class="muted">${intro}</p>${tile("com", "shop", "Soy comercio", "Publica tu menú, precios y disponibilidad")}${tile("rev", "learn", "Soy nutricionista", "Revisa contenido y etiquetas")}
        ${rol ? loginForm(rol) : ""}
        <div class="card demo-box"><p class="small"><strong>Cuentas de demostración</strong> (contraseña <code>Demo1234</code>)</p><ul class="small">${rol !== "rev" ? `<li><code>dona.rosa@demo.pe</code> · Menú Doña Rosa, con oferta, reportes y etiquetas</li><li><code>nuevo.comercio@demo.pe</code> · comercio sin negocio registrado</li><li><code>sangrecita.lucho@demo.pe</code> · Sangrecita Don Lucho</li>` : ""}${rol !== "com" ? `<li><code>nutri@upc.edu.pe</code> · nutricionista revisora</li>` : ""}</ul></div>
        <a class="btn-link center" href="#/ingresar">Volver a estudiante</a></div>`,
      mount: () => { const f = $("[data-form=login]"); if (f) { f.dataset.next = q.next || ""; if (S.lock.until > Date.now()) lockMsg(); } }
    };
  } });
  NM.form.login = async (f) => {
    if (lockMsg()) return;
    const email = $("#lg-email"), pass = $("#lg-pass"), al = $("[data-login-alert]"), role = f.dataset.role;
    [email, pass].forEach(NM.clr); al.hidden = true;
    const e = email.value.trim().toLowerCase();
    if (!e) NM.err(email, "Escribe tu correo electrónico."); else if (!NM.EMAIL_RE.test(e)) NM.err(email, "Escribe un correo válido, por ejemplo nombre@upc.edu.pe.");
    if (!pass.value) NM.err(pass, "Escribe tu contraseña.");
    if (NM.firstInvalid(f)) return;
    const u = S.users[e], ok = u && u.hash === (await NM.hash(e + ":" + pass.value)) && (role === "est" || u.role === role);
    if (!ok) {
      S.lock.count++; if (S.lock.count >= 5) { S.lock.until = Date.now() + 15 * 60000; S.lock.count = 0; } NM.save("lock");
      if (lockMsg()) return;
      al.hidden = false; al.className = "form-alert"; al.removeAttribute("data-locked");
      al.textContent = "Correo o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo." + (S.lock.count >= 3 ? ` Te quedan ${5 - S.lock.count} intentos antes de un bloqueo de 15 minutos.` : "");
      pass.value = ""; pass.focus(); return;
    }
    S.lock = { count: 0, until: 0 }; S.session = e; NM.save("lock", "session");
    afterLogin(Object.assign({ email: e }, u), f.dataset.next);
  };

  /* ---------- Recuperar contraseña · US13 ---------- */
  const EXP = 30 * 60000;
  NM.route("/recuperar", { view: () => {
    const rc = S.recovery, sent = !!rc;
    return { title: "Recuperar contraseña", heading: "Recuperar contraseña", back: "/ingresar", nav: "none",
      html: `<div class="narrow stack"><p class="muted">Escribe el correo con el que te registraste y te enviaremos un enlace para crear una contraseña nueva.</p>
        <form class="stack" data-form="recover" novalidate>${NM.field({ id: "rc-email", label: "Correo electrónico", req: true, type: "email", auto: "email", value: rc ? rc.email : "" })}${sent ? "" : `<button class="btn btn-primary btn-block" type="submit">Enviar enlace</button>`}</form>
        ${sent ? `${NM.alert("success", "Enlace enviado", "Revisa tu bandeja de entrada y la carpeta de spam. El enlace vence en 30 minutos.")}
          <button type="button" class="btn btn-secondary btn-block" data-act="resend" data-resend disabled>Reenviar enlace</button>
          <div class="card demo-box"><p class="small"><strong>Demostración:</strong> no enviamos correos reales. Usa estos botones para simular lo que pasa al abrir el enlace.</p><div class="btn-row"><a class="btn btn-secondary btn-compact" href="#/restablecer">Abrir el enlace</a><button type="button" class="btn-link" data-act="expire">Abrir un enlace vencido</button></div></div>` : ""}
        <a class="btn-link center" href="#/ingresar">Volver a iniciar sesión</a></div>`,
      mount: () => {
        if (!sent) return;
        const b = $("[data-resend]"), tick = () => { const left = Math.ceil((rc.sentAt + 45000 - Date.now()) / 1000); if (left > 0) { b.disabled = true; b.textContent = `Reenviar enlace (disponible en 0:${String(left).padStart(2, "0")})`; } else { b.disabled = false; b.textContent = "Reenviar enlace"; } };
        tick(); const t = setInterval(tick, 1000); NM.cleanup = () => clearInterval(t);
      } };
  } });
  NM.form.recover = (f) => {
    const em = $("#rc-email"), e = em.value.trim().toLowerCase(); NM.clr(em);
    if (!e) NM.err(em, "Escribe tu correo electrónico."); else if (!NM.EMAIL_RE.test(e)) NM.err(em, "Escribe un correo válido, por ejemplo nombre@upc.edu.pe.");
    if (NM.firstInvalid(f)) return;
    S.recovery = { email: e, sentAt: Date.now() }; NM.save("recovery"); NM.refresh();
    NM.announce("Enlace enviado. Revisa tu bandeja de entrada.");
  };
  NM.act.resend = () => { S.recovery.sentAt = Date.now(); NM.save("recovery"); NM.refresh(); NM.snack("Enviamos un enlace nuevo. El anterior queda anulado."); };
  NM.act.expire = () => { if (S.recovery) { S.recovery.sentAt = Date.now() - EXP - 60000; NM.save("recovery"); } NM.go("/restablecer"); };
  NM.route("/restablecer", { guard: () => (!S.recovery ? "/recuperar" : Date.now() - S.recovery.sentAt > EXP ? "/restablecer-vencido" : null), view: () => ({
    title: "Nueva contraseña", heading: "Nueva contraseña", back: "/recuperar", nav: "none",
    html: `<form class="narrow stack" data-form="reset" novalidate><p class="muted">Crea una contraseña nueva para ${esc(S.recovery.email)}. El enlace es válido por 30 minutos.</p>
      ${passField("nw-pass", "Nueva contraseña", { auto: "new-password", extra: 'data-inp="pw-new"' })}${rulesHtml("new-rules")}${passField("nw-pass2", "Repite la contraseña", { auto: "new-password" })}
      <button class="btn btn-primary btn-block" type="submit">Guardar contraseña</button></form>` }) });
  NM.form.reset = async (f) => {
    const a = $("#nw-pass"), b = $("#nw-pass2"); [a, b].forEach(NM.clr);
    if (!NM.pwOk(a.value)) NM.err(a, "La contraseña debe tener 8 o más caracteres, con letras y números."); if (b.value !== a.value) NM.err(b, "Las contraseñas no coinciden.");
    if (NM.firstInvalid(f)) return;
    const e = S.recovery.email; if (S.users[e]) { S.users[e].hash = await NM.hash(e + ":" + a.value); NM.save("users"); }
    S.recovery = null; S.lock = { count: 0, until: 0 }; NM.save("recovery", "lock");
    NM.go("/ingresar"); setTimeout(() => { const i = $("#lg-email"); if (i) { i.value = e; $("#lg-pass").focus(); } NM.snack("Guardamos tu contraseña nueva. Ya puedes iniciar sesión."); }, 80);
  };
  NM.route("/restablecer-vencido", { view: () => ({
    title: "Enlace vencido", heading: "Recuperar contraseña", back: "/recuperar", nav: "none",
    html: `<form class="narrow stack" data-form="recover-again" novalidate>${NM.alert("warning", "Este enlace venció", "Los enlaces de recuperación duran 30 minutos. Solicita uno nuevo; el anterior queda anulado.")}
      ${NM.field({ id: "rc-email", label: "Correo electrónico", req: true, type: "email", auto: "email", value: S.recovery ? S.recovery.email : "" })}
      <button class="btn btn-primary btn-block" type="submit">Solicitar un enlace nuevo</button><a class="btn-link center" href="#/ingresar">Volver a iniciar sesión</a></form>` }) });
  NM.form["recover-again"] = (f) => {
    const em = $("#rc-email"), e = em.value.trim().toLowerCase(); NM.clr(em);
    if (!e) NM.err(em, "Escribe tu correo electrónico."); else if (!NM.EMAIL_RE.test(e)) NM.err(em, "Escribe un correo válido, por ejemplo nombre@upc.edu.pe.");
    if (NM.firstInvalid(f)) return;
    S.recovery = { email: e, sentAt: Date.now() }; NM.save("recovery"); NM.go("/recuperar");
  };
})();
