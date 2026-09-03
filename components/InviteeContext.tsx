import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_CONFIG } from '../constants';
import { getInviteeName } from '../utils/invitee';

type Access = 'full' | 'ceremony';

interface InviteeValue {
  /** Nombre del invitado (del registro que coincide, o del enlace). */
  name: string | null;
  /** Nivel de acceso resuelto. Por defecto 'full' (visitante sin enlace). */
  access: Access;
  /** true cuando ya se consultó el backend (o no hacía falta). */
  loaded: boolean;
  /** true si el enlace trae ?invitado= */
  hasParam: boolean;
  /** true solo si el enlace está confirmado como "solo ceremonia". */
  isCeremonyOnly: boolean;
}

const InviteeContext = createContext<InviteeValue>({
  name: null,
  access: 'full',
  loaded: true,
  hasParam: false,
  isCeremonyOnly: false,
});

export const useInvitee = () => useContext(InviteeContext);

export const InviteeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialName = getInviteeName();
  const [state, setState] = useState<{ name: string | null; access: Access; loaded: boolean }>({
    name: initialName,
    access: 'full',
    loaded: !initialName,
  });

  useEffect(() => {
    const name = getInviteeName();
    if (!name) return;
    let active = true;

    fetch(`${API_CONFIG.backendUrl}/api/invitee/${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (d && d.found) {
          setState({
            name: d.name || name,
            access: d.ceremonyOnly ? 'ceremony' : 'full',
            loaded: true,
          });
        } else {
          setState((s) => ({ ...s, loaded: true }));
        }
      })
      .catch(() => {
        if (active) setState((s) => ({ ...s, loaded: true }));
      });

    return () => {
      active = false;
    };
  }, []);

  const value: InviteeValue = {
    name: state.name,
    access: state.access,
    loaded: state.loaded,
    hasParam: Boolean(initialName),
    isCeremonyOnly: state.loaded && state.access === 'ceremony',
  };

  return <InviteeContext.Provider value={value}>{children}</InviteeContext.Provider>;
};
