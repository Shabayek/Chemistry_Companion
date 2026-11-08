/**
 * Renders a formula or equation with proper subscripts: "Ca(OH)2" -> Ca(OH)₂, "(C2H4)n" -> (C₂H₄)ₙ.
 * Digits directly after an element symbol or ")" are subscripts; digits starting a term ("2H2O") are coefficients.
 * Screen readers get the plain text (visually hidden); the styled version is aria-hidden.
 */
export function Formula({ value, className }: { value: string; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {formulaParts(value).map((p, i) => (p.sub ? <sub key={i}>{p.text}</sub> : <span key={i}>{p.text}</span>))}
      </span>
    </span>
  );
}

function formulaParts(value: string): { text: string; sub: boolean }[] {
  const parts: { text: string; sub: boolean }[] = [];
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]!;
    const prev = value[i - 1] ?? '';
    const last = parts[parts.length - 1];
    let sub = false;
    if (/\d/.test(ch)) sub = /[A-Za-z)]/.test(prev) || (/\d/.test(prev) && last?.sub === true);
    else if (ch === 'n') sub = prev === ')';
    if (last && last.sub === sub) last.text += ch;
    else parts.push({ text: ch, sub });
  }
  return parts;
}
