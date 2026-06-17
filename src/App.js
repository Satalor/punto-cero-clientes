import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── DATOS ────────────────────────────────────────────────────────────────────
const WHATSAPP = "5578944681";
const VEHICULOS = ["🚗 Compacto / Sedán", "🚙 Camioneta / SUV", "🚐 Van / Pickup"];

// duracionBloque = horas que el servicio bloquea en la agenda (servicio + traslado incluido)
const CATALOGO = [
  { id: 1, nombre: "Lavado Exterior", desc: "Carrocería, llantas y vidrios exteriores con hidrolavadora.", duracion: "45 min", duracionBloque: 1.5, icono: "💧", cat: "basico", precios: [299, 349, 399], incluye: ["Lavado con hidrolavadora", "Secado completo", "Limpieza de llantas", "Vidrios exteriores"] },
  { id: 2, nombre: "Lavado Interior", desc: "Aspirado, tablero, puertas y vidrios interiores.", duracion: "45 min", duracionBloque: 1.5, icono: "🧹", cat: "basico", precios: [299, 349, 399], incluye: ["Aspirado de tapetes y asientos", "Limpieza de tablero", "Limpieza de puertas", "Vidrios interiores"] },
  { id: 3, nombre: "Detallado Completo", desc: "Interior + exterior. Nuestro servicio más solicitado.", duracion: "2 hrs", duracionBloque: 2.5, icono: "✨", cat: "popular", precios: [549, 649, 749], incluye: ["Todo del lavado exterior", "Todo del lavado interior", "Brillado de llantas", "Ambientador incluido"] },
  { id: 4, nombre: "Pulido de Pintura", desc: "Elimina rayones superficiales y restaura el brillo original.", duracion: "3-4 hrs", duracionBloque: 4.5, icono: "🔆", cat: "premium", precios: [899, 1099, 1299], incluye: ["Lavado previo", "Pulido con máquina orbital", "Corrección de rayones leves", "Brillo profundo"] },
  { id: 5, nombre: "Encerado y Protección", desc: "Cera protectora que cuida tu pintura hasta 3 meses.", duracion: "2-3 hrs", duracionBloque: 3.5, icono: "🛡️", cat: "premium", precios: [699, 849, 999], incluye: ["Lavado previo", "Descontaminación de pintura", "Cera carnauba", "Protección 3 meses"] },
  { id: 6, nombre: "Descontaminación", desc: "Savia, manchas de agua, excremento de aves y más.", duracion: "1.5 hrs", duracionBloque: 2.5, icono: "🧪", cat: "especial", precios: [499, 599, 699], incluye: ["Lavado previo", "Descontaminante químico", "Clay bar", "Enjuague y secado"] },
  { id: 7, nombre: "Detallado Premium", desc: "Lo mejor de todo. Pulido + encerado + interior y exterior.", duracion: "5-6 hrs", duracionBloque: 6.5, icono: "👑", cat: "premium", precios: [1499, 1799, 2099], incluye: ["Detallado completo", "Pulido de pintura", "Encerado y protección", "Limpieza profunda de tapicería", "Restauración de plásticos", "Ambientador premium"] },
  { id: 8, nombre: "Limpieza de Tapicería", desc: "Lavado profundo de asientos, tapetes y techo interior.", duracion: "2-3 hrs", duracionBloque: 3.5, icono: "🧽", cat: "especial", precios: [599, 749, 899], incluye: ["Aspirado profundo", "Extracción de manchas", "Limpieza con espuma", "Secado y acondicionado"] },
];

// Helpers de tiempo: convierten "09:00" <-> minutos desde medianoche, y suman duraciones en horas
const horaAMinutos = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };
const minutosAHora = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const CAT_STYLE = {
  basico:  { color: "#3b82f6", label: "Básico" },
  popular: { color: "#22c55e", label: "⭐ Popular" },
  premium: { color: "#f59e0b", label: "Premium" },
  especial:{ color: "#a855f7", label: "Especial" },
};

const FIDELIDAD_TOTAL = 8;
const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

// ── STORAGE HELPERS (fidelidad sigue local, eso no necesita compartirse) ─────
const getSellos = () => { try { return parseInt(localStorage.getItem("pc_sellos") || "0"); } catch { return 0; } };
const setSellos = (n) => { try { localStorage.setItem("pc_sellos", String(n)); } catch {} };

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function ClienteApp() {
  const [tab, setTab] = useState("inicio");
  const [vehiculo, setVehiculo] = useState(0);
  const [expandido, setExpandido] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  // Agendar
  const [agenda, setAgenda] = useState({ nombre: "", telefono: "", direccion: "", servicio: "", vehiculo: VEHICULOS[0], fecha: "", hora: "", notas: "" });
  const [agendaStep, setAgendaStep] = useState(1); // 1=form, 2=confirmado
  const [agendaError, setAgendaError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Disponibilidad
  const [horarios, setHorarios] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);

  // Fidelidad
  const [sellos, setSellosState] = useState(getSellos);
  // eslint-disable-next-line no-unused-vars
  const [showPremio, setShowPremio] = useState(false);

  // Cargar configuración de horarios al iniciar
  useEffect(() => {
    const cargarHorarios = async () => {
      const { data, error } = await supabase.from("horarios_disponibilidad").select("*");
      if (!error && data) setHorarios(data);
    };
    cargarHorarios();
  }, []);

  // Cuando cambia la fecha o el servicio seleccionado, recalcular horas disponibles
  useEffect(() => {
    if (!agenda.fecha || !agenda.servicio) { setHorasDisponibles([]); return; }
    calcularHorasDisponibles(agenda.fecha, agenda.servicio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenda.fecha, agenda.servicio, horarios]);

  const calcularHorasDisponibles = async (fechaStr, nombreServicio) => {
    setCargandoHoras(true);
    const fecha = new Date(fechaStr + "T00:00:00");
    const diaSemana = fecha.getDay(); // 0=domingo

    const config = horarios.find(h => h.dia_semana === diaSemana);
    if (!config || !config.activo) {
      setHorasDisponibles([]);
      setCargandoHoras(false);
      return;
    }

    const servicioElegido = CATALOGO.find(s => s.nombre === nombreServicio);
    const duracionNueva = servicioElegido ? servicioElegido.duracionBloque : 2; // horas, default de seguridad

    const inicioMin = horaAMinutos(config.hora_inicio);
    const finMin = horaAMinutos(config.hora_fin);

    // Consultar citas ya existentes para esa fecha (no canceladas), con su servicio para saber cuánto ocupan
    const { data: citasExistentes } = await supabase
      .from("citas")
      .select("hora, servicio, estado")
      .eq("fecha", fechaStr)
      .neq("estado", "cancelada");

    // Convertir cada cita existente a un rango ocupado [inicio, fin) en minutos
    const rangosOcupados = (citasExistentes || []).map(c => {
      const s = CATALOGO.find(x => x.nombre === c.servicio);
      const dur = s ? s.duracionBloque : 2;
      const ini = horaAMinutos(c.hora);
      return { ini, fin: ini + dur * 60 };
    });

    // Generar slots cada 30 min y verificar que el servicio completo (con su duración) entre sin chocar con otra cita
    const slots = [];
    for (let m = inicioMin; m + duracionNueva * 60 <= finMin; m += 30) {
      const finNuevo = m + duracionNueva * 60;
      const chocaConOtra = rangosOcupados.some(r => m < r.fin && finNuevo > r.ini);
      if (!chocaConOtra) {
        slots.push(minutosAHora(m));
      }
    }

    setHorasOcupadas(rangosOcupados.map(r => minutosAHora(r.ini)));
    setHorasDisponibles(slots);
    setCargandoHoras(false);
  };

  const abrirWhatsApp = (msg) => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

  const cotizarWhatsApp = (s) => {
    const msg = `Hola! Me interesa el servicio de *${s.nombre}* para mi ${VEHICULOS[vehiculo].replace(/^.{2}/, "").trim()}.\nPrecio: ${fmt(s.precios[vehiculo])}\n¿Tienen disponibilidad?`;
    abrirWhatsApp(msg);
  };

  const confirmarCita = async () => {
    if (!agenda.nombre || !agenda.telefono || !agenda.servicio || !agenda.fecha || !agenda.hora || !agenda.direccion) {
      setAgendaError("Por favor llena todos los campos obligatorios.");
      return;
    }
    setAgendaError("");
    setEnviando(true);

    // Verificación final: confirmar que el rango de tiempo sigue libre (evita doble-booking si dos personas agendan a la vez)
    const servicioElegido = CATALOGO.find(s => s.nombre === agenda.servicio);
    const duracionNueva = servicioElegido ? servicioElegido.duracionBloque : 2;
    const inicioNuevoMin = horaAMinutos(agenda.hora);
    const finNuevoMin = inicioNuevoMin + duracionNueva * 60;

    const { data: citasDelDia } = await supabase
      .from("citas")
      .select("id, hora, servicio")
      .eq("fecha", agenda.fecha)
      .neq("estado", "cancelada");

    const hayChoque = (citasDelDia || []).some(c => {
      const s = CATALOGO.find(x => x.nombre === c.servicio);
      const dur = s ? s.duracionBloque : 2;
      const ini = horaAMinutos(c.hora);
      const fin = ini + dur * 60;
      return inicioNuevoMin < fin && finNuevoMin > ini;
    });

    if (hayChoque) {
      setAgendaError("Justo se ocupó ese horario. Por favor elige otra hora disponible.");
      setEnviando(false);
      calcularHorasDisponibles(agenda.fecha, agenda.servicio);
      return;
    }

    const { error } = await supabase.from("citas").insert([{
      nombre: agenda.nombre,
      telefono: agenda.telefono,
      direccion: agenda.direccion,
      servicio: agenda.servicio,
      vehiculo: agenda.vehiculo,
      fecha: agenda.fecha,
      hora: agenda.hora,
      notas: agenda.notas || null,
      estado: "pendiente",
    }]);

    setEnviando(false);

    if (error) {
      setAgendaError("Hubo un problema al guardar tu cita. Intenta de nuevo o contáctanos por WhatsApp.");
      return;
    }

    const msg = `Hola! Quiero agendar una cita:\n👤 *${agenda.nombre}*\n📞 ${agenda.telefono}\n🚗 ${agenda.vehiculo}\n🛠 ${agenda.servicio}\n📅 ${agenda.fecha} a las ${agenda.hora}\n📍 ${agenda.direccion}${agenda.notas ? `\n📝 ${agenda.notas}` : ""}\n\n(Ya registré mi cita en el sistema, queda pendiente de su confirmación)`;
    abrirWhatsApp(msg);
    setAgendaStep(2);
  };

  const agregarSello = () => {
    const nuevo = Math.min(sellos + 1, FIDELIDAD_TOTAL);
    setSellosState(nuevo);
    setSellos(nuevo);
    if (nuevo >= FIDELIDAD_TOTAL) setShowPremio(true);
  };

  const resetFidelidad = () => { setSellosState(0); setSellos(0); setShowPremio(false); };

  const inp = { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "11px 14px", color: "white", fontSize: 14, boxSizing: "border-box", outline: "none" };
  const lbl = { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 };

  const TABS = [
    { id: "inicio", icon: "🏠", label: "Inicio" },
    { id: "servicios", icon: "✨", label: "Servicios" },
    { id: "agendar", icon: "📅", label: "Agendar" },
    { id: "fidelidad", icon: "🎁", label: "Mi Tarjeta" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#0a1628", paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #0d2347, #1a3a6b)", padding: "22px 20px 18px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #00b4ff, #0066cc)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 24, margin: "0 auto 10px" }}>P</div>
        <div style={{ color: "white", fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>Punto Cero Detallado</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 3 }}>Tu auto de vuelta a Punto Cero · CDMX & Puebla</div>
        <button onClick={() => abrirWhatsApp("Hola! Me gustaría más información sobre sus servicios.")} style={{ marginTop: 14, background: "#25d366", border: "none", color: "white", padding: "10px 22px", borderRadius: 24, fontWeight: 700, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span>📱</span> WhatsApp · 55 7894 4681
        </button>
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── INICIO ── */}
        {tab === "inicio" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, rgba(0,180,255,0.15), rgba(0,102,204,0.1))", border: "1px solid rgba(0,180,255,0.25)", borderRadius: 20, padding: "28px 24px", marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚗💨</div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Detallado automotriz a domicilio</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Llevamos el servicio a donde estés. Sin que muevas tu auto — nosotros llegamos a ti.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setTab("servicios")} style={{ background: "linear-gradient(135deg, #00b4ff, #0066cc)", border: "none", color: "white", padding: "12px 24px", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Ver servicios</button>
                <button onClick={() => setTab("agendar")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "12px 24px", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Agendar cita</button>
              </div>
            </div>

            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>¿Por qué elegirnos?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { icon: "🏠", title: "A domicilio", desc: "Llegamos a tu casa, trabajo o donde nos necesites" },
                { icon: "⭐", title: "Alta calidad", desc: "Productos profesionales y atención al detalle" },
                { icon: "⏱", title: "Puntualidad", desc: "Respetamos tu tiempo y horario acordado" },
                { icon: "💰", title: "Precio justo", desc: "Servicio premium a precios accesibles" },
              ].map((c) => (
                <div key={c.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 14px" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5 }}>{c.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Más solicitados</div>
            {CATALOGO.filter(s => s.cat === "popular" || s.id === 1).map(s => (
              <div key={s.id} onClick={() => { setTab("servicios"); setExpandido(s.id); }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 18px", marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{s.icono}</span>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{s.nombre}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Desde {fmt(s.precios[0])}</div>
                  </div>
                </div>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>›</span>
              </div>
            ))}
          </div>
        )}

        {/* ── SERVICIOS ── */}
        {tab === "servicios" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>¿Qué tipo de vehículo tienes?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {VEHICULOS.map((v, i) => (
                  <button key={v} onClick={() => setVehiculo(i)} style={{ padding: "10px 16px", borderRadius: 12, border: vehiculo === i ? "2px solid #00b4ff" : "2px solid rgba(255,255,255,0.1)", background: vehiculo === i ? "rgba(0,180,255,0.15)" : "rgba(255,255,255,0.04)", color: vehiculo === i ? "#00b4ff" : "rgba(255,255,255,0.5)", fontWeight: vehiculo === i ? 700 : 500, cursor: "pointer", fontSize: 13 }}>{v}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {[["todos", "Todos"], ["basico", "Básicos"], ["popular", "Populares"], ["premium", "Premium"], ["especial", "Especiales"]].map(([k, l]) => (
                <button key={k} onClick={() => setFiltro(k)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filtro === k ? "#00b4ff" : "rgba(255,255,255,0.1)"}`, background: filtro === k ? "rgba(0,180,255,0.15)" : "transparent", color: filtro === k ? "#00b4ff" : "rgba(255,255,255,0.4)", fontWeight: filtro === k ? 700 : 500, cursor: "pointer", fontSize: 12 }}>{l}</button>
              ))}
            </div>

            {(filtro === "todos" ? CATALOGO : CATALOGO.filter(s => s.cat === filtro)).map(s => {
              const cs = CAT_STYLE[s.cat];
              const open = expandido === s.id;
              return (
                <div key={s.id} style={{ background: `${cs.color}18`, border: `1px solid ${cs.color}55`, borderRadius: 18, marginBottom: 12, overflow: "hidden" }}>
                  <div onClick={() => setExpandido(open ? null : s.id)} style={{ padding: "18px 20px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 26 }}>{s.icono}</span>
                        <div>
                          <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{s.nombre}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                            <span style={{ background: cs.color, color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{cs.label}</span>
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>⏱ {s.duracion}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#00b4ff", fontWeight: 900, fontSize: 20 }}>{fmt(s.precios[vehiculo])}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{VEHICULOS[vehiculo].replace(/^.{2}/, "")}</div>
                      </div>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{s.desc}</div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 8, textAlign: "right" }}>{open ? "▲ menos" : "▼ más info"}</div>
                  </div>
                  {open && (
                    <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${cs.color}44` }}>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 10, marginTop: 14 }}>¿Qué incluye?</div>
                      {s.incluye.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: cs.color, flexShrink: 0 }} />
                          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{item}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                        <button onClick={() => { setAgenda(a => ({ ...a, servicio: s.nombre, vehiculo: VEHICULOS[vehiculo] })); setTab("agendar"); }} style={{ flex: 1, background: "linear-gradient(135deg, #00b4ff, #0066cc)", border: "none", color: "white", padding: "12px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>📅 Agendar</button>
                        <button onClick={() => cotizarWhatsApp(s)} style={{ flex: 1, background: "#25d36622", border: "1px solid #25d36666", color: "#25d366", padding: "12px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>💬 WhatsApp</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", marginTop: 8 }}>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.7 }}>
                📌 Servicio a domicilio sin costo adicional dentro de la zona de cobertura · Se requiere acceso a toma de agua y corriente eléctrica · Precios pueden variar según estado del vehículo y suciedad excesiva (pelo de mascota, vómito, etc.) — cualquier duda, contáctanos por WhatsApp
              </div>
            </div>
          </div>
        )}

        {/* ── AGENDAR ── */}
        {tab === "agendar" && (
          <div>
            {agendaStep === 1 ? (
              <>
                <div style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>📅 Agendar cita</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 22 }}>Llena el formulario. Tu cita queda pendiente de confirmación.</div>

                {[
                  { label: "Tu nombre *", key: "nombre", type: "text", placeholder: "¿Cómo te llamamos?" },
                  { label: "Tu teléfono / WhatsApp *", key: "telefono", type: "tel", placeholder: "55 1234 5678" },
                  { label: "Dirección del servicio *", key: "direccion", type: "text", placeholder: "Calle, número, colonia, ciudad, C.P." },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={lbl}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={agenda[f.key]} onChange={e => setAgenda(a => ({ ...a, [f.key]: e.target.value }))} style={inp} />
                  </div>
                ))}

                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Servicio que deseas *</label>
                  <select value={agenda.servicio} onChange={e => setAgenda(a => ({ ...a, servicio: e.target.value, hora: "" }))} style={inp}>
                    <option value="" style={{ background: "#0d1f3c" }}>Selecciona un servicio...</option>
                    {CATALOGO.map(s => <option key={s.id} value={s.nombre} style={{ background: "#0d1f3c" }}>{s.icono} {s.nombre} ({s.duracion})</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Tipo de vehículo *</label>
                  <select value={agenda.vehiculo} onChange={e => setAgenda(a => ({ ...a, vehiculo: e.target.value }))} style={inp}>
                    {VEHICULOS.map(v => <option key={v} value={v} style={{ background: "#0d1f3c" }}>{v}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Fecha *</label>
                  <input type="date" value={agenda.fecha} min={new Date().toISOString().split("T")[0]} disabled={!agenda.servicio} onChange={e => setAgenda(a => ({ ...a, fecha: e.target.value, hora: "" }))} style={{ ...inp, opacity: agenda.servicio ? 1 : 0.4 }} />
                  {!agenda.servicio && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 6 }}>Primero elige un servicio para ver fechas disponibles</div>}
                </div>

                {agenda.fecha && agenda.servicio && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Hora disponible *</label>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 10 }}>Este servicio dura aprox. {CATALOGO.find(s => s.nombre === agenda.servicio)?.duracion} — el sistema ya considera tiempo de traslado entre citas</div>
                    {cargandoHoras ? (
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, padding: "10px 0" }}>Consultando disponibilidad...</div>
                    ) : horasDisponibles.length === 0 ? (
                      <div style={{ color: "#f59e0b", fontSize: 13, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "12px 14px" }}>
                        No hay horarios disponibles ese día para este servicio. Intenta otra fecha o contáctanos por WhatsApp.
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {horasDisponibles.map(h => (
                          <button key={h} onClick={() => setAgenda(a => ({ ...a, hora: h }))} style={{ padding: "9px 16px", borderRadius: 10, border: agenda.hora === h ? "2px solid #00b4ff" : "1px solid rgba(255,255,255,0.15)", background: agenda.hora === h ? "rgba(0,180,255,0.2)" : "rgba(255,255,255,0.05)", color: agenda.hora === h ? "#00b4ff" : "white", fontWeight: agenda.hora === h ? 700 : 500, cursor: "pointer", fontSize: 13 }}>
                            {h}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>Notas adicionales (opcional)</label>
                  <input type="text" placeholder="Ej: portón azul, perro en casa, estaciono en calle..." value={agenda.notas} onChange={e => setAgenda(a => ({ ...a, notas: e.target.value }))} style={inp} />
                </div>

                {agendaError && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 14, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px" }}>{agendaError}</div>}

                <button onClick={confirmarCita} disabled={enviando} style={{ width: "100%", background: enviando ? "rgba(37,211,102,0.4)" : "linear-gradient(135deg, #25d366, #128c5e)", border: "none", color: "white", padding: "15px", borderRadius: 14, fontWeight: 800, cursor: enviando ? "not-allowed" : "pointer", fontSize: 15 }}>
                  {enviando ? "Enviando..." : "📲 Confirmar por WhatsApp"}
                </button>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", marginTop: 10 }}>Tu cita queda registrada y pendiente de confirmación del equipo</div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 20, marginBottom: 10 }}>¡Cita registrada!</div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>Tu cita está pendiente de confirmación. Te contactaremos por WhatsApp para confirmarla. ¡Gracias por elegirnos!</div>
                <button onClick={() => { setAgendaStep(1); setAgenda({ nombre: "", telefono: "", direccion: "", servicio: "", vehiculo: VEHICULOS[0], fecha: "", hora: "", notas: "" }); }} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", padding: "12px 28px", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                  Nueva cita
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── FIDELIDAD ── */}
        {tab === "fidelidad" && (
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>🎁 Mi Tarjeta de Fidelidad</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 24 }}>Completa {FIDELIDAD_TOTAL} servicios y gana uno gratis.</div>

            <div style={{ background: "linear-gradient(135deg, #0d2347, #1a3a6b)", border: "2px solid rgba(0,180,255,0.35)", borderRadius: 22, padding: "28px 24px", marginBottom: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>Punto Cero Detallado</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Tarjeta de cliente frecuente</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #00b4ff, #0066cc)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 18 }}>P</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {Array.from({ length: FIDELIDAD_TOTAL }).map((_, i) => (
                  <div key={i} style={{ aspectRatio: "1", borderRadius: 12, border: i < sellos ? "2px solid #00b4ff" : "2px dashed rgba(255,255,255,0.15)", background: i < sellos ? "rgba(0,180,255,0.2)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transition: "all 0.3s" }}>
                    {i < sellos ? "🚗" : ""}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{sellos}/{FIDELIDAD_TOTAL} servicios completados</div>
                <div style={{ color: "#00b4ff", fontWeight: 700, fontSize: 12 }}>{FIDELIDAD_TOTAL - sellos} para tu regalo 🎁</div>
              </div>

              <div style={{ marginTop: 12, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(sellos / FIDELIDAD_TOTAL) * 100}%`, background: "linear-gradient(90deg, #00b4ff, #0066cc)", borderRadius: 10, transition: "width 0.4s" }} />
              </div>
            </div>

            {sellos >= FIDELIDAD_TOTAL && (
              <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,163,74,0.1))", border: "2px solid #22c55e", borderRadius: 18, padding: "22px 20px", marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
                <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>¡Felicidades! Ganaste un servicio gratis</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 16 }}>Muéstrale esta pantalla a tu detallador para canjear tu premio.</div>
                <button onClick={() => abrirWhatsApp("Hola! Completé mi tarjeta de fidelidad y quiero canjear mi servicio gratuito 🎁")} style={{ background: "#25d366", border: "none", color: "white", padding: "12px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>💬 Canjear por WhatsApp</button>
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.7 }}>
                ℹ️ Cada sello representa un servicio completado. Al llegar a {FIDELIDAD_TOTAL} servicios recibes <strong style={{ color: "white" }}>un lavado exterior gratis</strong>. Los sellos son registrados por tu detallador al finalizar cada servicio.
              </div>
            </div>

            <button onClick={agregarSello} disabled={sellos >= FIDELIDAD_TOTAL} style={{ width: "100%", background: sellos >= FIDELIDAD_TOTAL ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #00b4ff, #0066cc)", border: "none", color: sellos >= FIDELIDAD_TOTAL ? "rgba(255,255,255,0.3)" : "white", padding: "14px", borderRadius: 14, fontWeight: 700, cursor: sellos >= FIDELIDAD_TOTAL ? "not-allowed" : "pointer", fontSize: 14, marginBottom: 10 }}>
              {sellos >= FIDELIDAD_TOTAL ? "🎁 ¡Tarjeta completa!" : "➕ Agregar sello (uso del detallador)"}
            </button>
            {sellos > 0 && <button onClick={resetFidelidad} style={{ width: "100%", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "rgba(239,68,68,0.6)", padding: "10px", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Reiniciar tarjeta</button>}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,22,40,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "12px 4px", background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#00b4ff" : "rgba(255,255,255,0.35)" }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 16, height: 2, background: "#00b4ff", borderRadius: 2 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
