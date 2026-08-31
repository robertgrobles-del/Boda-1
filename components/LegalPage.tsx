import React, { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { EVENT_DATA } from '../constants';

type LegalKind = 'privacidad' | 'terminos';

const LAST_UPDATED = '31 de agosto de 2026';
const CONTACT_EMAIL = 'robertgrobles@gmail.com';

const goHome = () => {
  window.history.pushState(null, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-serif text-xl font-bold text-stone-800">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-stone-600">{children}</div>
  </section>
);

const PrivacyContent: React.FC = () => (
  <>
    <p>
      Este sitio es una invitación privada para la boda de <strong>Stephanie &amp; Dalvin</strong>{' '}
      ({EVENT_DATA.displayDate}). No es un servicio comercial. A continuación se explica qué datos se
      recogen y cómo se usan.
    </p>

    <Section title="1. Datos que recopilamos">
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Confirmación de asistencia (RSVP):</strong> nombre, número de teléfono, PIN de
          invitación, número de cédula de cada acompañante, correo electrónico (opcional),
          restricciones alimentarias y mensajes que decidas enviar.
        </li>
        <li>
          <strong>Libro de mensajes:</strong> el nombre y el texto que escribas voluntariamente.
        </li>
        <li>
          <strong>Fotos y videos:</strong> los archivos que subas en la sección de recuerdos.
        </li>
      </ul>
    </Section>

    <Section title="2. Para qué usamos los datos">
      <ul className="list-disc space-y-1 pl-5">
        <li>Organizar el evento: control de aforo, lista de invitados y logística.</li>
        <li>Validar el número de cédula con el registro oficial (JCE / DGII) únicamente para confirmar la identidad del invitado.</li>
        <li>Mostrar los mensajes del libro de firmas a los novios.</li>
        <li>Guardar los recuerdos fotográficos compartidos por los invitados.</li>
      </ul>
      <p>No vendemos, alquilamos ni compartimos estos datos con terceros con fines publicitarios.</p>
    </Section>

    <Section title="3. Dónde se guardan">
      <p>
        Los datos de confirmación y mensajes se almacenan en una base de datos alojada en Supabase.
        Las fotos y videos se guardan en Google Drive, en la cuenta personal de los organizadores.
        Estos proveedores aplican sus propias medidas de seguridad y pueden procesar la información en
        servidores fuera de República Dominicana.
      </p>
    </Section>

    <Section title="4. Conservación">
      <p>
        La información se conserva hasta un tiempo razonable después de la boda y luego se elimina.
        Puedes pedir que borremos tus datos antes escribiendo al contacto indicado más abajo.
      </p>
    </Section>

    <Section title="5. Tus derechos">
      <p>
        Puedes solicitar acceso, corrección o eliminación de tus datos, o retirar tu consentimiento,
        escribiendo a <a className="text-terracotta underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </Section>

    <Section title="6. Cookies">
      <p>
        El sitio no usa cookies de seguimiento ni publicidad. Solo se utiliza almacenamiento local del
        navegador para recordar preferencias de la interfaz (por ejemplo, ajustes del panel de
        administración).
      </p>
    </Section>

    <Section title="7. Contacto">
      <p>
        Para cualquier duda sobre esta política de privacidad, escribe a{' '}
        <a className="text-terracotta underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </Section>
  </>
);

const TermsContent: React.FC = () => (
  <>
    <p>
      Al usar este sitio de invitación de la boda de <strong>Stephanie &amp; Dalvin</strong> aceptas
      las siguientes condiciones.
    </p>

    <Section title="1. Uso del sitio">
      <p>
        Este sitio es de uso personal y privado para los invitados a la boda. La confirmación de
        asistencia requiere un número de teléfono y un PIN de invitación válidos. No está permitido
        usar el sitio para fines distintos de los previstos.
      </p>
    </Section>

    <Section title="2. Información veraz">
      <p>
        Al confirmar asistencia te comprometes a proporcionar datos reales y correctos (nombre,
        cédula, cantidad de acompañantes). Los organizadores pueden ajustar o cancelar confirmaciones
        que contengan información inexacta o que superen el cupo asignado.
      </p>
    </Section>

    <Section title="3. Contenido que compartes">
      <p>
        Eres responsable de las fotos, videos y mensajes que subas. No publiques contenido ofensivo,
        ilegal o que vulnere derechos de terceros. Los organizadores pueden eliminar cualquier
        contenido a su criterio.
      </p>
    </Section>

    <Section title="4. Disponibilidad">
      <p>
        El sitio se ofrece «tal cual», sin garantías de disponibilidad continua. Puede dejar de estar
        accesible después del evento.
      </p>
    </Section>

    <Section title="5. Privacidad">
      <p>
        El tratamiento de tus datos se rige por nuestra{' '}
        <a className="text-terracotta underline" href="/privacidad">Política de Privacidad</a>.
      </p>
    </Section>

    <Section title="6. Contacto">
      <p>
        Dudas sobre estas condiciones:{' '}
        <a className="text-terracotta underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </Section>
  </>
);

export const LegalPage: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const title = kind === 'privacidad' ? 'Política de Privacidad' : 'Términos y Condiciones';

  useEffect(() => {
    document.title = `${title} · Stephanie & Dalvin`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-screen bg-cream text-stone-800">
      <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        <button
          onClick={goHome}
          className="mb-10 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:text-stone-800"
        >
          <ChevronLeft size={16} /> Volver a la invitación
        </button>

        <header className="mb-10 border-b border-stone-200 pb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-terracotta">
            Stephanie &amp; Dalvin
          </span>
          <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900">{title}</h1>
          <p className="mt-2 text-xs text-stone-400">Última actualización: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-8">
          {kind === 'privacidad' ? <PrivacyContent /> : <TermsContent />}
        </div>

        <footer className="mt-14 border-t border-stone-200 pt-6 text-xs text-stone-400">
          <a className="text-terracotta underline" href={kind === 'privacidad' ? '/terminos' : '/privacidad'}>
            {kind === 'privacidad' ? 'Términos y Condiciones' : 'Política de Privacidad'}
          </a>
        </footer>
      </div>
    </div>
  );
};
