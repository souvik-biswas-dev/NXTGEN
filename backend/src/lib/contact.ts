// Contact masking — port of the Supabase `get_my_contact` / `admin_get_user_contact`
// behaviour. 99acres-style privacy: phone numbers are masked unless the viewer
// has earned access (they own/inquired, or are an admin).

export function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  const last2 = digits.slice(-2);
  return `${phone.startsWith('+') ? '+' : ''}${'•'.repeat(Math.max(digits.length - 2, 4))}${last2}`;
}

export function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const [user, domain] = email.split('@');
  if (!domain) return '•••';
  const shown = user.slice(0, 1);
  return `${shown}${'•'.repeat(Math.max(user.length - 1, 2))}@${domain}`;
}
