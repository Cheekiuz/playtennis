export function parseDeskFilters(query: Record<string, string | string[] | undefined>) {
  return {
    q: one(query.q),
    country: one(query.country),
    city: one(query.city),
    format: one(query.format),
    surface: one(query.surface),
    playLevel: one(query.playLevel),
    age: one(query.age),
  };
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
