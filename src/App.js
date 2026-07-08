import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── DATOS ────────────────────────────────────────────────────────────────────
const WHATSAPP = "5578944681";
const VEHICULOS = ["Compacto / Sedán", "Camioneta / SUV", "Van / Pickup"];

const ZONAS_CDMX = ["Azcapotzalco", "Cuauhtémoc", "Benito Juárez"];
const ZONAS_PUEBLA = ["San Andrés Cholula", "Puebla", "Angelópolis", "Lomas de Angelópolis"];

const CATALOGO = [
  { id: 1, nombre: "Detallado Exterior", desc: "Carrocería, llantas y vidrios exteriores con hidrolavadora.", duracion: "45 min", duracionBloque: 1.5, cat: "basico", precios: [299, 349, 399], incluye: ["Lavado con hidrolavadora", "Secado completo", "Limpieza de llantas", "Vidrios exteriores"] },
  { id: 2, nombre: "Detallado Interior", desc: "Aspirado, tablero, puertas y vidrios interiores.", duracion: "45 min", duracionBloque: 1.5, cat: "basico", precios: [299, 349, 399], incluye: ["Aspirado de tapetes y asientos", "Limpieza de tablero", "Limpieza de puertas", "Vidrios interiores"] },
  { id: 3, nombre: "Detallado Completo", desc: "Interior + exterior. Nuestro servicio más solicitado.", duracion: "2 hrs", duracionBloque: 2.5, cat: "popular", precios: [549, 649, 749], incluye: ["Todo del lavado exterior", "Todo del lavado interior", "Brillado de llantas", "Ambientador incluido"] },
 
  { id: 5, nombre: "Encerado y Protección", desc: "Cera protectora que cuida tu pintura hasta 3 meses.", duracion: "2-3 hrs", duracionBloque: 3.5, cat: "premium", precios: [699, 849, 999], incluye: ["Lavado previo", "Descontaminación de pintura", "Cera carnauba", "Protección 3 meses"] },
  { id: 6, nombre: "Descontaminación", desc: "Savia, manchas de agua, excremento de aves y más.", duracion: "1.5 hrs", duracionBloque: 2.5, cat: "especial", precios: [499, 599, 699], incluye: ["Lavado previo", "Descontaminante químico", "Clay bar", "Enjuague y secado"] },
  { id: 7, nombre: "Detallado Premium", desc: "Lo mejor de todo. Pulido + encerado + interior y exterior.", duracion: "5-6 hrs", duracionBloque: 6.5, cat: "premium", precios: [1499, 1799, 2099], incluye: ["Detallado completo", "Pulido de pintura", "Encerado y protección", "Limpieza profunda de tapicería", "Restauración de plásticos", "Ambientador premium"] },
  { id: 8, nombre: "Limpieza de Tapicería", desc: "Lavado profundo de asientos, tapetes y techo interior.", duracion: "2-3 hrs", duracionBloque: 3.5, cat: "especial", precios: [599, 749, 899], incluye: ["Aspirado profundo", "Extracción de manchas", "Limpieza con espuma", "Secado y acondicionado"] },
];

const horaAMinutos = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };
const minutosAHora = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const T = {
  paper: "#F3F1EA", paperAlt: "#EBE8DF", surface: "#FFFFFF", ink: "#16181C",
  inkSoft: "#6B6E74", inkFaint: "#A8A9A2", line: "#DBD7CB", marine: "#1C3A56",
  marineSoft: "#1C3A5612", brass: "#9C7A3C", brassSoft: "#9C7A3C15",
  teal: "#3F6357", tealSoft: "#3F635715", whats: "#3F7D58", whatsSoft: "#3F7D5815",
  error: "#A23B2E", errorSoft: "#A23B2E12",
};

const CAT_STYLE = {
  basico: { color: T.inkSoft, bg: "#6B6E7412", label: "Básico" },
  popular: { color: T.brass, bg: T.brassSoft, label: "Popular" },
  premium: { color: T.marine, bg: T.marineSoft, label: "Premium" },
  especial: { color: T.teal, bg: T.tealSoft, label: "Especial" },
};

const ANTES_DESPUES = [];

const MARCAS = [
  { nombre: "Black+Decker", desc: "Hidrolavadora", color: "#1C3A56", logo: "/logos/black-decker.png" },
  { nombre: "Karcher", desc: "Lava-aspiradora", color: "#9C7A3C", logo: "/logos/karcher.png" },
  { nombre: "Koblenz", desc: "Aspiradora", color: "#3F6357", logo: "/logos/koblenz.png" },
];

const PROMO_VIDEO_URL = "/promo.mp4";

const INSTA_POSTS = [
  { usuario: "@puntocerodetallado", link: "https://www.instagram.com/puntocerodetallado/", imagen: null },
];

const MARGEN_ANTICIPACION_MIN = 60;
const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

function useFonts() {
  useEffect(() => {
    if (document.getElementById("pc-fonts")) return;
    const link = document.createElement("link");
    link.id = "pc-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

export default function ClienteApp() {
  useFonts();
  const [tab, setTab] = useState("inicio");
  const [showPrivacidad, setShowPrivacidad] = useState(false);
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(() => { try { return localStorage.getItem("pc_acepto_privacidad") === "1"; } catch { return false; } });
  const aceptarPrivacidad = () => { try { localStorage.setItem("pc_acepto_privacidad", "1"); } catch {} setAceptoPrivacidad(true); };
  const [vehiculo, setVehiculo] = useState(0);
  const [expandido, setExpandido] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const [agenda, setAgenda] = useState({ nombre: "", telefono: "", ciudad: "", zona: "", direccion: "", servicio: "", vehiculo: VEHICULOS[0], fecha: "", hora: "", notas: "" });
  const [agendaStep, setAgendaStep] = useState(1);
  const [agendaError, setAgendaError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [horarios, setHorarios] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);

  useEffect(() => {
    const cargarHorarios = async () => {
      const { data, error } = await supabase.from("horarios_disponibilidad").select("*");
      if (!error && data) setHorarios(data);
    };
    cargarHorarios();
  }, []);

  useEffect(() => {
    if (!agenda.fecha || !agenda.servicio) { setHorasDisponibles([]); return; }
    calcularHorasDisponibles(agenda.fecha, agenda.servicio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenda.fecha, agenda.servicio, horarios]);

  const calcularHorasDisponibles = async (fechaStr, nombreServicio) => {
    setCargandoHoras(true);
    const fecha = new Date(fechaStr + "T00:00:00");
    const diaSemana = fecha.getDay();

    const config = horarios.find(h => h.dia_semana === diaSemana);
    if (!config || !config.activo) {
      setHorasDisponibles([]);
      setCargandoHoras(false);
      return;
    }

    const servicioElegido = CATALOGO.find(s => s.nombre === nombreServicio);
    const duracionNueva = servicioElegido ? servicioElegido.duracionBloque : 2;

    const inicioMin = horaAMinutos(config.hora_inicio);
    const finMin = horaAMinutos(config.hora_fin);

    const ahora = new Date();
    const esHoy = fecha.toDateString() === ahora.toDateString();
    const minutoMinimoHoy = ahora.getHours() * 60 + ahora.getMinutes() + MARGEN_ANTICIPACION_MIN;
    let inicioReal = inicioMin;
    if (esHoy && minutoMinimoHoy > inicioMin) {
      const pasos = Math.ceil((minutoMinimoHoy - inicioMin) / 30);
      inicioReal = inicioMin + pasos * 30;
    }

    const { data: citasExistentes } = await supabase
      .from("citas")
      .select("hora, servicio, estado")
      .eq("fecha", fechaStr)
      .neq("estado", "cancelada");

    const rangosOcupados = (citasExistentes || []).map(c => {
      const s = CATALOGO.find(x => x.nombre === c.servicio);
      const dur = s ? s.duracionBloque : 2;
      const ini = horaAMinutos(c.hora);
      return { ini, fin: ini + dur * 60 };
    });

    const slots = [];
    for (let m = inicioReal; m + duracionNueva * 60 <= finMin; m += 30) {
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
    const msg = `Hola! Me interesa el servicio de *${s.nombre}* para mi ${VEHICULOS[vehiculo]}.\nPrecio: ${fmt(s.precios[vehiculo])}\n¿Tienen disponibilidad?`;
    abrirWhatsApp(msg);
  };

  const confirmarCita = async () => {
    if (!agenda.nombre || !agenda.telefono || !agenda.servicio || !agenda.fecha || !agenda.hora || !agenda.direccion || !agenda.ciudad || !agenda.zona) {
      setAgendaError("Por favor llena todos los campos obligatorios, incluyendo ciudad y zona.");
      return;
    }
    setAgendaError("");
    setEnviando(true);

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
      ciudad: agenda.ciudad,
      zona: agenda.zona,
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

    const msg = `Hola! Quiero agendar una cita:\n👤 *${agenda.nombre}*\n📞 ${agenda.telefono}\n🚗 ${agenda.vehiculo}\n🛠 ${agenda.servicio}\n📅 ${agenda.fecha} a las ${agenda.hora}\n📍 ${agenda.ciudad} - ${agenda.zona}, ${agenda.direccion}${agenda.notas ? `\n📝 ${agenda.notas}` : ""}\n\n(Ya registré mi cita en el sistema, queda pendiente de su confirmación)`;
    abrirWhatsApp(msg);
    setAgendaStep(2);
  };

  const serif = { fontFamily: "'Fraunces', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const eyebrow = { ...mono, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: 2, color: T.inkFaint, marginBottom: 14, display: "block" };
  const inp = { width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.line}`, borderRadius: 0, padding: "10px 2px", color: T.ink, fontSize: 15, fontFamily: "'Inter', sans-serif", boxSizing: "border-box", outline: "none" };
  const lbl = { ...mono, color: T.inkFaint, fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1.5, display: "block", marginBottom: 8 };

  const btnPrimary = { background: T.marine, border: "none", color: T.paper, padding: "14px 26px", fontWeight: 500, cursor: "pointer", fontSize: 14, fontFamily: "'Inter', sans-serif", letterSpacing: 0.2 };
  const btnGhost = { background: "transparent", border: `1px solid ${T.ink}`, color: T.ink, padding: "13px 26px", fontWeight: 500, cursor: "pointer", fontSize: 14, fontFamily: "'Inter', sans-serif", letterSpacing: 0.2 };
  const btnWhats = { background: T.whats, border: "none", color: "#fff", padding: "13px 22px", fontWeight: 500, cursor: "pointer", fontSize: 13.5, fontFamily: "'Inter', sans-serif" };

  const TABS = [
    { id: "inicio", label: "Inicio" },
    { id: "servicios", label: "Servicios" },
    { id: "agendar", label: "Agendar" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: T.paper, paddingBottom: 88, color: T.ink }}>
      <style>{`
        .pc-marquee { animation: pc-scroll 18s linear infinite; }
        @keyframes pc-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        select.pc-input { cursor: pointer; }
        ::selection { background: ${T.brassSoft}; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: T.paper, padding: "22px 20px 16px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ ...serif, fontWeight: 600, fontSize: 21, letterSpacing: 0.2, lineHeight: 1 }}>Punto Cero</div>
            <div style={{ ...mono, fontSize: 10, color: T.inkFaint, letterSpacing: 2, marginTop: 5, textTransform: "uppercase" }}>Detallado · CDMX &amp; Puebla</div>
          </div>
          <button onClick={() => abrirWhatsApp("Hola! Me gustaría más información sobre sus servicios.")} style={{ background: "none", border: "none", borderBottom: `1px solid ${T.ink}`, color: T.ink, padding: "0 0 2px", fontWeight: 500, cursor: "pointer", fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
            WhatsApp ↗
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "36px 20px" }}>

        {/* ── INICIO ── */}
        {tab === "inicio" && (
          <div>
            <div style={{ marginBottom: 44 }}>
              <span style={eyebrow}>A domicilio · CDMX &amp; Puebla</span>
              <div style={{ ...serif, fontWeight: 600, fontSize: 40, lineHeight: 1.08, letterSpacing: -0.5, marginBottom: 18 }}>
                Tu auto,<br />de vuelta a punto cero<span style={{ color: T.brass }}>.</span>
              </div>
              <div style={{ color: T.inkSoft, fontSize: 15, lineHeight: 1.7, marginBottom: 28, maxWidth: 440 }}>
                Detallado automotriz donde tú estés. Sin mover tu auto, sin filas — nosotros llegamos con el equipo completo.
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button onClick={() => setTab("servicios")} style={btnPrimary}>Ver servicios</button>
                <button onClick={() => setTab("agendar")} style={btnGhost}>Agendar cita</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 44, border: `1px solid ${T.line}`, overflow: "hidden", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", background: T.paperAlt, minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {PROMO_VIDEO_URL ? (
                  <video src={PROMO_VIDEO_URL} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ ...mono, fontSize: 10, color: T.inkFaint, letterSpacing: 1, textTransform: "uppercase" }}>Video del servicio</span>
                )}
              </div>
              <div style={{ flex: "1.4 1 260px", background: T.marine, color: T.paper, padding: "26px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ ...mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.brass, marginBottom: 10 }}>Oferta de lanzamiento</span>
                <div style={{ ...serif, fontWeight: 600, fontSize: 32, lineHeight: 1, marginBottom: 10 }}>20% OFF</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, marginBottom: 18 }}>En tu primer servicio. Válido para los primeros 20 clientes de Punto Cero Detallado.</div>
                <button onClick={() => setTab("agendar")} style={{ ...mono, alignSelf: "flex-start", background: T.paper, border: "none", color: T.marine, padding: "11px 22px", fontWeight: 600, cursor: "pointer", fontSize: 12.5, letterSpacing: 0.5 }}>Agendar ahora</button>
              </div>
            </div>

            <div style={{ height: 1, background: T.line, marginBottom: 36 }} />

            <span style={eyebrow}>¿Por qué elegirnos?</span>
            <div style={{ marginBottom: 44 }}>
              {[
                { title: "A domicilio", desc: "Llegamos a tu casa, trabajo o donde nos necesites." },
                { title: "Alta calidad", desc: "Productos profesionales, atención al detalle y técnicas especializadas para el cuidado de tu auto." },
                { title: "Puntualidad", desc: "Respetamos tu tiempo y el horario acordado." },
                { title: "Precio justo", desc: "Servicio premium a precios accesibles." },
              ].map((c, i) => (
                <div key={c.title} style={{ display: "flex", gap: 18, padding: "18px 0", borderTop: i === 0 ? `1px solid ${T.line}` : "none", borderBottom: `1px solid ${T.line}` }}>
                  <div style={{ ...mono, fontSize: 12, color: T.brass, paddingTop: 2, flexShrink: 0, width: 20 }}>{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{c.title}</div>
                    <div style={{ color: T.inkSoft, fontSize: 13.5, lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <span style={eyebrow}>Más solicitados</span>
            {CATALOGO.filter(s => s.cat === "popular" || s.id === 1).map(s => (
              <div key={s.id} onClick={() => { setTab("servicios"); setExpandido(s.id); }} style={{ background: T.surface, border: `1px solid ${T.line}`, padding: "18px 20px", marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{s.nombre}</div>
                  <div style={{ ...mono, color: T.inkFaint, fontSize: 12, marginTop: 3 }}>Desde {fmt(s.precios[0])}</div>
                </div>
                <span style={{ color: T.inkFaint, fontSize: 18 }}>→</span>
              </div>
            ))}

            <div style={{ height: 1, background: T.line, margin: "36px 0" }} />

            <span style={eyebrow}>Conoce nuestras marcas</span>
            <div style={{ overflow: "hidden", marginLeft: -20, marginRight: -20, maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
              <div className="pc-marquee" style={{ display: "flex", gap: 12, width: "max-content", paddingLeft: 20 }}>
                {[...MARCAS, ...MARCAS].map((m, i) => (
                  <div key={i} style={{ flex: "0 0 auto", width: 150, background: T.surface, border: `1px solid ${T.line}`, borderTop: `3px solid ${m.color}`, padding: "20px 16px" }}>
                    <div style={{ height: 32, marginBottom: 12, display: "flex", alignItems: "center" }}>
                      {m.logo ? <img src={m.logo} alt={m.nombre} style={{ maxHeight: 32, maxWidth: "100%", objectFit: "contain" }} /> : <span style={{ ...mono, fontSize: 9, color: T.inkFaint }}>Logo</span>}
                    </div>
                    <div style={{ ...serif, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{m.nombre}</div>
                    <div style={{ ...mono, color: T.inkFaint, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: T.line, margin: "36px 0" }} />

            <span style={eyebrow}>¿Quiénes somos?</span>
            <div style={{ marginBottom: 44 }}>
              <div style={{ ...serif, fontWeight: 600, fontSize: 22, lineHeight: 1.3, marginBottom: 12, maxWidth: 460 }}>
                Dos socios, una obsesión por dejar cada auto impecable.
              </div>
              <div style={{ color: T.inkSoft, fontSize: 14, lineHeight: 1.7, maxWidth: 460 }}>
                Punto Cero Detallado nació en CDMX y Puebla con una idea simple: llevar un detallado de nivel profesional hasta la puerta de tu casa u oficina, con el mismo cuidado que le daríamos a nuestro propio auto.
              </div>
            </div>

            <span style={eyebrow}>Antes / después</span>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20, scrollbarWidth: "none", marginBottom: 44 }}>
              {ANTES_DESPUES.map((p, i) => (
                <div key={i} style={{ flex: "0 0 auto", display: "flex", gap: 2, border: `1px solid ${T.line}` }}>
                  <div style={{ position: "relative", width: 130, height: 160 }}>
                    <img src={p.antes} alt="Antes" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", bottom: 6, left: 6, ...mono, fontSize: 8.5, color: "#fff", background: "rgba(0,0,0,0.55)", padding: "2px 6px", letterSpacing: 0.5 }}>ANTES</span>
                  </div>
                  <div style={{ position: "relative", width: 130, height: 160 }}>
                    <img src={p.despues} alt="Después" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", bottom: 6, left: 6, ...mono, fontSize: 8.5, color: "#fff", background: T.brass, padding: "2px 6px", letterSpacing: 0.5 }}>DESPUÉS</span>
                  </div>
                </div>
              ))}
            </div>

            <span style={eyebrow}>Lo que dicen nuestros clientes</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span style={{ ...mono, fontSize: 13, color: T.ink, fontWeight: 600 }}>Google</span>
              <span style={{ color: T.brass, fontSize: 13, letterSpacing: 1 }}>★★★★★</span>
              <span style={{ ...mono, fontSize: 11, color: T.inkFaint }}>Reseñas verificadas</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              {[
                { texto: "Llegaron puntuales y el auto quedó como nuevo. El servicio a domicilio es lo mejor.", autor: "Cliente en CDMX" },
                { texto: "Muy profesionales, cuidaron cada detalle del interior. Ya lo agendé mensual.", autor: "Cliente en Puebla" },
              ].map((r, i) => (
                <div key={i} style={{ padding: "18px 0", borderTop: i === 0 ? `1px solid ${T.line}` : "none", borderBottom: `1px solid ${T.line}` }}>
                  <div style={{ color: T.brass, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>★★★★★</div>
                  <div style={{ ...serif, fontStyle: "italic", fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>&ldquo;{r.texto}&rdquo;</div>
                  <div style={{ ...mono, fontSize: 10.5, color: T.inkFaint, textTransform: "uppercase", letterSpacing: 1 }}>{r.autor}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: T.line, margin: "36px 0" }} />

            <span style={eyebrow}>Síguenos en Instagram</span>
            <div style={{ ...serif, fontWeight: 600, fontSize: 18, marginBottom: 16, maxWidth: 420 }}>Etiquétanos y aparece aquí</div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20, scrollbarWidth: "none" }}>
              {INSTA_POSTS.map((p, i) => (
                <a key={i} href={p.link} target="_blank" rel="noreferrer" style={{ flex: "0 0 auto", width: 130, textDecoration: "none" }}>
                  <div style={{ width: 130, height: 130, background: p.imagen ? `url(${p.imagen}) center/cover` : T.paperAlt, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {!p.imagen && <span style={{ ...mono, fontSize: 9, color: T.inkFaint }}>Foto</span>}
                  </div>
                  <div style={{ ...mono, fontSize: 10.5, color: T.inkSoft, marginTop: 6 }}>{p.usuario}</div>
                </a>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 40 }}>
              <button onClick={() => setShowPrivacidad(true)} style={{ background: "none", border: "none", color: T.inkFaint, fontSize: 11.5, cursor: "pointer", textDecoration: "underline", fontFamily: "'Inter', sans-serif" }}>Política de privacidad</button>
            </div>
          </div>
        )}

        {/* ── SERVICIOS ── */}
        {tab === "servicios" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <span style={eyebrow}>Tipo de vehículo</span>
              <div style={{ display: "flex", gap: 22, borderBottom: `1px solid ${T.line}` }}>
                {VEHICULOS.map((v, i) => (
                  <button key={v} onClick={() => setVehiculo(i)} style={{ background: "none", border: "none", padding: "0 0 12px", cursor: "pointer", fontSize: 13.5, fontFamily: "'Inter', sans-serif", color: vehiculo === i ? T.ink : T.inkFaint, fontWeight: vehiculo === i ? 600 : 400, borderBottom: vehiculo === i ? `2px solid ${T.brass}` : "2px solid transparent", marginBottom: -1 }}>{v}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 30, fontSize: 13 }}>
              {[["todos", "Todos"], ["basico", "Básicos"], ["popular", "Populares"], ["premium", "Premium"], ["especial", "Especiales"]].map(([k, l]) => (
                <button key={k} onClick={() => setFiltro(k)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "'Inter', sans-serif", color: filtro === k ? T.ink : T.inkFaint, fontWeight: filtro === k ? 600 : 400, textDecoration: filtro === k ? "underline" : "none", textUnderlineOffset: 4 }}>{l}</button>
              ))}
            </div>

            {(filtro === "todos" ? CATALOGO : CATALOGO.filter(s => s.cat === filtro)).map(s => {
              const cs = CAT_STYLE[s.cat];
              const open = expandido === s.id;
              return (
                <div key={s.id} style={{ background: T.surface, border: `1px solid ${T.line}`, marginBottom: 12 }}>
                  <div onClick={() => setExpandido(open ? null : s.id)} style={{ padding: "20px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ ...mono, fontSize: 10, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", color: cs.color }}>{cs.label} · {s.duracion}</span>
                      <div style={{ ...serif, fontWeight: 600, fontSize: 18, marginTop: 6, marginBottom: 6 }}>{s.nombre}</div>
                      <div style={{ color: T.inkSoft, fontSize: 13.5, lineHeight: 1.5 }}>{s.desc}</div>
                      <div style={{ color: T.inkFaint, fontSize: 11, marginTop: 10, ...mono }}>{open ? "− cerrar" : "+ ver detalle"}</div>
                    </div>
                    <div style={{ textAlign: "right", borderLeft: `1px dashed ${T.line}`, paddingLeft: 16, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ ...mono, color: T.ink, fontWeight: 500, fontSize: 19 }}>{fmt(s.precios[vehiculo])}</div>
                    </div>
                  </div>
                  {open && (
                    <div style={{ padding: "0 20px 24px", borderTop: `1px dashed ${T.line}` }}>
                      <div style={{ ...eyebrow, marginTop: 20 }}>Incluye</div>
                      {s.incluye.map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13.5, color: T.inkSoft }}>
                          <span style={{ color: T.brass }}>–</span>{item}
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                        <button onClick={() => { setAgenda(a => ({ ...a, servicio: s.nombre, vehiculo: VEHICULOS[vehiculo] })); setTab("agendar"); }} style={btnPrimary}>Agendar</button>
                        <button onClick={() => cotizarWhatsApp(s)} style={btnWhats}>WhatsApp</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 18, marginTop: 20 }}>
              <div style={{ color: T.inkFaint, fontSize: 12, lineHeight: 1.7 }}>
                Servicio a domicilio sin costo adicional dentro de la zona de cobertura. Se requiere acceso a toma de agua y corriente eléctrica. Los precios pueden variar según el estado del vehículo y suciedad excesiva — cualquier duda, contáctanos por WhatsApp.
              </div>
            </div>
          </div>
        )}

        {/* ── AGENDAR ── */}
        {tab === "agendar" && (
          <div>
            {agendaStep === 1 ? (
              <>
                <span style={eyebrow}>Agendar cita</span>
                <div style={{ ...serif, fontWeight: 600, fontSize: 26, marginBottom: 8 }}>Reserva tu servicio</div>
                <div style={{ color: T.inkSoft, fontSize: 13.5, marginBottom: 32 }}>Llena el formulario. Tu cita queda pendiente de confirmación por WhatsApp.</div>

                {[
                  { label: "Tu nombre *", key: "nombre", type: "text", placeholder: "¿Cómo te llamamos?" },
                  { label: "Tu teléfono / WhatsApp *", key: "telefono", type: "tel", placeholder: "55 1234 5678" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 22 }}>
                    <label style={lbl}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={agenda[f.key]} onChange={e => setAgenda(a => ({ ...a, [f.key]: e.target.value }))} style={inp} />
                  </div>
                ))}

                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>Ciudad *</label>
                  <select value={agenda.ciudad} onChange={e => setAgenda(a => ({ ...a, ciudad: e.target.value, zona: "" }))} style={inp}>
                    <option value="">Selecciona una ciudad...</option>
                    <option value="CDMX">CDMX</option>
                    <option value="Puebla">Puebla</option>
                  </select>
                </div>

                {agenda.ciudad && (
                  <div style={{ marginBottom: 22 }}>
                    <label style={lbl}>Zona de cobertura *</label>
                    <select value={agenda.zona} onChange={e => setAgenda(a => ({ ...a, zona: e.target.value }))} style={inp}>
                      <option value="">Selecciona tu zona...</option>
                      {(agenda.ciudad === "CDMX" ? ZONAS_CDMX : ZONAS_PUEBLA).map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                    <div style={{ color: T.inkFaint, fontSize: 11, marginTop: 8 }}>
                      Por ahora solo cubrimos estas zonas. Si tu dirección no está en la lista, contáctanos por WhatsApp.
                    </div>
                  </div>
                )}

                {agenda.zona && (
                  <div style={{ marginBottom: 22 }}>
                    <label style={lbl}>Dirección del servicio *</label>
                    <input type="text" placeholder="Calle, número, colonia, C.P." value={agenda.direccion} onChange={e => setAgenda(a => ({ ...a, direccion: e.target.value }))} style={inp} />
                  </div>
                )}

                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>Servicio que deseas *</label>
                  <select value={agenda.servicio} onChange={e => setAgenda(a => ({ ...a, servicio: e.target.value, hora: "" }))} style={inp}>
                    <option value="">Selecciona un servicio...</option>
                    {CATALOGO.map(s => <option key={s.id} value={s.nombre}>{s.nombre} ({s.duracion})</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>Tipo de vehículo *</label>
                  <select value={agenda.vehiculo} onChange={e => setAgenda(a => ({ ...a, vehiculo: e.target.value }))} style={inp}>
                    {VEHICULOS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>Fecha *</label>
                  <input type="date" value={agenda.fecha} min={new Date().toISOString().split("T")[0]} disabled={!agenda.servicio} onChange={e => setAgenda(a => ({ ...a, fecha: e.target.value, hora: "" }))} style={{ ...inp, opacity: agenda.servicio ? 1 : 0.4 }} />
                  {!agenda.servicio && <div style={{ color: T.inkFaint, fontSize: 11.5, marginTop: 8 }}>Primero elige un servicio para ver fechas disponibles.</div>}
                </div>

                {agenda.fecha && agenda.servicio && (
                  <div style={{ marginBottom: 22 }}>
                    <label style={lbl}>Hora disponible *</label>
                    <div style={{ color: T.inkFaint, fontSize: 11.5, marginBottom: 12 }}>Este servicio dura aprox. {CATALOGO.find(s => s.nombre === agenda.servicio)?.duracion} — el sistema ya considera tiempo de traslado entre citas.</div>
                    {cargandoHoras ? (
                      <div style={{ color: T.inkSoft, fontSize: 13, padding: "10px 0" }}>Consultando disponibilidad...</div>
                    ) : horasDisponibles.length === 0 ? (
                      <div style={{ color: T.error, fontSize: 13, background: T.errorSoft, padding: "14px 16px", borderLeft: `2px solid ${T.error}` }}>
                        No hay horarios disponibles ese día para este servicio. Intenta otra fecha o contáctanos por WhatsApp.
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {horasDisponibles.map(h => (
                          <button key={h} onClick={() => setAgenda(a => ({ ...a, hora: h }))} style={{ ...mono, padding: "9px 14px", border: agenda.hora === h ? `1px solid ${T.marine}` : `1px solid ${T.line}`, background: agenda.hora === h ? T.marineSoft : "transparent", color: agenda.hora === h ? T.marine : T.ink, fontWeight: agenda.hora === h ? 600 : 400, cursor: "pointer", fontSize: 13 }}>
                            {h}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 30 }}>
                  <label style={lbl}>Notas adicionales (opcional)</label>
                  <input type="text" placeholder="Ej: portón azul, perro en casa, estaciono en calle..." value={agenda.notas} onChange={e => setAgenda(a => ({ ...a, notas: e.target.value }))} style={inp} />
                </div>

                {agendaError && <div style={{ color: T.error, fontSize: 13, marginBottom: 20, background: T.errorSoft, padding: "12px 16px", borderLeft: `2px solid ${T.error}` }}>{agendaError}</div>}

                <button onClick={confirmarCita} disabled={enviando} style={{ ...btnWhats, width: "100%", opacity: enviando ? 0.5 : 1, cursor: enviando ? "not-allowed" : "pointer", fontSize: 14.5, padding: "16px" }}>
                  {enviando ? "Enviando..." : "Confirmar por WhatsApp"}
                </button>
                <div style={{ color: T.inkFaint, fontSize: 11, textAlign: "center", marginTop: 14 }}>Tu cita queda registrada y pendiente de confirmación del equipo.</div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 10px" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: `1px solid ${T.brass}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", ...mono, fontSize: 22, color: T.brass }}>✓</div>
                <div style={{ ...serif, fontWeight: 600, fontSize: 24, marginBottom: 12 }}>Cita registrada</div>
                <div style={{ color: T.inkSoft, fontSize: 14, lineHeight: 1.7, marginBottom: 32, maxWidth: 360, margin: "0 auto 32px" }}>Tu cita está pendiente de confirmación. Te contactaremos por WhatsApp. Gracias por elegirnos.</div>
                <button onClick={() => { setAgendaStep(1); setAgenda({ nombre: "", telefono: "", ciudad: "", zona: "", direccion: "", servicio: "", vehiculo: VEHICULOS[0], fecha: "", hora: "", notas: "" }); }} style={btnGhost}>
                  Agendar otra cita
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GATE DE PRIVACIDAD */}
      {!aceptoPrivacidad && (
        <div style={{ position: "fixed", inset: 0, background: T.paper, zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", maxHeight: "88vh", overflowY: "auto", padding: "28px 22px 24px", borderTop: `1px solid ${T.line}` }}>
            <div style={{ ...serif, fontWeight: 600, fontSize: 20, marginBottom: 20 }}>Política de privacidad</div>
            <div style={{ color: T.inkSoft, fontSize: 13.5, lineHeight: 1.8, marginBottom: 24 }}>
              <p><strong style={{ color: T.ink }}>Datos que recopilamos.</strong> Al agendar una cita recopilamos tu nombre, teléfono, dirección del servicio, tipo de vehículo y notas adicionales que nos proporciones.</p>
              <p><strong style={{ color: T.ink }}>Para qué los usamos.</strong> Únicamente para coordinar, confirmar y dar seguimiento a tu servicio. Nunca compartimos ni vendemos tu información a terceros.</p>
              <p><strong style={{ color: T.ink }}>Dónde se guardan.</strong> Tus datos se almacenan de forma segura en nuestra base de datos y solo el equipo de Punto Cero Detallado tiene acceso a ellos.</p>
              <p><strong style={{ color: T.ink }}>WhatsApp.</strong> Al confirmar una cita se abre WhatsApp para enviarnos los datos directamente; ese mensaje queda sujeto también a las políticas de privacidad de WhatsApp.</p>
              <p><strong style={{ color: T.ink }}>Tus derechos.</strong> Puedes pedirnos en cualquier momento que eliminemos tu información contactándonos por WhatsApp.</p>
            </div>
            <button onClick={aceptarPrivacidad} style={{ ...btnPrimary, width: "100%" }}>Acepto la política de privacidad</button>
          </div>
        </div>
      )}

      {/* MODAL PRIVACIDAD */}
      {showPrivacidad && (
        <div onClick={() => setShowPrivacidad(false)} style={{ position: "fixed", inset: 0, background: "rgba(22,24,28,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.paper, width: "100%", maxHeight: "82vh", overflowY: "auto", padding: "28px 22px 40px", borderTop: `1px solid ${T.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ ...serif, fontWeight: 600, fontSize: 20 }}>Política de privacidad</div>
              <button onClick={() => setShowPrivacidad(false)} style={{ background: "none", border: "none", color: T.inkFaint, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ color: T.inkSoft, fontSize: 13.5, lineHeight: 1.8 }}>
              <p><strong style={{ color: T.ink }}>Datos que recopilamos.</strong> Al agendar una cita recopilamos tu nombre, teléfono, dirección del servicio, tipo de vehículo y notas adicionales que nos proporciones.</p>
              <p><strong style={{ color: T.ink }}>Para qué los usamos.</strong> Únicamente para coordinar, confirmar y dar seguimiento a tu servicio. Nunca compartimos ni vendemos tu información a terceros.</p>
              <p><strong style={{ color: T.ink }}>Dónde se guardan.</strong> Tus datos se almacenan de forma segura en nuestra base de datos y solo el equipo de Punto Cero Detallado tiene acceso a ellos.</p>
              <p><strong style={{ color: T.ink }}>WhatsApp.</strong> Al confirmar una cita se abre WhatsApp para enviarnos los datos directamente; ese mensaje queda sujeto también a las políticas de privacidad de WhatsApp.</p>
              <p><strong style={{ color: T.ink }}>Tus derechos.</strong> Puedes pedirnos en cualquier momento que eliminemos tu información contactándonos por WhatsApp.</p>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.paper, borderTop: `1px solid ${T.line}`, display: "flex", zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "16px 4px 14px", background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif" }}>
            <span style={{ fontSize: 12, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? T.ink : T.inkFaint, letterSpacing: 0.3 }}>{t.label}</span>
            <div style={{ width: 16, height: 2, background: tab === t.id ? T.brass : "transparent" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
