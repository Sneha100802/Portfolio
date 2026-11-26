import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function useUse3D() {
  const [use3D, setUse3D] = useState(
    () => hasWebGL() && !window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setUse3D(hasWebGL() && !mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return use3D;
}
