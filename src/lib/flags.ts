const countryFlags: Record<string, string> = {
  'bolivia': '🇧🇴',
  'argentina': '🇦🇷',
  'brasil': '🇧🇷',
  'chile': '🇨🇱',
  'colombia': '🇨🇴',
  'ecuador': '🇪🇨',
  'paraguay': '🇵🇾',
  'peru': '🇵🇪',
  'uruguay': '🇺🇾',
  'venezuela': '🇻🇪',
  'mexico': '🇲🇽',
  'españa': '🇪🇸',
  'inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'alemania': '🇩🇪',
  'francia': '🇫🇷',
  'italia': '🇮🇹',
  'portugal': '🇵🇹',
  'holanda': '🇳🇱',
  'belgica': '🇧🇪',
  'suecia': '🇸🇪',
  'dinamarca': '🇩🇰',
  'noruega': '🇳🇴',
  'polonia': '🇵🇱',
  'ucrania': '🇺🇦',
  'rusia': '🇷🇺',
  'japon': '🇯🇵',
  'corea': '🇰🇷',
  'china': '🇨🇳',
  'australia': '🇦🇺',
  'canada': '🇨🇦',
  'eeuu': '🇺🇸',
  'usa': '🇺🇸',
  'estados unidos': '🇺🇸',
  'costa rica': '🇨🇷',
  'honduras': '🇭🇳',
  'guatemala': '🇬🇹',
  'panama': '🇵🇦',
  'cuba': '🇨🇺',
  'republica dominicana': '🇩🇴',
  'puerto rico': '🇵🇷',
  'el salvador': '🇸🇻',
  'nicaragua': '🇳🇮',
}

export function getFlag(name: string): string {
  const clean = name.toLowerCase().trim()
  for (const [key, flag] of Object.entries(countryFlags)) {
    if (clean === key || clean.includes(key)) return flag
  }
  return ''
}
