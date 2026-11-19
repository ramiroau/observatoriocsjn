// The dictámenes page: static/data/dictamenes.json (one row per dictamen and the Court's decision after it),
// filtered by the controls; every figure, both charts, the table by year and the list follow the same filter.
// Durations count the cases still waiting (Kaplan–Meier), since leaving them out would make the Court look faster.
(() => {
  const caja = document.getElementById("filtros");
  if (!caja) return;
  const FALLOS = caja.dataset.fallos || "";  // where the decision pages are; the public site has none
  const $ = id => document.getElementById(id);
  const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const fmt = n => n.toLocaleString("es-AR");
  const pct = x => x == null ? "–" : Math.round(x * 100) + " %";
  const DIA = 864e5;
  const dia = s => Date.parse(s + "T00:00:00Z") / DIA;
  const fecha = s => s ? s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4) : "";
  const anios = d => d >= 730 ? (d / 365.25).toFixed(1).replace(".", ",") + " años" : d >= 365 ? "1 año" : "";
  const PASO = 100;
  // why a case with no decision found counts as waiting (pgn.MOTIVOS)
  const MOTIVOS = {
    reciente: "dictamen de menos de un año",
    solo_anteriores: "la Corte decidió en el caso solo antes del dictamen",
    mantenimiento: "la PGN mantiene el recurso de un fiscal",
    competencia_originaria: "competencia originaria de la Corte",
    competencia: "cuestión de competencia",
    sin_rastro: "ninguna decisión de la Corte nombra el caso"
  };
  let D, todos = [], elegidos = [], mostrar = PASO, fijado = null, kmTodos;
  let serieElegida = null;  // a series picked from a case: only its dictámenes
  // "pendientes": every case still waiting; "trigo": only those identified as relevant; "paja": the others (pgn.grupo)
  let criba = "";
  const PAJA = ["competencia", "mantenimiento_penal_tributario", "mantenimiento_otro", "serie", "tramite_menor"];
  const GRUPOS = {
    competencia: "no relevante: cuestión de competencia",
    mantenimiento_penal_tributario: "no relevante: la PGN mantiene el recurso de un fiscal (penal tributario)",
    mantenimiento_otro: "no relevante: la PGN mantiene el recurso de un fiscal",
    serie: "no relevante: lo representa el caso testigo de su serie",
    tramite_menor: "no relevante: trámite menor",
    penal_otro: "dudoso: penal",
    resto: "caso identificado como relevante"
  };
  const clase = r => r.grupo == null ? null : D.grupos[r.grupo] === "resto" ? "trigo"
                   : PAJA.includes(D.grupos[r.grupo]) ? "paja" : "dudoso";

  const color = nombre => getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();

  // ---- data
  function preparar(d) {
    const c = Object.fromEntries(d.campos.map((k, i) => [k, i]));
    return d.filas.map(f => {
      const r = {};
      for (const k in c) r[k] = f[c[k]];
      r.t0 = dia(r.fecha_dictamen);
      r.anio = +r.fecha_dictamen.slice(0, 4);
      r.decidido = r.esperando !== 1 && r.esperando !== 2;  // null: decided, with no date
      r.sinExpediente = r.esperando === 2;
      r.buscar = norm([r.caratula, r.expediente, r.expediente_decision, r.voz, r.fallos && "fallos " + r.fallos].join(" "));
      return r;
    });
  }

  function opciones(id, lista, nombre) {
    const sel = $(id);
    const n = new Map();
    todos.forEach(r => { const v = r[id]; if (v != null) n.set(v, (n.get(v) || 0) + 1); });
    [...n.entries()].sort((a, b) => b[1] - a[1]).forEach(([v, k]) => {
      const o = document.createElement("option");
      o.value = v; o.textContent = (nombre ? nombre(lista[v]) : lista[v]) + " (" + fmt(k) + ")";
      sel.append(o);
    });
  }

  // ---- filter
  function filtrar() {
    const desde = parseInt($("desde").value, 10), hasta = parseInt($("hasta").value, 10);
    const q = norm($("texto").value).split(/\s+/).filter(Boolean), estado = $("estado").value;
    const sel = ["asunto", "camara", "firma", "sentido", "remision", "motivo"].map(id => [id, $(id).value]).filter(x => x[1] !== "");
    const modo = $("serie").value;
    const enSerie = r => (serieElegida == null || r.serie === serieElegida) && (!modo ||
      (modo === "una" ? r.serie == null || r.testigo === 1 : modo === "en" ? r.serie != null : r.serie == null));
    elegidos = todos.filter(r => enSerie(r) && (!criba || (criba === "pendientes" ? r.esperando === 1 : clase(r) === criba)) &&
      (isNaN(desde) || r.anio >= desde) && (isNaN(hasta) || r.anio <= hasta) &&
      (!estado || (estado === "decidido" ? r.decidido : estado === "sin" ? r.sinExpediente : r.esperando === 1)) &&
      sel.every(([k, v]) => String(r[k]) === v) && q.every(w => r.buscar.includes(w)));
  }

  // ---- Kaplan–Meier: the share decided by each day since the dictamen, counting the open cases
  function km(rows) {
    const obs = rows.filter(r => r.dias != null && (r.esperando === 0 || r.esperando === 1)).map(r => [r.dias, r.decidido]);
    obs.sort((a, b) => a[0] - b[0]);
    let n = obs.length, s = 1, i = 0;
    const pts = [[0, 0]];
    while (i < obs.length) {
      const t = obs[i][0];
      let ev = 0, k = 0;
      while (i < obs.length && obs[i][0] === t) { ev += obs[i][1]; k++; i++; }
      if (ev) { s *= 1 - ev / n; pts.push([t, 1 - s]); }
      n -= k;
    }
    const tMax = obs.length ? obs[obs.length - 1][0] : 0;
    const en = t => {  // share decided by day t; unknown past the longest observation
      if (t > tMax) return null;
      let lo = 0, hi = pts.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (pts[m][0] <= t) lo = m; else hi = m - 1; }
      return pts[lo][1];
    };
    const med = pts.find(p => p[1] >= 0.5);
    return { pts, tMax, en, mediana: med ? med[0] : null };
  }

  // ---- figures
  function cifras(k) {
    const dec = elegidos.filter(r => r.decidido).length, esp = elegidos.filter(r => r.esperando === 1).length;
    const sin = elegidos.filter(r => r.sinExpediente).length;
    const items = [
      [fmt(elegidos.length), "dictámenes"],
      [fmt(dec), "con decisión de la Corte"],
      [fmt(esp), "esperando decisión" + (sin ? " (y " + fmt(sin) + " sin expediente)" : "")],
      [k.mediana == null ? "–" : fmt(k.mediana), "días de mediana hasta la decisión"],
      [pct(k.en(365)), "decididos al año"]];
    $("cifras").replaceChildren(...items.map(([v, t]) => {
      const div = document.createElement("div");
      const s = document.createElement("strong"); s.textContent = v;
      const e = document.createElement("span"); e.textContent = t;
      div.append(s, e);
      return div;
    }));
  }

  // ---- scatter: date of the dictamen against the days to the decision (or waited so far)
  const disp = { el: $("dispersion") };
  function dispersion() {
    const el = disp.el, w = el.clientWidth, h = Math.max(260, Math.min(440, w * 0.55));
    const m = { t: 14, r: 14, b: 30, l: 52 };
    const dpr = window.devicePixelRatio || 1;
    if (!disp.canvas) {
      disp.canvas = document.createElement("canvas");
      disp.tip = document.createElement("div"); disp.tip.className = "tip"; disp.tip.hidden = true;
      el.style.position = "relative";
      el.append(disp.canvas, disp.tip);
      disp.canvas.addEventListener("pointermove", e => apuntar(e, false));
      disp.canvas.addEventListener("pointerleave", () => { disp.tip.hidden = true; marcar(null); });
      disp.canvas.addEventListener("click", e => apuntar(e, true));
    }
    const cv = disp.canvas;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px";
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t0 = dia("2015-01-01"), t1 = dia(D.hasta);
    const yMax = Math.max(365, d3.max(todos, r => r.dias || 0));
    const x = d3.scaleLinear([t0, t1], [m.l, w - m.r]), y = d3.scaleLinear([0, yMax], [h - m.b, m.t]);
    Object.assign(disp, { x, y, w, h, m, ctx });
    // axes: years below, years of waiting at the side
    ctx.clearRect(0, 0, w, h);
    ctx.font = "12px " + color("--sans"); ctx.fillStyle = color("--tenue"); ctx.strokeStyle = color("--linea");
    ctx.lineWidth = 1;
    for (let a = 0; a * 365.25 <= yMax; a++) {
      const yy = Math.round(y(a * 365.25)) + .5;
      ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(a === 0 ? "0" : a + (a === 1 ? " año" : " años"), m.l - 6, yy);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    const paso = w < 520 ? 2 : 1;
    for (let a = 2015; a <= +D.hasta.slice(0, 4); a += paso) ctx.fillText(a, x(dia(a + "-07-01")), h - m.b + 8);
    // the frontier: a case still waiting has waited from its dictamen to the cutoff
    ctx.setLineDash([3, 3]); ctx.strokeStyle = color("--tenue");
    ctx.beginPath(); ctx.moveTo(x(t1 - yMax), y(yMax)); ctx.lineTo(x(t1), y(0)); ctx.stroke(); ctx.setLineDash([]);
    // points: the decided ones as small translucent dots, the waiting ones as rings over them
    const azul = color("--decidido"), naranja = color("--esperando");
    ctx.globalAlpha = elegidos.length > 5000 ? .28 : elegidos.length > 1000 ? .45 : .75;
    ctx.fillStyle = azul;
    const pts = [];
    for (const r of elegidos) {
      if (r.dias == null || r.esperando !== 0) continue;
      const px = x(r.t0), py = y(r.dias);
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      pts.push([px, py, r]);
    }
    ctx.globalAlpha = elegidos.length > 1000 ? .6 : .9; ctx.strokeStyle = naranja; ctx.lineWidth = 1.2;
    for (const r of elegidos) {
      if (r.esperando !== 1 || r.dias == null) continue;
      const px = x(r.t0), py = y(r.dias);
      ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 2 * Math.PI); ctx.stroke();
      pts.push([px, py, r]);
    }
    ctx.globalAlpha = 1;
    disp.arbol = d3.quadtree(pts, p => p[0], p => p[1]);
    disp.foto = ctx.getImageData(0, 0, cv.width, cv.height);
    marcar(fijado);
  }

  function marcar(r) {  // ring the case under the pointer, or the pinned one
    if (!disp.foto) return;
    const { ctx, x, y } = disp;
    ctx.putImageData(disp.foto, 0, 0);
    for (const c of [r, fijado]) {
      if (!c || c.dias == null) continue;
      ctx.beginPath(); ctx.arc(x(c.t0), y(c.dias), 6, 0, 2 * Math.PI);
      ctx.lineWidth = 2; ctx.strokeStyle = color("--tinta"); ctx.stroke();
    }
  }

  function apuntar(e, fijar) {
    const b = disp.canvas.getBoundingClientRect(), px = e.clientX - b.left, py = e.clientY - b.top;
    const p = disp.arbol && disp.arbol.find(px, py, 14);
    if (!p) { disp.tip.hidden = true; marcar(null); if (fijar) { fijado = null; detalle(); marcar(null); } return; }
    const r = p[2];
    if (fijar) { fijado = r; detalle(); }
    marcar(r);
    const tip = disp.tip;
    tip.replaceChildren();
    const v = document.createElement("strong");
    v.textContent = fmt(r.dias) + " días" + (r.decidido ? "" : " esperando");
    const c = document.createElement("div"); c.textContent = r.caratula;
    const f = document.createElement("div"); f.className = "n";
    f.textContent = r.expediente + " · dictamen " + fecha(r.fecha_dictamen) +
      (r.fecha_decision ? " · decisión " + fecha(r.fecha_decision) : "");
    tip.append(v, c, f);
    tip.hidden = false;
    const tw = tip.offsetWidth;
    tip.style.left = Math.max(4, Math.min(disp.w - tw - 4, p[0] + 12)) + "px";
    tip.style.top = Math.max(4, p[1] - tip.offsetHeight - 10) + "px";
  }

  function detalle() {
    const el = $("detalle");
    el.hidden = !fijado;
    if (fijado) el.replaceChildren(caso(fijado, true));
  }

  // ---- curve: the share decided by each day since the dictamen
  const cur = { el: $("curva") };
  function curva(k) {
    const el = cur.el, w = el.clientWidth, h = Math.max(220, Math.min(320, w * 0.4));
    const m = { t: 16, r: 16, b: 34, l: 46 };
    const tMax = Math.max(365, kmTodos.tMax);
    const x = d3.scaleLinear([0, tMax], [m.l, w - m.r]), y = d3.scaleLinear([0, 1], [h - m.b, m.t]);
    const linea = d3.line().curve(d3.curveStepAfter).x(p => x(p[0])).y(p => y(p[1]));
    const conFin = kk => kk.pts.length ? [...kk.pts, [kk.tMax, kk.pts[kk.pts.length - 1][1]]] : [];
    const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`).attr("role", "img")
      .attr("aria-label", "Proporción decidida según los días desde el dictamen");
    const g = svg.append("g").attr("class", "eje");
    [0, .25, .5, .75, 1].forEach(v => {
      g.append("line").attr("class", "reja").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(v)).attr("y2", y(v));
      g.append("text").attr("x", m.l - 6).attr("y", y(v)).attr("dy", "0.32em").attr("text-anchor", "end").text(pct(v));
    });
    for (let a = 0; a * 365.25 <= tMax; a++)
      g.append("text").attr("x", x(a * 365.25)).attr("y", h - m.b + 18).attr("text-anchor", "middle")
        .text(a === 0 ? "dictamen" : a + (a === 1 ? " año" : " años"));
    svg.append("path").attr("class", "km todos").attr("d", linea(conFin(kmTodos)));
    svg.append("path").attr("class", "km filtrado").attr("d", linea(conFin(k)));
    if (k.mediana != null) {
      const mx = x(k.mediana);
      svg.append("line").attr("class", "mediana").attr("x1", mx).attr("x2", mx).attr("y1", y(0)).attr("y2", y(.5));
      svg.append("text").attr("class", "rotulo").attr("x", mx + 6).attr("y", y(.5) - 6)
        .text("mediana: " + fmt(k.mediana) + " días");
    }
    // crosshair: both curves at the day under the pointer
    const guia = svg.append("line").attr("class", "guia").attr("y1", m.t).attr("y2", h - m.b).style("display", "none");
    const tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true;
    svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b)
      .attr("fill", "transparent")
      .on("pointermove", e => {
        const [px] = d3.pointer(e), t = Math.max(0, Math.round(x.invert(px)));
        guia.attr("x1", px).attr("x2", px).style("display", null);
        tip.replaceChildren();
        const cab = document.createElement("div"); cab.className = "n";
        cab.textContent = fmt(t) + " días" + (anios(t) ? " (" + anios(t) + ")" : "");
        tip.append(cab);
        [["filtrado", "los elegidos", k], ["todos", "todos", kmTodos]].forEach(([cl, nombre, kk]) => {
          const fila = document.createElement("div"); fila.className = "fila-tip";
          const l = document.createElement("span"); l.className = "clave " + cl;
          const v = document.createElement("strong"); v.textContent = pct(kk.en(t));
          fila.append(l, v, " " + nombre);
          tip.append(fila);
        });
        tip.hidden = false;
        tip.style.left = Math.min(w - tip.offsetWidth - 4, px + 12) + "px";
        tip.style.top = m.t + "px";
      })
      .on("pointerleave", () => { guia.style("display", "none"); tip.hidden = true; });
    el.style.position = "relative";
    el.replaceChildren(svg.node(), tip);
  }

  // ---- table by year
  function porAnio() {
    const grupos = d3.group(elegidos, r => r.anio);
    const tb = $("por-anio").querySelector("tbody");
    tb.replaceChildren(...[...grupos.keys()].sort().map(a => {
      const rs = grupos.get(a), k = km(rs);
      const tr = document.createElement("tr");
      [a, fmt(rs.length), fmt(rs.filter(r => r.decidido).length), fmt(rs.filter(r => r.esperando === 1).length),
       k.mediana == null ? "–" : fmt(k.mediana), pct(k.en(365)), pct(k.en(730))].forEach((v, i) => {
        const td = document.createElement("td"); td.textContent = v; if (i) td.className = "num"; tr.append(td);
      });
      return tr;
    }));
  }

  // ---- the list: each case with its span from dictamen to decision on the 2015–today axis
  function caso(r, abierto) {
    const li = document.createElement(abierto ? "div" : "li");
    li.className = "caso" + (r.decidido ? "" : r.sinExpediente ? " sin" : " abierto");
    const cab = document.createElement("div"); cab.className = "caso-cab";
    const t = document.createElement("span"); t.className = "caso-titulo"; t.textContent = r.caratula || r.expediente;
    const dd = document.createElement("span"); dd.className = "caso-dias";
    dd.textContent = r.sinExpediente ? "sin expediente" : r.dias == null ? "sin fecha" : fmt(r.dias) + " días";
    if (r.esperando === 1 && r.dias != null) dd.textContent = "esperando hace " + fmt(r.dias) + " días";
    cab.append(t, dd);
    // the span
    const t0 = dia("2015-01-01"), t1 = dia(D.hasta), ancho = t1 - t0;
    const pista = document.createElement("div"); pista.className = "pista";
    const tramo = document.createElement("span"); tramo.className = "tramo";
    const fin = r.decidido ? (r.fecha_decision ? dia(r.fecha_decision) : r.t0) : t1;
    tramo.style.left = ((r.t0 - t0) / ancho * 100) + "%";
    tramo.style.width = Math.max(0.3, (fin - r.t0) / ancho * 100) + "%";
    if (!r.sinExpediente) pista.append(tramo);
    // the facts
    const datos = document.createElement("div"); datos.className = "caso-datos";
    const parte = (txt, href) => {
      const s = document.createElement(href ? "a" : "span"); s.textContent = txt;
      if (href) { s.href = href; s.rel = "noopener"; }
      return s;
    };
    const exp = r.expediente ? r.expediente + (r.recurso ? "/" + r.recurso : "") : "sin expediente";
    const items = [parte(exp)];
    items.push(parte("Dictamen " + fecha(r.fecha_dictamen), r.pdf_dictamen ? D.mpf + r.pdf_dictamen : null));
    if (r.firma != null) items.push(parte(D.firmas[r.firma]));
    if (r.decidido) {
      const dec = [r.fecha_decision ? "Decisión " + fecha(r.fecha_decision) : "Decidido (sin fecha)"];
      if (r.sentido != null) dec.push(D.sentidos[r.sentido].toLowerCase());
      items.push(parte(dec.join(": "), r.doc_decision ? D.visor + r.doc_decision : null));
      if (r.remision != null) items.push(parte(D.remisions[r.remision].toLowerCase().replace("pgn", "PGN")));
      if (r.formula != null) items.push(parte(D.formulas[r.formula] === "280" ? "art. 280" : D.formulas[r.formula].toLowerCase()));
      if (r.fallos) items.push(parte("Fallos " + r.fallos, FALLOS && FALLOS + r.fallos.replace(":", "/") + "/"));
      if (r.expediente_decision) items.push(parte("decidido en " + r.expediente_decision));
    } else items.push(parte(r.sinExpediente ? "el dictamen no indica el expediente: no se pudo buscar la decisión"
                                            : "sin decisión encontrada" + (r.motivo != null
                                              ? " (" + MOTIVOS[D.motivos[r.motivo]] + ")" : "")));
    if (r.voz) items.push(parte(r.voz));
    if (r.grupo != null) {
      const g = document.createElement("span"); g.className = "etiqueta " + clase(r);
      g.textContent = GRUPOS[D.grupos[r.grupo]] || D.grupos[r.grupo];
      items.push(g);
    }
    if (r.serie != null) {  // [id, date, voces, dictámenes, waiting, the testigo's row]
      const S = D.series[r.serie];
      items.push(boton("serie de " + fmt(S[3]) + " dictámenes del " + fecha(S[1]), () => elegirSerie(r.serie)));
      if (r.testigo === 1) {
        const b = document.createElement("strong"); b.className = "testigo"; b.textContent = "caso testigo de la serie";
        items.push(b);
      } else {
        const t = todos[S[5]];
        items.push(boton("caso testigo: " + (t.expediente || t.caratula), () => abrir(t)));
      }
    }
    items.forEach((s, i) => { if (i) datos.append(" · "); datos.append(s); });
    li.append(cab, pista, datos);
    return li;
  }

  function boton(txt, accion) {
    const b = document.createElement("button"); b.type = "button"; b.className = "ir"; b.textContent = txt;
    b.addEventListener("click", accion);
    return b;
  }

  function abrir(r) {
    fijado = r; detalle(); marcar(r); $("detalle").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function elegirSerie(i) {
    serieElegida = i;
    const el = $("serie-elegida");
    el.hidden = i == null;
    if (i != null) {
      const S = D.series[i];
      const t = document.createElement("span");
      t.textContent = "Serie del " + fecha(S[1]) + ": " + S[2] + " · " + fmt(S[3]) + " dictámenes, " +
        fmt(S[4]) + " esperando · ";
      el.replaceChildren(t, boton("ver el caso testigo", () => abrir(todos[S[5]])), " ",
                         boton("quitar la serie", () => elegirSerie(null)));
      caja.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    otra();
  }

  function lista() {
    const orden = $("orden").value;
    const out = elegidos.slice();
    const d = r => r.dias == null ? -1 : r.dias;
    out.sort(orden === "antiguos" ? (a, b) => a.t0 - b.t0 : orden === "mas" ? (a, b) => d(b) - d(a)
           : orden === "menos" ? (a, b) => d(a) - d(b) || a.t0 - b.t0 : (a, b) => b.t0 - a.t0);
    $("cuenta").textContent = fmt(out.length);
    $("casos").replaceChildren(...out.slice(0, mostrar).map(r => caso(r)));
    $("mas").hidden = out.length <= mostrar;
  }

  function eje() {  // the years over the list's spans
    const t0 = dia("2015-01-01"), t1 = dia(D.hasta), el = $("eje-casos");
    el.replaceChildren(...[2015, 2018, 2021, 2024].map(a => {
      const s = document.createElement("span"); s.textContent = a;
      s.style.left = ((dia(a + "-01-01") - t0) / (t1 - t0) * 100) + "%";
      return s;
    }));
  }

  function pintar() {
    filtrar();
    const k = km(elegidos);
    cifras(k); dispersion(); curva(k); porAnio(); lista();
  }

  const otra = () => { mostrar = PASO; fijado = null; detalle(); pintar(); };
  ["desde", "hasta", "texto", "estado", "asunto", "camara", "firma", "sentido", "remision", "motivo", "serie"]
    .forEach(id => $(id).addEventListener("input", otra));
  $("orden").addEventListener("input", () => { mostrar = PASO; lista(); });
  caja.querySelectorAll(".rapidos button").forEach(b => b.addEventListener("click", () => {
    $("desde").value = b.dataset.desde; $("hasta").value = b.dataset.hasta; otra();
  }));
  $("limpiar").addEventListener("click", () => {
    caja.querySelectorAll("input, select").forEach(c => { c.value = ""; });
    criba = "";
    document.querySelectorAll("#cribas .criba").forEach(b => b.setAttribute("aria-pressed", b.dataset.criba === ""));
    elegirSerie(null);
  });
  $("mas").addEventListener("click", () => { mostrar += PASO; lista(); });
  function cribar(c) {
    criba = c;
    document.querySelectorAll("#cribas .criba").forEach(b => b.setAttribute("aria-pressed", b.dataset.criba === c));
    otra();
  }
  document.querySelectorAll("#cribas .criba").forEach(b => b.addEventListener("click", () => cribar(b.dataset.criba)));
  let espera;
  new ResizeObserver(() => { clearTimeout(espera); espera = setTimeout(() => D && pintar(), 150); }).observe(disp.el);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => D && pintar());

  fetch(caja.dataset.src).then(r => r.json()).then(d => {
    D = d; todos = preparar(d); kmTodos = km(todos);
    opciones("asunto", d.asuntos);
    opciones("camara", d.camaras, c => d.tribunales[c] ? d.tribunales[c] + " (" + c + ")" : c);
    opciones("firma", d.firmas);
    opciones("sentido", d.sentidos, s => s.toLowerCase());
    opciones("remision", d.remisions, s => s.toLowerCase().replace("pgn", "PGN"));
    if (d.motivos) opciones("motivo", d.motivos, m => MOTIVOS[m] || m);
    const cuenta = c => fmt(todos.filter(r => c === "pendientes" ? r.esperando === 1 : clase(r) === c).length);
    document.querySelectorAll("#cribas .criba[data-criba] .n").forEach(n => { n.textContent = cuenta(n.parentNode.dataset.criba); });
    eje(); pintar();
    // for a search box elsewhere on the page (the public site's header): the rows, and a way to open one case
    caja.dictamenes = { filas: todos, D, fecha, abrir };
    caja.dispatchEvent(new Event("cargados"));
  }).catch(e => { $("cuenta").textContent = "No se pudieron cargar los datos."; console.error(e); });
})();
