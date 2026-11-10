/** Display-only formatting. Never changes stored prescription records. */
export function medicationIdentity(title: string, dosage: string, manufacturer: string) {
  let name = title.trim();
  let company = manufacturer.trim().replace(/^[-–—]\s*/, '');
  // Only recognize the manufacturers explicitly supported by the supplied layout examples.
  const companySuffix = name.match(/\s*[-–—]\s*(hikma|hilton|sanofi|servier)\s*$/i);
  if (companySuffix && (!company || company.toLowerCase() === companySuffix[1].toLowerCase())) {
    company ||= companySuffix[1];
    name = name.slice(0, companySuffix.index).trim();
  }
  let strength = dosage.trim();
  const suffix = name.match(/\s+(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*\s*(?:mg|mcg|µg|g|ml|IU))\s*$/i);
  // An explicit conflicting strength wins; keep the title intact so both facts remain visible.
  if (suffix && (!strength || strength.replace(/\s/g, '').toLowerCase() === suffix[1].replace(/\s/g, '').toLowerCase())) {
    strength ||= suffix[1];
    name = name.slice(0, suffix.index).trim();
  }
  return { title: name || title, dosage: strength, manufacturer: company };
}

export const genericSubtitle = (text: string) => text.replace(/\s*\/\s*/g, ' / ');

/** Supplied fields are opaque: never split numeric punctuation or repeated directions. */
export function instructionSummary(...parts: string[]): string {
  return parts.map(part => part.trim())
    .filter(part => part && part.toLowerCase() !== 'not provided')
    .join(' • ');
}
