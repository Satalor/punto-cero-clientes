import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── DATOS ────────────────────────────────────────────────────────────────────
const WHATSAPP = "5639556562";
const VEHICULOS = ["Compacto / Sedán", "SUV / Crossover", "Van / Pickup"];

const ZONAS_CDMX = ["Azcapotzalco", "Cuauhtémoc", "Benito Juárez"];
const ZONAS_PUEBLA = ["San Andrés Cholula", "Puebla", "Angelópolis", "Lomas de Angelópolis"];
const ZONAS_EDOMEX = ["Satelite", "Lomas verdes", "Tlanepantla"];

// tiempos[] y precios[] van en orden: [Compacto/Sedán, SUV/Crossover, Van/Pickup]
const CATALOGO = [
  {
    id: 1, nombre: "Detallado Exterior", cat: "exterior",
    desc: "Recupera el brillo y la limpieza del exterior de tu vehículo con un lavado seguro y detallado.",
    precios: [349, 449, 549],
    tiempoLabel: ["2:30", "2:45", "3:00"],
    tiempoHoras: [2.5, 2.75, 3.0],
    incluye: ["Prelavado y lavado con shampoo pH neutro", "Limpieza detallada de emblemas, rejillas y zonas de difícil acceso", "Limpieza profunda de rines", "Descontaminación férrica de pintura y rines", "Secado seguro con microfibra", "Aplicación de cera de mantenimiento", "Aspirado básico del interior"],
    noIncluye: null,
    nota: "Si tu vehículo cuenta con un recubrimiento cerámico o alguna protección aplicada, háznoslo saber antes del servicio.",
  },
  {
    id: 2, nombre: "Protección Cerámica con Cera de Grafeno", cat: "exterior",
    desc: "Mayor brillo, mayor protección y una pintura más suave al tacto.",
    precios: [749, 799, 849],
    tiempoLabel: ["4:30–5:00", "5:00–5:30", "5:30–6:00"],
    tiempoHoras: [5.0, 5.5, 6.0],
    incluye: ["Todo lo incluido en el Detallado Exterior (excepto cera de mantenimiento, sustituida por protección cerámica)", "Descontaminación mecánica de la pintura", "Preparación de la superficie", "Aplicación de cera cerámica con grafeno", "Protección hidrofóbica de hasta 5 meses*"],
    noIncluye: null,
    nota: "*La duración de la protección puede variar según el uso y mantenimiento del vehículo.",
  },
  {
    id: 3, nombre: "Detallado Interior", cat: "interior",
    desc: "Recupera la limpieza y el aspecto original del interior de tu vehículo.",
    precios: [449, 530, 599],
    tiempoLabel: ["2:30", "2:50", "3:15"],
    tiempoHoras: [2.5, 2.8333, 3.25],
    incluye: ["Aspirado completo", "Limpieza profunda de plásticos, viniles y superficies de contacto con APC", "Limpieza de cristales interiores", "Protector para plásticos", "Acondicionador para piel (cuando aplique)", "Fragancia para interior"],
    noIncluye: "Asientos, alfombra, cielo, cinturones ni sanitización con vapor.",
    nota: null,
  },
  {
    id: 4, nombre: "Detallado Interior Completo", cat: "interior",
    desc: "La experiencia más completa para renovar el interior de tu vehículo.",
    precios: [1699, 1999, 2299],
    tiempoLabel: ["6:00", "6:45", "7:30"],
    tiempoHoras: [6.0, 6.75, 7.5],
    incluye: ["Todo lo incluido en el Detallado Interior", "Lavado profundo de tapetes, alfombra y asientos textiles mediante inyección-extracción", "Limpieza y acondicionamiento de asientos de piel (cuando aplique)", "Limpieza de cinturones de seguridad", "Limpieza segura del cielo del vehículo", "Pretratamiento de manchas visibles", "Fragancia para interior"],
    noIncluye: "Sanitización con vapor.",
    nota: null,
  },
  {
    id: 5, nombre: "Sanitización con Vapor", cat: "interior",
    desc: "Mejora la higiene del habitáculo y ayuda a eliminar olores.",
    precios: [599, 649, 699],
    tiempoLabel: ["2:20", "2:40", "3:05"],
    tiempoHoras: [2.3333, 2.6667, 3.0833],
    incluye: ["Aspirado completo", "Limpieza superficial de superficies de contacto", "Sanitización con vapor en las principales áreas del habitáculo", "Tratamiento del sistema de aire acondicionado", "Protector para plásticos", "Acondicionador para piel (cuando aplique)", "Fragancia para interior"],
    noIncluye: null,
    nota: "Puede contratarse como servicio independiente o como complemento de cualquier servicio de interior.",
  },
  {
    id: 6, nombre: "Detallado de Motor", cat: "especializado",
    desc: "Limpieza segura del compartimento del motor para mejorar su apariencia y facilitar su mantenimiento.",
    precios: [599, 649, 699],
    tiempoLabel: ["1:30", "1:45", "2:00"],
    tiempoHoras: [1.5, 1.75, 2.0],
    incluye: ["Protección de componentes sensibles", "Eliminación de grasa, polvo y suciedad", "Limpieza detallada del compartimento del motor", "Secado con aire y microfibra", "Protector para plásticos y hules"],
    noIncluye: null,
    nota: "Si el motor presenta modificaciones eléctricas, cables expuestos o reparaciones recientes, infórmanos antes del servicio.",
  },
  {
    id: 7, nombre: "Detallado de Rines, Llantas y Tolvas", cat: "especializado",
    desc: "Limpieza profunda de las zonas que un lavado convencional no alcanza.",
    precios: [699, 749, 779],
    tiempoLabel: ["4:00", "4:30", "5:00"],
    tiempoHoras: [4.0, 4.5, 5.0],
    incluye: ["Retiro de las cuatro ruedas", "Limpieza profunda de rines", "Limpieza de llantas, tolvas y guardafangos", "Descontaminación férrica", "Protector para plásticos y llantas", "Reinstalación con torque adecuado"],
    noIncluye: null,
    nota: "Si tu vehículo utiliza birlos de seguridad, recuerda tener disponible la llave correspondiente.",
  },
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
  exterior: { color: T.marine, bg: T.marineSoft, label: "Exterior" },
  interior: { color: T.teal, bg: T.tealSoft, label: "Interior" },
  especializado: { color: T.brass, bg: T.brassSoft, label: "Especializado" },
};

const ANTES_DESPUES = [];

const MARCAS = [
  { nombre: "Black+Decker", desc: "Hidrolavadora", color: "#1C3A56", logo: "/black-decker.png" },
  { nombre: "Karcher", desc: "Lava-aspiradora", color: "#9C7A3C", logo: "/karcher.png" },
  { nombre: "Koblenz", desc: "Aspiradora", color: "#3F6357", logo: "/koblenz.png" },
  { nombre: "Infinity Shine", desc: "Productos y recubrimientos", color: "#3A5BFF", logo: "/infinity-shine.png" },
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
  const [showAvisoBanner, setShowAvisoBanner] = useState(true);
  const [vehiculo, setVehiculo] = useState(0);
  const [expandido, setExpandido] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const [agenda, setAgenda] = useState({ nombre: "", telefono: "", ciudad: "", zona: "", direccion: "", servicio: "", vehiculo: VEHICULOS[0], marca_modelo: "", fecha: "", hora: "", notas: "" });
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
    calcularHorasDisponibles(agenda.fecha, agenda.servicio, agenda.vehiculo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenda.fecha, agenda.servicio, agenda.vehiculo, horarios]);

  const duracionHorasDe = (nombreServicio, vehiculoLabel) => {
    const s = CATALOGO.find(x => x.nombre === nombreServicio);
    if (!s) return 2;
    const idxVeh = Math.max(0, VEHICULOS.indexOf(vehiculoLabel));
    return s.tiempoHoras[idxVeh] ?? s.tiempoHoras[0];
  };

  const calcularHorasDisponibles = async (fechaStr, nombreServicio, vehiculoLabel) => {
    setCargandoHoras(true);
    const fecha = new Date(fechaStr + "T00:00:00");
    const diaSemana = fecha.getDay();

    const config = horarios.find(h => h.dia_semana === diaSemana);
    if (!config || !config.activo) {
      setHorasDisponibles([]);
      setCargandoHoras(false);
      return;
    }

    const duracionNueva = duracionHorasDe(nombreServicio, vehiculoLabel);

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
      .select("hora, servicio, vehiculo, estado")
      .eq("fecha", fechaStr)
      .neq("estado", "cancelada");

    const rangosOcupados = (citasExistentes || []).map(c => {
      const dur = duracionHorasDe(c.servicio, c.vehiculo);
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

  const abrirWhatsApp = (msg) => { window.location.href = `https://wa.me/52${WHATSAPP}?text=${encodeURIComponent(msg)}`; };

  const cotizarWhatsApp = (s) => {
    const msg = `Hola! Me interesa el servicio de *${s.nombre}* para mi ${VEHICULOS[vehiculo]}.\nPrecio: ${fmt(s.precios[vehiculo])}\n¿Tienen disponibilidad?`;
    abrirWhatsApp(msg);
  };

  const confirmarCita = async () => {
    if (!agenda.nombre || !agenda.telefono || !agenda.servicio || !agenda.fecha || !agenda.hora || !agenda.direccion || !agenda.ciudad || !agenda.zona || !agenda.marca_modelo) {
      setAgendaError("Por favor llena todos los campos obligatorios, incluyendo ciudad, zona y marca/modelo/año.");
      return;
    }
    setAgendaError("");
    setEnviando(true);

    const duracionNueva = duracionHorasDe(agenda.servicio, agenda.vehiculo);
    const inicioNuevoMin = horaAMinutos(agenda.hora);
    const finNuevoMin = inicioNuevoMin + duracionNueva * 60;

    const { data: citasDelDia } = await supabase
      .from("citas")
      .select("id, hora, servicio, vehiculo")
      .eq("fecha", agenda.fecha)
      .neq("estado", "cancelada");

    const hayChoque = (citasDelDia || []).some(c => {
      const dur = duracionHorasDe(c.servicio, c.vehiculo);
      const ini = horaAMinutos(c.hora);
      const fin = ini + dur * 60;
      return inicioNuevoMin < fin && finNuevoMin > ini;
    });

    if (hayChoque) {
      setAgendaError("Justo se ocupó ese horario. Por favor elige otra hora disponible.");
      setEnviando(false);
      calcularHorasDisponibles(agenda.fecha, agenda.servicio, agenda.vehiculo);
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
      marca_modelo: agenda.marca_modelo,
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
    if (error) {
      setAgendaError("Hubo un problema al guardar tu cita. Intenta de nuevo o contáctanos por WhatsApp.");
      return;
    }

    const msgWhatsApp = `Hola! Quiero confirmar mi cita:\n\n*Servicio:* ${agenda.servicio}\n*Vehículo:* ${agenda.vehiculo} — ${agenda.marca_modelo}\n*Fecha:* ${agenda.fecha}\n*Hora:* ${agenda.hora}\n*Dirección:* ${agenda.direccion}, ${agenda.zona}, ${agenda.ciudad}\n*Nombre:* ${agenda.nombre}\n*Teléfono:* ${agenda.telefono}${agenda.notas ? `\n*Notas:* ${agenda.notas}` : ""}`;
    abrirWhatsApp(msgWhatsApp);

    setAgendaStep(2);
  };
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

  const zonasDe = (ciudad) => ciudad === "CDMX" ? ZONAS_CDMX : ciudad === "Edomex" ? ZONAS_EDOMEX : ciudad === "Puebla" ? ZONAS_PUEBLA : [];

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
            <div style={{ ...mono, fontSize: 10, color: T.inkFaint, letterSpacing: 2, marginTop: 5, textTransform: "uppercase" }}>Detallado · CDMX, Edomex &amp; Puebla</div>
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
              <span style={eyebrow}>A domicilio · CDMX, Edomex &amp; Puebla</span>
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
                <div style={{ ...serif, fontWeight: 600, fontSize: 32, lineHeight: 1, marginBottom: 10 }}>15% OFF</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, marginBottom: 18 }}>Válido solo en tu primera cita con Punto Cero Detallado.</div>
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
            {CATALOGO.filter(s => s.id === 1 || s.id === 4).map(s => (
              <div key={s.id} onClick={() => { setTab("servicios"); setExpandido(s.id); }} style={{ background: T.surface, border: `1px solid ${T.line}`, padding: "18px 20px", marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{s.nombre}</div>
                  <div style={{ ...mono, color: T.inkFaint, fontSize: 12, marginTop: 3 }}>Desde {fmt(s.precios[0])}</div>
                </div>
                <span style={{ color: T.inkFaint, fontSize: 18 }}>→</span>
              </div>
            ))}

            <div style={{ height: 1, background: T.line, margin: "36px 0" }} />

            <span style={eyebrow}>Conoce las marcas con las que trabajamos</span>
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
                Punto Cero Detallado nació en CDMX, Edomex y Puebla con una idea simple: llevar un detallado de nivel profesional hasta la puerta de tu casa u oficina, con el mismo cuidado que le daríamos a nuestro propio auto.
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
              <button onClick={() => setShowPrivacidad(true)} style={{ background: "none", border: "none", color: T.inkFaint, fontSize: 11.5, cursor: "pointer", textDecoration: "underline", fontFamily: "'Inter', sans-serif" }}>Política de privacidad y términos</button>
            </div>
          </div>
        )}

        {/* ── SERVICIOS ── */}
        {tab === "servicios" && (
          <div>
            <div style={{ marginBottom: 10 }}>
              <span style={eyebrow}>Tipo de vehículo</span>
              <div style={{ display: "flex", gap: 22, borderBottom: `1px solid ${T.line}` }}>
                {VEHICULOS.map((v, i) => (
                  <button key={v} onClick={() => setVehiculo(i)} style={{ background: "none", border: "none", padding: "0 0 12px", cursor: "pointer", fontSize: 13.5, fontFamily: "'Inter', sans-serif", color: vehiculo === i ? T.ink : T.inkFaint, fontWeight: vehiculo === i ? 600 : 400, borderBottom: vehiculo === i ? `2px solid ${T.brass}` : "2px solid transparent", marginBottom: -1 }}>{v}</button>
                ))}
              </div>
            </div>
            <div style={{ color: T.inkFaint, fontSize: 11.5, lineHeight: 1.6, fontStyle: "italic", marginBottom: 28 }}>
              SUV de 3 filas o de tamaño extra grande (ej. Suburban, Tahoe, Escalade, Navigator) se cotiza en Van/Pickup por el volumen adicional de interior.
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 30, fontSize: 13 }}>
              {[["todos", "Todos"], ["exterior", "Exterior"], ["interior", "Interior"], ["especializado", "Especializados"]].map(([k, l]) => (
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
                      <span style={{ ...mono, fontSize: 10, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", color: cs.color }}>{cs.label} · {s.tiempoLabel[vehiculo]}</span>
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
                      {s.noIncluye && (
                        <div style={{ color: T.inkFaint, fontSize: 12, marginTop: 8, marginBottom: 6 }}>
                          <strong>No incluye:</strong> {s.noIncluye}
                        </div>
                      )}
                      {s.nota && (
                        <div style={{ color: T.inkFaint, fontSize: 12, lineHeight: 1.6, marginTop: 14, borderLeft: `2px solid ${T.brass}`, paddingLeft: 10, fontStyle: "italic" }}>
                          {s.nota}
                        </div>
                      )}
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
                Servicio a domicilio sin costo adicional dentro de la zona de cobertura. Se requiere acceso a toma de agua y corriente eléctrica. Los precios pueden variar según el estado del vehículo y suciedad excesiva — más detalles en nuestra <button onClick={() => setShowPrivacidad(true)} style={{ background: "none", border: "none", padding: 0, color: T.brass, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>política de privacidad y términos</button>.
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
                <div style={{ color: T.inkSoft, fontSize: 13.5, marginBottom: 32 }}>Llena el formulario. Tu cita queda pendiente de confirmación de nuestro equipo.</div>

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
                    <option value="Edomex">Edomex</option>
                    <option value="Puebla">Puebla</option>
                  </select>
                </div>

                {agenda.ciudad && (
                  <div style={{ marginBottom: 22 }}>
                    <label style={lbl}>Zona de cobertura *</label>
                    <select value={agenda.zona} onChange={e => setAgenda(a => ({ ...a, zona: e.target.value }))} style={inp}>
                      <option value="">Selecciona tu zona...</option>
                      {zonasDe(agenda.ciudad).map(z => (
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
                    {CATALOGO.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>Tipo de vehículo *</label>
                  <select value={agenda.vehiculo} onChange={e => setAgenda(a => ({ ...a, vehiculo: e.target.value, hora: "" }))} style={inp}>
                    {VEHICULOS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>Marca, Modelo y Año *</label>
                  <input type="text" placeholder="Ej. Nissan Versa 2021" value={agenda.marca_modelo} onChange={e => setAgenda(a => ({ ...a, marca_modelo: e.target.value }))} style={inp} />
                  <div style={{ color: T.inkFaint, fontSize: 11, marginTop: 8 }}>Nos ayuda a llegar preparados con el vehículo correcto en mente.</div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>Fecha *</label>
                  <input type="date" value={agenda.fecha} min={new Date().toISOString().split("T")[0]} disabled={!agenda.servicio} onChange={e => setAgenda(a => ({ ...a, fecha: e.target.value, hora: "" }))} style={{ ...inp, opacity: agenda.servicio ? 1 : 0.4 }} />
                  {!agenda.servicio && <div style={{ color: T.inkFaint, fontSize: 11.5, marginTop: 8 }}>Primero elige un servicio para ver fechas disponibles.</div>}
                </div>

                {agenda.fecha && agenda.servicio && (
                  <div style={{ marginBottom: 22 }}>
                    <label style={lbl}>Hora disponible *</label>
                    <div style={{ color: T.inkFaint, fontSize: 11.5, marginBottom: 12 }}>Este servicio dura aprox. {CATALOGO.find(s => s.nombre === agenda.servicio)?.tiempoLabel[VEHICULOS.indexOf(agenda.vehiculo)]} — el sistema ya considera tiempo de traslado entre citas.</div>
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

                <button onClick={confirmarCita} disabled={enviando} style={{ ...btnPrimary, width: "100%", opacity: enviando ? 0.5 : 1, cursor: enviando ? "not-allowed" : "pointer", fontSize: 14.5, padding: "16px" }}>
                  {enviando ? "Enviando..." : "Confirmar cita"}
                </button>
                <div style={{ color: T.inkFaint, fontSize: 11, textAlign: "center", marginTop: 14 }}>Tu cita queda registrada y pendiente de confirmación del equipo.</div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 10px" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: `1px solid ${T.brass}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", ...mono, fontSize: 22, color: T.brass }}>✓</div>
                <div style={{ ...serif, fontWeight: 600, fontSize: 24, marginBottom: 12 }}>Cita registrada</div>
                <div style={{ color: T.inkSoft, fontSize: 14, lineHeight: 1.7, marginBottom: 32, maxWidth: 360, margin: "0 auto 32px" }}>Tu cita está pendiente de confirmación. Te contactaremos por WhatsApp. Gracias por elegirnos.</div>
                <button onClick={() => { setAgendaStep(1); setAgenda({ nombre: "", telefono: "", ciudad: "", zona: "", direccion: "", servicio: "", vehiculo: VEHICULOS[0], marca_modelo: "", fecha: "", hora: "", notas: "" }); }} style={btnGhost}>
                  Agendar otra cita
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AVISO DE PRIVACIDAD — banner no invasivo, estilo Nissan */}
      {showAvisoBanner && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 90, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "all", maxWidth: 600, width: "100%", background: T.marine, color: "#DCE3EA", padding: "16px 20px 18px", borderRadius: "16px 16px 0 0", boxShadow: "0 -8px 30px rgba(0,0,0,.25)", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <span style={{ ...mono, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.brass }}>Aviso importante</span>
              <button onClick={() => setShowAvisoBanner(false)} style={{ ...mono, background: "none", border: "none", color: "#9FB0C0", fontSize: 12, cursor: "pointer" }}>CERRAR ✕</button>
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#C5CFD8", marginBottom: 14 }}>
              Al agendar recopilamos tus datos de contacto y cita únicamente para coordinar tu servicio. Nunca los compartimos con terceros. Conoce el detalle completo en nuestra{" "}
              <button onClick={() => setShowPrivacidad(true)} style={{ background: "none", border: "none", padding: 0, color: T.brass, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>política de privacidad y términos</button>.
            </div>
            <button onClick={() => setShowAvisoBanner(false)} style={{ width: "100%", background: T.brass, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Entendido</button>
          </div>
        </div>
      )}

      {/* MODAL PRIVACIDAD Y TÉRMINOS */}
      {showPrivacidad && (
        <div onClick={() => setShowPrivacidad(false)} style={{ position: "fixed", inset: 0, background: "rgba(22,24,28,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.paper, width: "100%", maxWidth: 600, margin: "0 auto", maxHeight: "82vh", overflowY: "auto", padding: "28px 22px 40px", borderTop: `1px solid ${T.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ ...serif, fontWeight: 600, fontSize: 20 }}>Política de privacidad y términos</div>
              <button onClick={() => setShowPrivacidad(false)} style={{ background: "none", border: "none", color: T.inkFaint, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ color: T.inkSoft, fontSize: 13.5, lineHeight: 1.8 }}>
              <p><strong style={{ color: T.ink }}>Responsable.</strong> Punto Cero Detallado es un servicio de detallado automotriz a domicilio operado por sus socios fundadores. Al agendar una cita a través de esta página, aceptas los términos descritos a continuación.</p>
              <p><strong style={{ color: T.ink }}>Datos que recopilamos.</strong> Al agendar una cita recopilamos tu nombre, teléfono, dirección del servicio, tipo de vehículo, marca/modelo/año y notas adicionales que nos proporciones. No solicitamos datos bancarios, de tarjetas ni información sensible a través de este formulario.</p>
              <p><strong style={{ color: T.ink }}>Para qué los usamos.</strong> Únicamente para coordinar, confirmar y dar seguimiento a tu servicio, calcular disponibilidad real de horarios, y contactarte por WhatsApp en caso de dudas o cambios. Nunca compartimos ni vendemos tu información a terceros con fines comerciales o publicitarios.</p>
              <p><strong style={{ color: T.ink }}>Dónde se guardan.</strong> Tus datos se almacenan de forma segura en Supabase, nuestro proveedor de base de datos, y solo el equipo de Punto Cero Detallado tiene acceso a ellos. No almacenamos esta información en dispositivos personales sin control.</p>
              <p><strong style={{ color: T.ink }}>WhatsApp.</strong> Al confirmar una cita se abre WhatsApp para enviarnos los datos directamente; ese mensaje queda sujeto también a las políticas de privacidad de WhatsApp/Meta, ajenas a Punto Cero Detallado.</p>
              <p><strong style={{ color: T.ink }}>Menores de edad.</strong> Este servicio está dirigido a personas mayores de edad. Si eres menor de edad, agenda con ayuda de un padre, madre o tutor.</p>
              <p><strong style={{ color: T.ink }}>Precios y condiciones del vehículo.</strong> Los precios mostrados aplican a condiciones normales de uso. Pueden variar por suciedad excesiva, presencia de mascotas, derrames, modificaciones eléctricas o mecánicas, recubrimientos previos (cerámico, PPF, polarizado) u otras condiciones especiales. Es responsabilidad del cliente informar estas condiciones antes de la cita para recibir una cotización justa y evitar cargos adicionales el día del servicio.</p>
              <p><strong style={{ color: T.ink }}>Requisitos del servicio.</strong> El domicilio debe contar con acceso a toma de agua y corriente eléctrica. Si el lugar no cuenta con estos servicios, contáctanos antes de agendar para evaluar alternativas.</p>
              <p><strong style={{ color: T.ink }}>Confirmación y cancelaciones.</strong> Toda cita queda sujeta a confirmación de nuestro equipo por WhatsApp. Si necesitas cancelar o reagendar, te pedimos avisarnos con la mayor anticipación posible para poder disponer del horario.</p>
              <p><strong style={{ color: T.ink }}>Responsabilidad sobre el vehículo.</strong> Trabajamos con productos y técnicas profesionales pensadas para no dañar tu vehículo. Si tu auto presenta daños preexistentes en pintura, plásticos o tapicería, te pedimos informarlo antes del servicio para dejarlo documentado y evitar malentendidos.</p>
              <p><strong style={{ color: T.ink }}>Promociones.</strong> Las ofertas de lanzamiento u otras promociones vigentes en la página aplican bajo los términos y vigencia indicados en cada promoción, y pueden modificarse o darse por terminadas en cualquier momento.</p>
              <p><strong style={{ color: T.ink }}>Cambios a este aviso.</strong> Podemos actualizar esta política conforme el servicio crezca. Los cambios se reflejarán en esta misma página con la fecha de última actualización.</p>
              <p><strong style={{ color: T.ink }}>Tus derechos.</strong> Puedes pedirnos en cualquier momento que te compartamos, corrijamos o eliminemos tu información contactándonos por WhatsApp.</p>
              <p><strong style={{ color: T.ink }}>Contacto.</strong> Para dudas sobre esta política o tus datos, escríbenos por WhatsApp al número visible en esta página.</p>
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
