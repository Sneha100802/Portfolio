import raw from '../content.json';

// Recursively removes any value that is exactly "TODO"
function clean(value) {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([k, v]) => [k, clean(v)])
        .filter(([, v]) => v !== undefined)
    );
  }
  return value === 'TODO' ? undefined : value;
}

export const content = clean(raw);
