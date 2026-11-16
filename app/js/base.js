/* NutriMap Estudiantil · datos de ejemplo
   Una sola fuente de datos para el radar, el plan, las recetas y el comercio.
   Todos los locales y precios son simulados (US40 CA03). */
window.NM_DATA = {
  campuses: [
    { id: "monterrico", name: "UPC Monterrico", address: "Av. Prolongación Primavera 2390" },
    { id: "san-isidro", name: "UPC San Isidro", address: "Av. Salaverry 2255" },
    { id: "villa", name: "UPC Villa", address: "Av. Alameda San Marcos cdra. 11" },
    { id: "san-miguel", name: "UPC San Miguel", address: "Av. La Marina 2810" }
  ],

  offerTypes: {
    menu: "Menú del día",
    mercado: "Mercado e insumos",
    cafeteria: "Cafetería",
    casera: "Cocina casera o delivery",
    saludable: "Comida saludable"
  },

  /* x / y: posición del pin en el mapa de ejemplo (porcentaje). */
  places: [
    {
      id: "dona-rosa", name: "Menú Doña Rosa", type: "menu", price: 10, priceLabel: "S/ 10",
      distance: 350, walk: 5, iron: true, open: true, hours: "12:00 a 4:00 p. m.", closesSoon: false,
      updated: "hace 2 h", address: "Av. Primavera 1120, Santiago de Surco", x: 32, y: 22,
      menu: [
        { course: "Entrada", dish: "Ensalada de espinaca", tag: "Fuente de hierro", available: true },
        { course: "Segundo", dish: "Lentejas con arroz y huevo", tag: "Fuente de hierro", available: true },
        { course: "Refresco", dish: "Limonada", tag: "Vitamina C", available: true }
      ]
    },
    {
      id: "surquillo-14", name: "Mercado Surquillo – Puesto 14", type: "mercado", price: 4.5, priceLabel: "Desde S/ 4.50",
      distance: 800, walk: 11, iron: true, open: true, hours: "7:00 a. m. a 2:00 p. m.", closesSoon: false,
      updated: "ayer", address: "Mercado N.° 1 de Surquillo, puesto 14", x: 70, y: 30,
      menu: [
        { course: "Insumo", dish: "Lentejas 500 g", tag: "Fuente de hierro", available: true },
        { course: "Insumo", dish: "Espinaca (atado)", tag: "Fuente de hierro", available: true },
        { course: "Insumo", dish: "Sangrecita 250 g", tag: "Fuente de hierro", available: true }
      ]
    },
    {
      id: "pabellon-b", name: "Cafetería Pabellón B", type: "cafeteria", price: 7, priceLabel: "S/ 7",
      distance: 120, walk: 2, iron: false, open: true, hours: "7:00 a. m. a 8:00 p. m.", closesSoon: false,
      updated: "hace 5 h", address: "Campus, pabellón B, primer piso", x: 48, y: 50,
      menu: [
        { course: "Menú", dish: "Arroz con pollo", tag: "", available: true },
        { course: "Menú", dish: "Sándwich de pollo", tag: "", available: true },
        { course: "Bebida", dish: "Jugo de naranja", tag: "Vitamina C", available: true }
      ]
    },
    {
      id: "don-lucho", name: "Sangrecita Don Lucho", type: "menu", price: 9, priceLabel: "S/ 9",
      distance: 950, walk: 13, iron: true, open: true, hours: "11:00 a. m. a 3:00 p. m.", closesSoon: true,
      updated: "hace 1 h", address: "Jr. Los Cedros 245, Surco", x: 20, y: 78,
      menu: [
        { course: "Segundo", dish: "Sangrecita con papa", tag: "Fuente de hierro", available: true },
        { course: "Segundo", dish: "Hígado encebollado", tag: "Fuente de hierro", available: true },
        { course: "Refresco", dish: "Chicha morada", tag: "", available: true }
      ]
    },
    {
      id: "mama-lucha", name: "Juguería Mamá Lucha", type: "cafeteria", price: 5, priceLabel: "S/ 5",
      distance: 450, walk: 6, iron: false, open: true, hours: "7:00 a. m. a 6:00 p. m.", closesSoon: false,
      updated: "hace 3 h", address: "Av. Primavera 980", x: 62, y: 66,
      menu: [
        { course: "Jugo", dish: "Jugo de naranja con betarraga", tag: "Vitamina C", available: true },
        { course: "Sándwich", dish: "Pan con palta", tag: "", available: true },
        { course: "Sándwich", dish: "Pan con huevo", tag: "", available: true }
      ]
    },
    {
      id: "el-puerto", name: "Cevichería El Puerto", type: "menu", price: 12, priceLabel: "S/ 12",
      distance: 600, walk: 8, iron: false, open: false, hours: "11:00 a. m. a 4:00 p. m.", closesSoon: false,
      /* US15 escenario 2: el comercio no publicó su menú de hoy */
      noMenuToday: true, updated: "ayer, 6:40 p. m.", address: "Av. Caminos del Inca 1320", x: 82, y: 58,
      menu: [
        { course: "Entrada", dish: "Leche de tigre", tag: "", available: true },
        { course: "Segundo", dish: "Ceviche de pescado", tag: "", available: true },
        { course: "Refresco", dish: "Chicha morada", tag: "", available: true }
      ]
    },
    {
      id: "la-brasa", name: "Pollería La Brasa", type: "menu", price: 13, priceLabel: "S/ 13",
      distance: 1400, walk: 18, iron: false, open: true, hours: "12:00 a 10:00 p. m.", closesSoon: false,
      updated: "hace 4 h", address: "Av. Velasco Astete 2100", x: 88, y: 86,
      menu: [
        { course: "Menú", dish: "1/8 de pollo con papas", tag: "", available: true },
        { course: "Menú", dish: "Ensalada fresca", tag: "", available: true },
        { course: "Bebida", dish: "Gaseosa personal", tag: "", available: true }
      ]
    },
    {
      id: "surco-3", name: "Mercado de Surco – Puesto 3", type: "mercado", price: 3.5, priceLabel: "Desde S/ 3.50",
      distance: 1800, walk: 23, iron: true, open: true, hours: "6:00 a. m. a 1:00 p. m.", closesSoon: false,
      updated: "hace 6 h", address: "Mercado de Santiago de Surco, puesto 3", x: 10, y: 40,
      menu: [
        { course: "Insumo", dish: "Frejoles 500 g", tag: "Fuente de hierro", available: true },
        { course: "Insumo", dish: "Garbanzos 500 g", tag: "Fuente de hierro", available: true },
        { course: "Insumo", dish: "Quinua 500 g", tag: "", available: true }
      ]
    }
  ],

  /* Comidas para el plan semanal. Las de tipo "receta" alimentan la lista de compras
     y la sección de recetas; las de tipo "local" se compran en un local del radar. */
  meals: [
    { id: "avena", slot: "desayuno", name: "Avena con plátano", cost: 3, iron: false, kind: "receta", time: 5,
      ingredients: [["Avena", "Menestras y granos", 80, "g", 0.9], ["Plátano", "Verduras y frutas", 1, "und.", 0.5], ["Leche", "Lácteos y otros", 200, "ml", 1.2]],
      steps: ["Hierve la leche con la avena por 4 minutos.", "Sirve y añade el plátano en rodajas."] },
    { id: "pan-huevo", slot: "desayuno", name: "Pan con huevo", cost: 3, iron: true, kind: "receta", time: 10,
      ingredients: [["Pan", "Lácteos y otros", 2, "und.", 0.6], ["Huevos", "Proteínas", 2, "und.", 1.2]],
      steps: ["Fríe o revuelve los huevos con una pizca de sal.", "Sirve dentro del pan."] },
    { id: "pan-palta", slot: "desayuno", name: "Pan con palta", cost: 3.5, iron: false, kind: "receta", time: 5,
      ingredients: [["Pan", "Lácteos y otros", 2, "und.", 0.6], ["Palta", "Verduras y frutas", 1, "und.", 2]],
      steps: ["Machaca la palta con sal y limón.", "Úntala en el pan."] },
    { id: "quinua-manzana", slot: "desayuno", name: "Quinua con manzana", cost: 3.5, iron: true, kind: "receta", time: 20,
      ingredients: [["Quinua", "Menestras y granos", 60, "g", 1.2], ["Manzana", "Verduras y frutas", 1, "und.", 0.8]],
      steps: ["Lava la quinua y cocínala 15 minutos en agua.", "Añade la manzana picada y canela."] },

    { id: "lentejas", slot: "almuerzo", name: "Lentejas guisadas", cost: 4, iron: true, kind: "receta", time: 30,
      ingredients: [["Lentejas", "Menestras y granos", 150, "g", 1.4], ["Arroz", "Menestras y granos", 100, "g", 0.5], ["Cebolla", "Verduras y frutas", 1, "und.", 0.4], ["Limón", "Verduras y frutas", 1, "und.", 0.2]],
      steps: ["Remoja las lentejas desde la noche anterior.", "Haz un aderezo con cebolla y ajo.", "Cocina las lentejas en el aderezo 25 minutos.", "Sirve con arroz y unas gotas de limón: la vitamina C ayuda a aprovechar el hierro."] },
    { id: "tallarin-sangrecita", slot: "almuerzo", name: "Tallarín con sangrecita", cost: 5, iron: true, kind: "receta", time: 25,
      ingredients: [["Sangrecita", "Proteínas", 125, "g", 1.8], ["Tallarín", "Menestras y granos", 100, "g", 0.8], ["Cebolla", "Verduras y frutas", 1, "und.", 0.4]],
      steps: ["Sancocha el tallarín.", "Saltea la sangrecita con cebolla y ají.", "Mezcla y sirve caliente."] },
    { id: "arroz-pollo", slot: "almuerzo", name: "Arroz con pollo", cost: 6, iron: false, kind: "receta", time: 40,
      ingredients: [["Pollo", "Proteínas", 150, "g", 3], ["Arroz", "Menestras y granos", 100, "g", 0.5], ["Arvejas", "Verduras y frutas", 50, "g", 0.6]],
      steps: ["Dora el pollo.", "Licúa el culantro y haz el aderezo.", "Cocina el arroz en el aderezo con las arvejas."] },
    { id: "local-dona-rosa", slot: "almuerzo", name: "Menú Doña Rosa", cost: 10, iron: true, kind: "local", place: "dona-rosa" },
    { id: "local-don-lucho", slot: "almuerzo", name: "Sangrecita Don Lucho", cost: 9, iron: true, kind: "local", place: "don-lucho" },
    { id: "local-pabellon", slot: "almuerzo", name: "Menú Cafetería Pabellón B", cost: 7, iron: false, kind: "local", place: "pabellon-b" },

    { id: "tortilla-espinaca", slot: "cena", name: "Tortilla de espinaca", cost: 5, iron: true, kind: "receta", time: 15,
      ingredients: [["Espinaca", "Verduras y frutas", 1, "atado", 2], ["Huevos", "Proteínas", 2, "und.", 1.2], ["Tomate", "Verduras y frutas", 1, "und.", 0.6]],
      steps: ["Lava y pica la espinaca.", "Bate los huevos y mezcla.", "Cocina a fuego medio por ambos lados.", "Acompaña con tomate en rodajas."] },
    { id: "sopa-quinua", slot: "cena", name: "Sopa de quinua", cost: 4, iron: true, kind: "receta", time: 30,
      ingredients: [["Quinua", "Menestras y granos", 60, "g", 1.2], ["Zanahoria", "Verduras y frutas", 1, "und.", 0.4], ["Papa", "Verduras y frutas", 2, "und.", 0.8]],
      steps: ["Lava la quinua.", "Hierve con papa y zanahoria picadas 25 minutos.", "Sazona con sal y orégano."] },
    { id: "ensalada-garbanzos", slot: "cena", name: "Ensalada de garbanzos", cost: 4.5, iron: true, kind: "receta", time: 10,
      ingredients: [["Garbanzos", "Menestras y granos", 120, "g", 1.5], ["Tomate", "Verduras y frutas", 1, "und.", 0.6], ["Limón", "Verduras y frutas", 1, "und.", 0.2]],
      steps: ["Usa garbanzos cocidos y escurridos.", "Mezcla con tomate y cebolla picados.", "Aliña con limón y sal."] },
    { id: "local-sandwich", slot: "cena", name: "Sándwich de pollo (Pabellón B)", cost: 6, iron: false, kind: "local", place: "pabellon-b" }
  ],

  slots: [
    { id: "desayuno", label: "Desayuno" },
    { id: "almuerzo", label: "Almuerzo" },
    { id: "cena", label: "Cena" }
  ],

  days: [
    { id: 0, short: "Lun", long: "Lunes" },
    { id: 1, short: "Mar", long: "Martes" },
    { id: 2, short: "Mié", long: "Miércoles" },
    { id: 3, short: "Jue", long: "Jueves" },
    { id: 4, short: "Vie", long: "Viernes" },
    { id: 5, short: "Sáb", long: "Sábado" },
    { id: 6, short: "Dom", long: "Domingo" }
  ],

  categories: ["Menestras y granos", "Verduras y frutas", "Proteínas", "Lácteos y otros"],

  /* Términos que el buscador del radar reconoce para sugerir correcciones (US18). */
  searchTerms: ["lentejas", "espinaca", "sangrecita", "menú", "mercado", "quinua", "frejoles", "garbanzos",
    "hígado", "pollo", "ceviche", "jugo", "pan", "huevo", "palta", "cafetería", "arroz"]
};
