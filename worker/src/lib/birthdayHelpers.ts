// worker/src/lib/birthdayHelpers.ts
// [WRK-2] Birthday validation helpers

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // [WRK-2]

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate + 'T00:00:00Z'); // [WRK-2]
  const now = new Date(); // [WRK-2]
  let age = now.getUTCFullYear() - birth.getUTCFullYear(); // [WRK-2]
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth(); // [WRK-2]
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1; // [WRK-2]
  }
  return age; // [WRK-2]
}

export function validateBirthDate(birthDate: string): string | null {
  if (!DATE_RE.test(birthDate)) {
    return 'invalid_format'; // [WRK-2]
  }

  const birth = new Date(birthDate + 'T00:00:00Z'); // [WRK-2]
  if (Number.isNaN(birth.getTime())) {
    return 'invalid_date'; // [WRK-2]
  }

  const age = calculateAge(birthDate); // [WRK-2]
  if (age < 13 || age > 120) {
    return 'invalid_age'; // [WRK-2]
  }

  return null; // [WRK-2]
}
