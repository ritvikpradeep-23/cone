const FORBIDDEN_PATTERNS = [
  /<script/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /on\w+\s*=/i, // onclick=, onload=, onmouseover=, etc.
  /\baction\s*=/i,
  /javascript:/i,
];

const HREF_PATTERN = /href\s*=\s*["']([^"']*)["']/gi;

export function findSafetyViolation(html: string): string | null {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(html)) {
      return `matched forbidden pattern: ${pattern}`;
    }
  }

  for (const match of html.matchAll(HREF_PATTERN)) {
    const target = match[1].trim();
    if (target !== "" && !target.startsWith("#")) {
      return `href target outside fragment: "${target}"`;
    }
  }

  return null;
}
