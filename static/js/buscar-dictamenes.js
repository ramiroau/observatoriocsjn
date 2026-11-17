// The header's search box: as the reader types, the dictámenes that match (carátula, expediente, voz, Fallos); a
// case chosen opens under the scatter plot, and Enter (or "ver todos") filters the whole page by what was typed.
// It reads the rows dictamenes.js has already loaded (#filtros.dictamenes), so it waits for the "cargados" event.
(() => {
  const form = document.querySelector(".busca"), caja = document.getElementById("filtros");
  if (!form || !caja) return;
  const input = form.querySelector("input"), lista = form.querySelector(".sugerencias");
  const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const fmt = n => n.toLocaleString("es-AR");
  const MAX = 8;
  let activo = -1, hallados = [];

  // every word typed must appear; the carátula's first party and whole words of it rank first, then the newest
  function buscar(q) {
    const ws = norm(q).split(/\s+/).filter(Boolean);
    if (!ws.length) return [];
    const out = [];
    for (const r of caja.dictamenes.filas) {
      if (!ws.every(w => r.buscar.includes(w))) continue;
      const k = " " + norm(r.caratula);
      let s = k.startsWith(" " + ws[0]) ? 3 : 0;
      for (const w of ws) if (k.includes(" " + w)) s += 2;
      if (r.expediente && norm(r.expediente).includes(ws.join(" "))) s += 5;
      out.push([s, r]);
    }
    return out.sort((a, b) => b[0] - a[0] || b[1].t0 - a[1].t0).map(x => x[1]);
  }

  const estado = r => r.sinExpediente ? "sin expediente"
    : r.decidido ? (r.dias == null ? "decidido" : "decidido en " + fmt(r.dias) + " días")
    : "esperando" + (r.dias == null ? "" : " hace " + fmt(r.dias) + " días");

  function mostrar() {
    const q = input.value.trim();
    activo = -1;
    if (!q) { cerrar(); return; }
    lista.replaceChildren();
    if (!caja.dictamenes) {
      const p = document.createElement("p"); p.className = "nada"; p.textContent = "Cargando los datos…";
      lista.append(p);
    } else {
      hallados = buscar(q);
      const { fecha } = caja.dictamenes;
      hallados.slice(0, MAX).forEach((r, i) => {
        const a = document.createElement("a");
        a.href = "#detalle"; a.setAttribute("role", "option"); a.dataset.i = i;
        const t = document.createElement("span"); t.className = "t"; t.textContent = r.caratula || r.expediente;
        const tp = document.createElement("span"); tp.className = "tp";
        tp.textContent = [r.expediente, "dictamen " + fecha(r.fecha_dictamen), estado(r)].filter(Boolean).join(" · ");
        a.append(t, tp);
        lista.append(a);
      });
      if (!hallados.length) {
        const p = document.createElement("p"); p.className = "nada"; p.textContent = "Ningún dictamen coincide.";
        lista.append(p);
      } else {
        const a = document.createElement("a");
        a.href = "#casos"; a.className = "todos"; a.setAttribute("role", "option"); a.dataset.i = "todos";
        a.textContent = hallados.length === 1 ? "Ver el caso en la lista" : "Ver los " + fmt(hallados.length) + " casos en la lista";
        lista.append(a);
      }
    }
    lista.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function cerrar() {
    lista.hidden = true; activo = -1;
    input.setAttribute("aria-expanded", "false");
  }

  function elegir(i) {
    cerrar();
    if (i === "todos" || i == null) {  // the whole page, filtered by the words typed
      const texto = document.getElementById("texto");
      texto.value = input.value.trim();
      texto.dispatchEvent(new Event("input", { bubbles: true }));
      document.getElementById("casos").scrollIntoView({ behavior: "smooth", block: "start" });
    } else caja.dictamenes.abrir(hallados[+i]);
  }

  let espera;
  input.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(mostrar, 120); });
  input.addEventListener("focus", () => { if (input.value.trim()) mostrar(); });
  caja.addEventListener("cargados", () => { if (document.activeElement === input && input.value.trim()) mostrar(); });
  input.addEventListener("keydown", e => {
    const items = [...lista.querySelectorAll("a")];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (lista.hidden || !items.length) return;
      e.preventDefault();
      activo = e.key === "ArrowDown" ? (activo + 1) % items.length : (activo <= 0 ? items.length : activo) - 1;
      items.forEach((a, j) => a.setAttribute("aria-selected", j === activo ? "true" : "false"));
      items[activo].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Escape") cerrar();
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!caja.dictamenes || !input.value.trim()) return;
    const a = activo >= 0 && lista.querySelectorAll("a")[activo];
    elegir(a ? a.dataset.i : "todos");
  });
  lista.addEventListener("mousedown", e => e.preventDefault());  // keep the focus, so the click lands
  lista.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    elegir(a.dataset.i);
  });
  input.addEventListener("blur", () => setTimeout(cerrar, 100));
})();
