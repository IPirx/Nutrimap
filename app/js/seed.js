/* NutriMap Estudiantil · datos de ejemplo de la app
   Una sola fuente para estudiante, comercio y revisor: lo que publica un comercio lo ve el estudiante,
   lo que reporta un estudiante lo recibe el comercio y lo que aprueba el revisor aparece en Aprende.
   Todos los locales, precios y artículos son simulados. */
(function () {
  "use strict";
  const B = window.NM_DATA;
  const now = Date.now(), H = 36e5, DAY = 864e5;
  const mk = (iso) => new Date(iso).getTime();

  /* ---------- Locales ---------- */
  const age = { "dona-rosa": 2 * H, "surquillo-14": 30 * H, "pabellon-b": 5 * H, "don-lucho": 1 * H, "mama-lucha": 3 * H, "el-puerto": 30 * H, "la-brasa": 4 * H, "surco-3": 6 * H };
  const places = B.places.map((p) => ({
    id: p.id, name: p.name, type: p.type, price: p.price, distance: p.distance, walk: p.walk, open: p.open, hours: p.hours,
    closesSoon: !!p.closesSoon, address: p.address, x: p.x, y: p.y, noMenuToday: !!p.noMenuToday,
    stock: "disponible", published: true, located: true, owner: null, phone: "", updatedAt: now - (age[p.id] || H),
    firstPublishedAt: now - 20 * DAY, stats: { visits: 0, routes: 0 },
    menu: p.menu.map((m) => ({
      course: m.course, dish: m.dish, tag: m.tag === "Fuente de hierro" ? "" : m.tag, iron: m.tag === "Fuente de hierro",
      ironStatus: m.tag === "Fuente de hierro" ? "aprobada" : null, avail: "disponible", note: "", requestedAt: null
    }))
  }));
  const byId = (id) => places.find((p) => p.id === id);

  /* Menú Doña Rosa: el comercio de demostración (estados de etiqueta de US33) */
  const rosa = byId("dona-rosa");
  Object.assign(rosa, { owner: "dona.rosa@demo.pe", phone: "987654321", hours: "Lun a sáb, 12:00 m. a 4:00 p. m.", firstPublishedAt: now - 10 * DAY, stats: { visits: 124, routes: 31 } });
  rosa.menu = [
    { course: "Entrada", dish: "Ensalada de espinaca", tag: "", iron: true, ironStatus: "pendiente", avail: "disponible", note: "", requestedAt: now - 3 * H },
    { course: "Segundo", dish: "Lentejas con arroz y huevo", tag: "", iron: true, ironStatus: "aprobada", avail: "disponible", note: "", requestedAt: now - 20 * H },
    { course: "Refresco", dish: "Limonada", tag: "Vitamina C", iron: false, ironStatus: null, avail: "disponible", note: "", requestedAt: null },
    { course: "Segundo (opción)", dish: "Sangrecita saltada", tag: "", iron: true, ironStatus: "observada", avail: "pocas", note: "Indica el tamaño de la porción.", requestedAt: now - 2 * DAY }
  ];
  /* Sangrecita Don Lucho: un segundo plato con solicitud pendiente, para la bandeja del revisor */
  const lucho = byId("don-lucho");
  lucho.menu = [
    { course: "Segundo", dish: "Sangrecita con papa", tag: "", iron: true, ironStatus: "pendiente", avail: "disponible", note: "", requestedAt: now - 26 * H },
    { course: "Segundo", dish: "Hígado encebollado", tag: "", iron: true, ironStatus: "aprobada", avail: "disponible", note: "", requestedAt: null },
    { course: "Refresco", dish: "Chicha morada", tag: "", iron: false, ironStatus: null, avail: "disponible", note: "", requestedAt: null }
  ];
  lucho.owner = "sangrecita.lucho@demo.pe";
  /* La disponibilidad del menú se deriva de la de sus platos: la sangrecita de Doña Rosa está en «Pocas» */
  rosa.stock = "pocas";

  const ingredients = { "Ensalada de espinaca": "espinaca, tomate, limón, aceite", "Sangrecita con papa": "sangrecita 150 g, papa, cebolla, ají", "Lentejas con arroz y huevo": "lentejas 150 g, arroz 100 g, 1 huevo, cebolla" };
  /* Porción declarada por el comercio. La ensalada no la indica: así la bandeja muestra un caso que debe observarse. */
  const portions = { "Sangrecita con papa": "1 plato hondo · 150 g de sangrecita", "Lentejas con arroz y huevo": "1 plato · 150 g de lentejas cocidas" };

  /* ---------- Reportes de estudiantes ---------- */
  const reports = [
    { id: "r1", placeId: "dona-rosa", type: "precio", value: "S/ 12", at: now - 1 * DAY, status: "nuevo" },
    { id: "r2", placeId: "dona-rosa", type: "horario", value: "Cierran a las 3:00 p. m.", at: now - 3 * DAY, status: "nuevo" },
    { id: "r3", placeId: "dona-rosa", type: "precio", value: "S/ 11", at: now - 6 * DAY, status: "corregido" }
  ];

  /* ---------- Artículos (US05, US08, US34, US36) ---------- */
  const OMS = { label: "Organización Mundial de la Salud (2025). Anaemia", url: "https://www.who.int/news-room/fact-sheets/detail/anaemia" };
  const hist = (ts, author, type, text) => ({ ts: mk(ts), author, type, text });
  const TEAM = "Equipo NutriMap", REV = "Lic. Ana Torres (nutricionista)";
  const articles = [
    {
      id: "hierro", title: "¿Qué alimentos aportan hierro?", author: TEAM, status: "publicado", source: OMS, readMin: 3, reviewedAt: mk("2026-09-13T09:20"),
      body: [
        { h: "Hierro de origen animal", p: "Sangrecita, hígado, bazo, carnes rojas y pescado. El cuerpo lo aprovecha con más facilidad que el de origen vegetal." },
        { h: "Hierro de origen vegetal", p: "Lentejas, frejoles, garbanzos y espinaca aportan hierro. Son opciones económicas y fáciles de encontrar en los mercados cerca del campus." },
        { h: "Cómo aprovecharlo mejor", p: "Acompaña las menestras con limón, naranja o tomate. Evita tomar té o café justo después de comer." }
      ],
      check: [true, true, true, true], comments: [],
      history: [
        hist("2026-09-10T17:45", TEAM, "Creado", "Borrador inicial"),
        hist("2026-09-11T17:45", TEAM, "Enviado a revisión", "Versión 1 enviada"),
        hist("2026-09-12T11:30", REV, "Cambios solicitados", "2 comentarios por fragmento"),
        hist("2026-09-12T15:50", TEAM, "Editado", "«curan la anemia» → «aportan hierro»"),
        hist("2026-09-12T16:10", TEAM, "Enviado a revisión", "Versión 2 enviada"),
        hist("2026-09-13T09:20", REV, "Publicado", "Aprobado y publicado en Aprende")
      ]
    },
    {
      id: "lentejas", title: "Lentejas: ¿cuánto hierro aportan?", author: TEAM, status: "revision", source: OMS, readMin: 2, reviewedAt: null,
      body: [
        { h: "¿Por qué las lentejas?", p: "Las lentejas curan la anemia si las comes todos los días. Son baratas y fáciles de encontrar en cualquier mercado." },
        { h: "Cómo prepararlas", p: "Remójalas desde la noche anterior y acompáñalas con limón o naranja para aprovechar mejor el hierro." }
      ],
      check: [true, true, true, false], comments: [],
      history: [hist("2026-11-02T10:05", TEAM, "Creado", "Borrador inicial"), hist("2026-11-02T16:40", TEAM, "Enviado a revisión", "Versión 1 enviada")]
    },
    {
      id: "almuerzo10", title: "Cómo armar un almuerzo con S/ 10", author: TEAM, status: "revision", source: OMS, readMin: 3, reviewedAt: null,
      body: [
        { h: "Empieza por la menestra", p: "Una porción de lentejas, frejoles o garbanzos es la base del almuerzo y rinde bastante por poco dinero." },
        { h: "Suma una verdura y una fruta", p: "La espinaca, el tomate o una naranja completan el plato y ayudan a aprovechar el hierro." },
        { h: "Compara antes de comprar", p: "Revisa el radar: dos locales cercanos pueden tener precios distintos para un menú parecido." }
      ],
      check: [false, false, false, false], comments: [],
      history: [hist("2026-11-03T09:15", TEAM, "Creado", "Borrador inicial"), hist("2026-11-03T12:30", TEAM, "Enviado a revisión", "Versión 1 enviada")]
    },
    {
      id: "meriendas", title: "Meriendas con hierro", author: TEAM, status: "borrador", source: OMS, readMin: 2, reviewedAt: null,
      body: [
        { h: "Opciones rápidas", p: "Las semillas de zapallo y el maní curan la anemia si las comes todos los días. Cabe en la mochila y no necesita refrigeración." },
        { h: "Para acompañar", p: "Una naranja o un vaso de limonada después de la merienda ayuda a aprovechar el hierro." }
      ],
      check: [false, false, false, false],
      comments: [
        { id: "c1", frag: "curan la anemia", text: "Cambiar «curan la anemia» por «aportan hierro». Evitar promesas clínicas." },
        { id: "c2", frag: "todos los días", text: "Quitar la frecuencia: no es una recomendación clínica." }
      ],
      history: [
        hist("2026-11-01T11:00", TEAM, "Creado", "Borrador inicial"),
        hist("2026-11-01T18:20", TEAM, "Enviado a revisión", "Versión 1 enviada"),
        hist("2026-11-04T11:30", REV, "Cambios solicitados", "2 comentarios por fragmento")
      ]
    }
  ];

  /* ---------- Gasto de ejemplo de la semana (US26) ---------- */
  const w0 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); })();
  const spend = [
    { id: "g1", at: w0 + 12 * H, desc: "Menú Doña Rosa", amount: 10 },
    { id: "g2", at: w0 + DAY + 13 * H, desc: "Mercado Surquillo", amount: 28 },
    { id: "g3", at: w0 + 2 * DAY + 13 * H, desc: "Cafetería Pabellón B", amount: 7 },
    { id: "g4", at: w0 + 2 * DAY + 19 * H, desc: "Cena en casa", amount: 7 }
  ];

  window.NM_SEED = {
    ver: 5,
    ingredients,
    portions,
    labelCriteria: ["Contiene una fuente de hierro reconocida", "La porción está indicada", "No promete tratar ni curar enfermedades"],
    checklist: ["Fuente verificable y enlazada", "Aviso de alcance visible", "Lenguaje comprensible, sin términos clínicos", "Sin promesas de diagnóstico o cura"],
    demoUsers: [
      { email: "dona.rosa@demo.pe", name: "Doña Rosa", role: "com", pass: "Demo1234", campus: "monterrico" },
      { email: "nuevo.comercio@demo.pe", name: "Café La Esquina", role: "com", pass: "Demo1234", campus: "monterrico" },
      { email: "sangrecita.lucho@demo.pe", name: "Don Lucho", role: "com", pass: "Demo1234", campus: "monterrico" },
      { email: "estudiante@demo.pe", name: "Estudiante Demo", role: "est", pass: "Demo1234", campus: "monterrico" },
      { email: "nutri@upc.edu.pe", name: "Lic. Ana Torres", role: "rev", pass: "Demo1234", campus: "monterrico" }
    ],
    defaults: {
      loc: { campus: "monterrico", radius: 1000, mode: "campus", asked: false },
      favs: [], favRecipes: [], view: "list", compare: [],
      prefs: { budget: 90, distance: 1000, iron: false, veg: false, history: false, textSize: "normal" },
      plan: null, planWeek: null, checked: {}, extras: [], removed: [], renames: {}, custom: {},
      spend, history: [],
      reminders: { desayuno: { on: false, time: "07:30" }, almuerzo: { on: true, time: "12:30" }, cena: { on: true, time: "19:30" } },
      places, reports, articles, users: {}, session: null, entry: null, lock: { count: 0, until: 0 }, recovery: null, seen: {}
    }
  };
})();
