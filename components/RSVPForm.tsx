import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronDown, Users, AlertCircle } from 'lucide-react';
import { ThankYou } from './ThankYou';
import { API_CONFIG } from '../constants';

interface RSVPFormProps {
  id: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const RSVPForm: React.FC<RSVPFormProps> = ({ id, isModal, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    attending: 'yes',
    guests: '1 Invitado',
    dietary: '',
    message: '',
    honeypot: '' // Anti-spam field
  });

  const [cedulas, setCedulas] = useState<string[]>(['']);
  const [cedulaStatus, setCedulaStatus] = useState<('idle' | 'loading' | 'valid' | 'invalid')[]>(['idle']);

  useEffect(() => {
    const guestCount = parseInt(formData.guests.split(' ')[0]);
    setCedulas(prev => {
      const newCedulas = [...prev];
      if (guestCount > newCedulas.length) {
        return [...newCedulas, ...Array(guestCount - newCedulas.length).fill('')];
      } else if (guestCount < newCedulas.length) {
        return newCedulas.slice(0, guestCount);
      }
      return newCedulas;
    });
    setCedulaStatus(prev => {
      const newStatus = [...prev];
      if (guestCount > newStatus.length) {
        return [...newStatus, ...Array(guestCount - newStatus.length).fill('idle')];
      } else if (guestCount < newStatus.length) {
        return newStatus.slice(0, guestCount);
      }
      return newStatus;
    });
  }, [formData.guests]);

  const validateCedula = async (index: number, value: string) => {
    const cleanCedula = value.replace(/[^0-9]/g, '');
    if (cleanCedula.length !== 11) {
      const newStatus = [...cedulaStatus];
      newStatus[index] = 'idle';
      setCedulaStatus(newStatus);
      return;
    }

    const newStatus = [...cedulaStatus];
    newStatus[index] = 'loading';
    setCedulaStatus(newStatus);

    try {
      const response = await fetch(`${API_CONFIG.cedulaValidationBaseUrl}${cleanCedula}/validate`);
      const data = await response.json();

      const updatedStatus = [...cedulaStatus];
      updatedStatus[index] = data.valid ? 'valid' : 'invalid';
      setCedulaStatus(updatedStatus);
    } catch (error) {
      console.error('Error validating cedula:', error);
      const updatedStatus = [...cedulaStatus];
      updatedStatus[index] = 'idle'; // Fallback to idle if API fails
      setCedulaStatus(updatedStatus);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.honeypot) {
      console.log('Spam detected');
      return;
    }

    if (formData.attending === 'yes' && cedulaStatus.some(s => s !== 'valid')) {
      alert('Por favor verifique que todas las cédulas sean válidas.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_CONFIG.backendUrl}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cedulas
        })
      });

      if (!response.ok) throw new Error('Error en el envío');

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      alert('Hubo un error al enviar tu confirmación. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }

    if (!isModal) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleCedulaChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9-]/g, ''); // Allow only numbers and dashes
    const newCedulas = [...cedulas];
    newCedulas[index] = cleanValue;
    setCedulas(newCedulas);

    // Debounce validation? For now simple check on length
    if (cleanValue.replace(/-/g, '').length === 11) {
      validateCedula(index, cleanValue);
    } else {
      const newStatus = [...cedulaStatus];
      newStatus[index] = 'idle';
      setCedulaStatus(newStatus);
    }
  };

  const content = (
    <div className={`relative z-10 w-full ${isModal ? '' : 'max-w-3xl px-4 md:px-0'}`}>
      <motion.div
        initial={isModal ? {} : { opacity: 0, y: 30 }}
        whileInView={isModal ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`bg-white rounded-[2rem] border-4 border-[#b35a44]/10 ${isModal ? '' : 'shadow-2xl p-6 md:p-12 max-w-xl mx-auto overflow-hidden max-[480px]:p-8'}`}
      >
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className={isModal ? 'p-6 md:p-8' : ''}
            >
              <div className="text-center mb-6 md:mb-10">
                <span className="text-[#b35a44] text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] mb-3 md:mb-4 block">CONFIRMACIÓN</span>
                <h2 className="font-signature text-3xl md:text-5xl text-[#4a5d23] mb-2">Confirma tu Asistencia</h2>
                <p className="text-stone-400 text-[10px] italic">Por favor confirma antes del 11 de Octubre, 2026.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  {/* Honeypot field (hidden) */}
                  <div className="hidden pointer-events-none opacity-0 h-0">
                    <input
                      type="text"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[10px] md:text-[11px] font-bold text-stone-600 ml-1 uppercase tracking-wider">Nombre Completo</label>
                    <input
                      required
                      className="w-full px-4 py-3 border border-stone-100 bg-stone-50 rounded-lg focus:outline-none focus:border-[#4a5d23] focus:bg-white transition-all text-sm text-stone-700"
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[10px] md:text-[11px] font-bold text-stone-600 ml-1 uppercase tracking-wider">Correo Electrónico</label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 border border-stone-100 bg-stone-50 rounded-lg focus:outline-none focus:border-[#4a5d23] focus:bg-white transition-all text-sm text-stone-700"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-3 py-4 border-y border-stone-100">
                  <span className="text-[10px] md:text-[11px] font-bold text-stone-600 ml-1 uppercase tracking-wider">¿Asistirás a la celebración?</span>
                  <div className="flex justify-start space-x-8 md:space-x-12 ml-1">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="attending"
                        value="yes"
                        checked={formData.attending === 'yes'}
                        onChange={() => setFormData({ ...formData, attending: 'yes' })}
                        className="w-4 h-4 accent-[#4a5d23]"
                      />
                      <span className="text-xs text-stone-600 group-hover:text-stone-800 transition-colors">Sí, con gusto</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="attending"
                        value="no"
                        checked={formData.attending === 'no'}
                        onChange={() => setFormData({ ...formData, attending: 'no' })}
                        className="w-4 h-4 accent-[#4a5d23]"
                      />
                      <span className="text-xs text-stone-600 group-hover:text-stone-800 transition-colors">Lamentablemente no</span>
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {formData.attending === 'yes' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-1 md:space-y-2">
                        <label className="text-[10px] md:text-[11px] font-bold text-stone-600 ml-1 uppercase tracking-wider">Número de Invitados</label>
                        <select
                          className="w-full px-4 py-3 border border-stone-100 bg-stone-50 rounded-lg focus:outline-none focus:border-[#4a5d23] focus:bg-white transition-all text-sm text-stone-700 cursor-pointer"
                          value={formData.guests}
                          onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                        >
                          {['1 Invitado', '2 Invitados', '3 Invitados', '4 Invitados'].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        {cedulas.map((cedula, index) => (
                          <div key={index} className="space-y-1 md:space-y-2 relative">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] md:text-[11px] font-bold text-stone-600 ml-1 uppercase tracking-wider">
                                Cédula {cedulas.length > 1 ? `Persona ${index + 1}` : ''}
                              </label>
                              <span className={`text-[8px] font-bold uppercase transition-colors px-2 py-0.5 rounded ${cedulaStatus[index] === 'valid' ? 'bg-green-100 text-green-600' :
                                cedulaStatus[index] === 'invalid' ? 'bg-red-100 text-red-600' :
                                  cedulaStatus[index] === 'loading' ? 'bg-blue-100 text-blue-600 animate-pulse' : 'hidden'
                                }`}>
                                {cedulaStatus[index] === 'valid' ? '✓ Válida' :
                                  cedulaStatus[index] === 'invalid' ? '✕ Inválida' :
                                    'Validando...'}
                              </span>
                            </div>
                            <input
                              required
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:bg-white transition-all text-sm text-stone-700 ${cedulaStatus[index] === 'valid' ? 'border-green-200 bg-green-50/30 focus:border-green-500' :
                                cedulaStatus[index] === 'invalid' ? 'border-red-200 bg-red-50/30 focus:border-red-500' :
                                  'border-stone-100 bg-stone-50 focus:border-[#4a5d23]'
                                }`}
                              placeholder="001-0000000-0"
                              value={cedula}
                              onChange={(e) => handleCedulaChange(index, e.target.value)}
                            />
                          </div>
                        ))}
                        <p className="text-[10px] text-stone-400 italic px-1">
                          * La cédula es un requisito del club de la recepción.
                        </p>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <label className="text-[10px] md:text-[11px] font-bold text-stone-600 ml-1 uppercase tracking-wider">Restricciones</label>
                        <input
                          className="w-full px-4 py-3 border border-stone-100 bg-stone-50 rounded-lg focus:outline-none focus:border-[#4a5d23] focus:bg-white transition-all text-sm text-stone-700"
                          placeholder="Alergias (Opcional)"
                          value={formData.dietary}
                          onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmitting || (formData.attending === 'yes' && cedulaStatus.some(s => s === 'loading'))}
                  className={`w-full py-4 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98] ${isSubmitting ? 'bg-stone-400 cursor-wait' : 'bg-[#4a5d23] hover:bg-[#394a1b] text-white'
                    }`}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar respuesta'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="thank-you"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className={isModal ? 'p-12' : ''}
            >
              <ThankYou />
              {isModal && (
                <div className="mt-8 text-center">
                  <button
                    onClick={onClose}
                    className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-600"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  if (isModal) return content;

  return (
    <section id={id} className="relative py-16 md:py-24 bg-[#b35a44] min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(white_0.8px,transparent_0.8px)] [background-size:24px_24px]"></div>
      </div>
      {content}
    </section>
  );
};
