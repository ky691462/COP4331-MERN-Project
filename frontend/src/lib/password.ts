// Password rules shown live on the Register page.
// Keep these in sync with the backend's server-side check.
export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'num', label: 'A number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'A special character (like ! or #)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function passwordOk(p: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(p));
}
