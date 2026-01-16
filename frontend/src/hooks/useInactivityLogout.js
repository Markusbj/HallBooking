import { useEffect, useRef } from 'react';

/**
 * Custom hook for handling inactivity logout
 * Logs out user after specified minutes of inactivity
 * 
 * @param {Function} onLogout - Callback function to execute on logout
 * @param {number} inactivityMinutes - Minutes of inactivity before logout (default: 20)
 */
export function useInactivityLogout(onLogout, inactivityMinutes = 20) {
  const timeoutRef = useRef(null);
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout for inactivity
    timeoutRef.current = setTimeout(() => {
      if (onLogout) {
        console.log('User inactive, logging out...');
        onLogout();
      }
    }, inactivityMinutes * 60 * 1000); // Convert minutes to milliseconds
  };

  useEffect(() => {
    // Reset timeout on any user activity
    events.forEach(event => {
      window.addEventListener(event, resetTimeout, true);
    });

    // Initialize timeout
    resetTimeout();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout, true);
      });
    };
  }, [onLogout, inactivityMinutes]);
}
