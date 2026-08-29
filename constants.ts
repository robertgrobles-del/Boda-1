
// Fecha del evento CON zona horaria de República Dominicana (-04:00).
// Así la cuenta regresiva es idéntica para invitados en cualquier país.
// ⚠️ DATOS PENDIENTES DE COMPLETAR ANTES DE PUBLICAR:
//    - EVENT_DATA.whatsapp        (número real, formato internacional sin +)
//    - GIFT.accountNumber         (cuenta bancaria real)
//    - REGISTRY_URLS              (enlaces reales de Amazon / Casa Cuesta)
//    - PHOTO_UPLOAD_URL           (álbum compartido, opcional)
//    - API_CONFIG.backendUrl      (URL del backend en producción)
export const EVENT_DATA = {
    date: "2026-11-11T16:00:00-04:00",
    displayDate: "11 DE NOVIEMBRE 2026",
    hashtag: "#StephanieDanielTwilight",
    estYear: "2022",
    whatsapp: "18090000000", // PLACEHOLDER — RD: 1 + 809/829/849 + 7 dígitos, sin "+"
};

// Padres y padrinos — sección "Con la bendición de Dios y nuestros padres".
// ⚠️ PLACEHOLDER: reemplazar por los nombres reales.
export const FAMILY = {
    brideParents: ["Nombre del padre de la novia", "Nombre de la madre de la novia"],
    groomParents: ["Nombre del padre del novio", "Nombre de la madre del novio"],
    padrinos: ["Nombre del padrino", "Nombre de la madrina"],
};

// Fotos de la preboda — archivos en /public/images/preboda (imagen_1.webp … imagen_10.webp).
// Cambia el orden/asignación aquí para moverlas por todo el sitio.
export const PHOTOS = {
    heroBackground: "/images/preboda/imagen_1.webp",
    heroCluster: [
        "/images/preboda/imagen_9.webp",
        "/images/preboda/imagen_3.webp",
        "/images/preboda/imagen_7.webp",
    ],
    heroArch: "/images/preboda/imagen_9.webp",
    gateway: "/images/preboda/imagen_6.webp",
    story: "/images/preboda/imagen_3.webp",
    storyAccent: "/images/preboda/imagen_8.webp",
    band: "/images/preboda/imagen_5.webp",
    gallery: [
        "/images/preboda/imagen_2.webp",
        "/images/preboda/imagen_7.webp",
        "/images/preboda/imagen_4.webp",
        "/images/preboda/imagen_9.webp",
        "/images/preboda/imagen_10.webp",
        "/images/preboda/imagen_6.webp",
        "/images/preboda/imagen_8.webp",
    ],
};

// Itinerario del día de la boda. `icon`: church | cocktail | dinner | party | send-off | rings | photo.
export const ITINERARY = [
    { time: "4:00 PM", title: "Ceremonia religiosa", detail: "Catedral Primada de las Américas", icon: "church" as const },
    { time: "5:30 PM", title: "Cóctel de bienvenida", detail: "Jardín · música en vivo", icon: "cocktail" as const },
    { time: "7:00 PM", title: "Recepción y cena", detail: "Centro de Convenciones Sans Souci", icon: "dinner" as const },
    { time: "9:00 PM", title: "Primer baile y fiesta", detail: "¡Que empiece la celebración!", icon: "party" as const },
    { time: "2:00 AM", title: "Despedida", detail: "Último brindis y cotillón", icon: "send-off" as const },
];

// Canción de los novios — reproductor flotante ("Presiona para escuchar nuestra canción").
// Coloca el mp3 en /public y apunta `audioUrl` a "/nuestra-cancion.mp3".
// Si `audioUrl` queda vacío el botón enlaza a `externalUrl` (Spotify/YouTube); si ambos
// están vacíos, el reproductor no se muestra.
export const SONG = {
    title: "Nuestra canción",
    artist: "",
    audioUrl: "", // p.ej. "/nuestra-cancion.mp3"
    externalUrl: "", // p.ej. "https://open.spotify.com/track/..."
};

// Datos bancarios para la mesa de regalos (una sola fuente de verdad).
export const GIFT = {
    bank: "Banco Popular",
    accountName: "Stephanie & Daniel",
    accountNumber: "0123 4567 8901 2345", // PLACEHOLDER
};

export const API_CONFIG = {
    cedulaValidationBaseUrl: "https://api.digital.gob.do/v3/cedulas/",
    backendUrl: "http://localhost:3001", // Cambiar por la URL de producción (Railway, etc.)
};

// --- Calendario -------------------------------------------------------------
// Datos base para generar tanto el enlace de Google como el archivo .ics (Apple/Outlook)
export const CALENDAR_EVENT = {
    title: "Boda de Stephanie & Daniel",
    description: "Celebración de nuestra boda en Santo Domingo, República Dominicana.",
    location: "Santo Domingo, República Dominicana",
    // UTC: 16:00 -04:00 => 20:00Z
    startUtc: "20261111T200000Z",
    endUtc: "20261112T040000Z",
};

export const CALENDAR_URLS = {
    google:
        "https://www.google.com/calendar/render?action=TEMPLATE" +
        `&text=${encodeURIComponent(CALENDAR_EVENT.title)}` +
        `&dates=${CALENDAR_EVENT.startUtc}/${CALENDAR_EVENT.endUtc}` +
        `&details=${encodeURIComponent(CALENDAR_EVENT.description)}` +
        `&location=${encodeURIComponent(CALENDAR_EVENT.location)}`,
};

/** Devuelve un data-URI .ics descargable para Apple Calendar / Outlook. */
export const buildIcsDataUri = (): string => {
    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//nuestra-boda//ES",
        "BEGIN:VEVENT",
        `UID:boda-stephanie-daniel-2026@invitacion`,
        `DTSTAMP:${CALENDAR_EVENT.startUtc}`,
        `DTSTART:${CALENDAR_EVENT.startUtc}`,
        `DTEND:${CALENDAR_EVENT.endUtc}`,
        `SUMMARY:${CALENDAR_EVENT.title}`,
        `DESCRIPTION:${CALENDAR_EVENT.description}`,
        `LOCATION:${CALENDAR_EVENT.location}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
};

// Enlaces a Google Maps. Los `share.google` cortos pueden caducar; como respaldo
// se incluye una búsqueda por nombre que siempre funciona.
export const MAPS_URLS = {
    ceremony: "https://www.google.com/maps/search/?api=1&query=Catedral+Primada+de+las+Am%C3%A9ricas+Santo+Domingo",
    reception: "https://www.google.com/maps/search/?api=1&query=Centro+de+Convenciones+Sans+Souci+Santo+Domingo",
};

export const DRESS_CODE_DETAILS = {
    women: "Vestido Largo.",
    men: "Traje oscuro o Tuxedo.",
    colors: "Tonos neutros y pasteles. Reservado el color blanco y beige para la novia."
};

// Enlaces de la mesa de regalos. Reemplazar los "#" por las URLs reales.
export const REGISTRY_URLS = {
    amazon: "#",       // p.ej. https://www.amazon.com/wedding/registry/XXXXXXXX
    casaCuesta: "#",   // p.ej. https://tienda.casacuesta.com/lista/382910
};

// Álbum compartido para que los invitados suban fotos (p.ej. Google Drive, Google Fotos, iCloud, etc.).
// Puedes crear una carpeta de Google Drive configurada con acceso público de edición ("Cualquier persona con el enlace puede editar")
// y colocar el enlace aquí (ej: "https://drive.google.com/drive/folders/TU_ID_DE_CARPETA?usp=sharing").
// Si se deja vacío, el botón "Subir fotos" abrirá WhatsApp.
export const PHOTO_UPLOAD_URL = "";

// Secciones para la navegación (id debe coincidir con el id de cada <section>)
export const NAV_SECTIONS = [
    { id: "inicio", label: "Inicio" },
    { id: "historia", label: "Historia" },
    { id: "cuenta-regresiva", label: "Cuenta" },
    { id: "detalles", label: "Evento" },
    { id: "galeria", label: "Galería" },
    { id: "regalos", label: "Regalos" },
    { id: "confirmar", label: "RSVP" },
    { id: "mensajes", label: "Mensajes" },
];
