// Constantes globales de configuración de la boda Stephanie & Dalvin.
// Fecha del evento CON zona horaria de República Dominicana (-04:00).
// Así la cuenta regresiva es idéntica para invitados en cualquier país.
// ⚠️ DATOS PENDIENTES DE VERIFICAR ANTES DE PUBLICAR:
//    - EVENT_DATA.whatsapp        (número real, formato internacional sin +)
export const EVENT_DATA = {
    date: "2026-11-07T17:00:00-04:00",
    displayDate: "7 DE NOVIEMBRE 2026",
    hashtag: "#Stephanie&Dalvin",
    estYear: "2023",
    whatsapp: "18299234460", // Número real (RD: 1 + 829 + 7 dígitos, sin "+")
};

// Padres — sección "Con la bendición de Dios y nuestros padres".
export const FAMILY = {
    brideParents: ["Damián Hilario Reyes Durán", "Indira Gandhi Pérez de Reyes"],
    groomParents: ["Manuel Alcibiades Báez Bidó", "Daniela Elvira Lorenzo Céspedes"],
    padrinos: [] as string[],
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

// Canción de los novios — reproductor flotante ("Presiona para escuchar nuestra canción").
// Opciones (por orden de preferencia):
//   1. audioUrl:    archivo mp3 en /public  → "/nuestra-cancion.mp3"  (mejor calidad, sin logos)
//   2. externalUrl: enlace de YouTube       → suena DENTRO de la página, sin abrir YouTube
//   3. externalUrl: enlace de Spotify/otro  → el botón abre el enlace en otra pestaña
// Si todo queda vacío, el reproductor no se muestra.
export const SONG = {
    title: "Nuestra Canción",
    artist: "Este amor - Itala & Janjo",
    audioUrl: "",
    externalUrl: "https://www.youtube.com/watch?v=bc-LfIbw1WY", // p.ej. "https://www.youtube.com/watch?v=XXXXXXXXXXX"
};

// --- Mesa de regalos --------------------------------------------------------
export const CASA_CUESTA = {
    url: "https://listaderegalos.casacuesta.com/Event/Stephanie-DalvinDaniel?utm_source=share",
    listNumber: "194090",
    note: "Disponible de forma digital y física",
};

export const BANK_ACCOUNTS = [
    {
        bank: "Banco Popular",
        type: "Cuenta Corriente",
        number: "844822163",
        holder: "Stephanie Reyes",
        cedula: "402-2683621-7",
    },
    {
        bank: "BanReservas",
        type: "Cuenta de Ahorro",
        number: "9607153892",
        holder: "Dalvin Báez",
        cedula: "012-0122558-6",
    },
];

export const API_CONFIG = {
    // La validación de cédula ahora pasa por nuestro backend: GET /api/cedula/:cedula
    // (consulta al JCE + fallback DGII).
    // En producción el backend vive en el mismo dominio bajo /api (ver vercel.json),
    // así que se usan rutas relativas. En local apunta al servidor de `npm run backend`.
    // Se puede forzar con la variable de entorno VITE_API_URL.
    backendUrl:
        (import.meta.env.VITE_API_URL as string | undefined) ??
        (import.meta.env.PROD ? "" : "http://localhost:3001"),
};

// --- Calendario -------------------------------------------------------------
// Datos base para generar tanto el enlace de Google como el archivo .ics (Apple/Outlook)
export const CALENDAR_EVENT = {
    title: "Boda de Stephanie & Dalvin",
    description: "Celebración de nuestra boda en Santo Domingo, República Dominicana.",
    location: "Catedral Castrense de Santa Bárbara, Santo Domingo",
    // UTC: 17:00 -04:00 => 21:00Z
    startUtc: "20261107T210000Z",
    endUtc: "20261108T040000Z",
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

// Enlaces a Google Maps.
export const MAPS_URLS = {
    ceremony: "https://maps.app.goo.gl/WaFNqHx5AjT2VEDk7",
    ceremonyParking: "https://maps.app.goo.gl/MiDWQpUH42F3vZC67",
    reception: "https://maps.app.goo.gl/prvLNchVxpEeSWnK7",
};

export const DRESS_CODE_DETAILS = {
    colors: "Inspírate en la paleta de otoño. Reservado el blanco y el beige para la novia."
};

// Álbum compartido para que los invitados suban fotos (p.ej. Google Drive, Google Fotos, iCloud, etc.).
// Puedes crear una carpeta de Google Drive configurada con acceso público de edición ("Cualquier persona con el enlace puede editar")
// y colocar el enlace aquí (ej: "https://drive.google.com/drive/folders/TU_ID_DE_CARPETA?usp=sharing").
// Si se deja vacío, el botón "Subir fotos" abrirá WhatsApp.
export const PHOTO_UPLOAD_URL = "";

// Secciones para la navegación (id debe coincidir con el id de cada <section>)
export const NAV_SECTIONS = [
    { id: "inicio", label: "Inicio" },
    { id: "historia", label: "Sacramento" },
    { id: "cuenta-regresiva", label: "Cuenta" },
    { id: "detalles", label: "Evento" },
    { id: "galeria", label: "Galería" },
    { id: "regalos", label: "Regalos" },
    { id: "confirmar", label: "RSVP" },
    { id: "mensajes", label: "Mensajes" },
];
