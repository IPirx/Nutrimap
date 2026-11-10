/* NutriMap Estudiantil · arranque de la app */
(async function () {
  "use strict";
  const NM = window.NM, S = NM.S;
  NM.load();
  /* Cuentas de demostración (comercio y nutricionista). Los datos viven solo en este navegador. */
  let seeded = false;
  for (const u of NM_SEED.demoUsers) {
    if (!S.users[u.email]) { S.users[u.email] = { name: u.name, role: u.role, campus: u.campus, hash: await NM.hash(u.email + ":" + u.pass), consentAt: new Date().toISOString() }; seeded = true; }
  }
  if (seeded) NM.save("users");
  NM.route("/", { view: () => ({ redirect: NM.home(NM.role()) }) });
  NM.ensureWeek();
  NM.initSnack();
  NM.render();
  NM.startReminders();
})();
