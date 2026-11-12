import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearUser } from './auth';

// Session timeout: log the user out after this many minutes with no activity.
// Tip for the demo: set to 1 to show it live.
export const IDLE_MINUTES: number = 15;

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

export function useIdleLogout(minutes = IDLE_MINUTES) {
  const navigate = useNavigate();

  useEffect(() => {
    let timer: number;

    function logout() {
      clearUser();
      navigate('/?timeout=1');
    }

    function reset() {
      window.clearTimeout(timer);
      timer = window.setTimeout(logout, minutes * 60 * 1000);
    }

    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      window.clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [minutes, navigate]);
}
