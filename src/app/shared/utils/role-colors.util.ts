/** Chave do mapa (nome da função → cor em hex) guardado no navegador. */
const STORAGE_KEY = 'tickest.roleColors';

type RoleColorMap = Record<string, string>;

/** Lê o mapa salvo; mapa vazio se não houver nada ou a leitura falhar. */
function readMap(): RoleColorMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Salva o mapa; não quebra a tela se a escrita falhar (ex.: modo privado). */
function writeMap(map: RoleColorMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Prévia não persiste nesta sessão; a tela continua funcionando.
  }
}

/** Formato aceito pra cor de função: hex de 6 dígitos, o mesmo que o `<input type="color">` produz. */
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/**
 * Cor escolhida pra uma função, ou `null` se nenhuma foi escolhida (cai no acento padrão,
 * índigo). **Prévia só neste navegador** — o back-end não tem campo de cor na função ainda,
 * então isso não é dado real, não sincroniza entre usuários/dispositivos. Cor salva que não passa
 * no contraste do badge (gravada antes da validação existir, ou editada à mão no navegador) também
 * cai no índigo — nenhuma tela que mostra o badge precisa revalidar por conta própria.
 */
export function getRoleColor(roleName: string): string | null {
  const color = readMap()[roleName];
  if (!color || !HEX_COLOR_PATTERN.test(color) || !hasAccessibleRoleColorContrast(color)) return null;
  return color;
}

/** Salva a cor escolhida pra uma função. */
export function setRoleColor(roleName: string, hex: string): void {
  const map = readMap();
  map[roleName] = hex;
  writeMap(map);
}

/** Remove a cor customizada de uma função, voltando ao acento padrão (índigo). */
export function clearRoleColor(roleName: string): void {
  const map = readMap();
  delete map[roleName];
  writeMap(map);
}

/** Converte uma cor hex (#rrggbb) em componentes RGB (0-255). */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    parseInt(normalized.substring(0, 2), 16),
    parseInt(normalized.substring(2, 4), 16),
    parseInt(normalized.substring(4, 6), 16)
  ];
}

/** Mistura dois componentes de cor na mesma proporção usada pelo `color-mix(in srgb, ...)` do CSS. */
function mixChannel(a: number, b: number, ratioOfA: number): number {
  return a * ratioOfA + b * (1 - ratioOfA);
}

/** Luminância relativa (WCAG), a partir de componentes RGB (0-255) já linearizados. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map(channel => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Taxa de contraste WCAG entre duas cores RGB (0-255). */
function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Verifica se a cor escolhida gera contraste suficiente (WCAG AA, 4.5:1) no badge de função
 * (`.badge-role-custom`, `styles.css`) no modo claro — fundo `color-mix(cor 15%, branco)`, texto
 * `color-mix(cor 65%, preto)`. É o pior dos dois temas: cores muito claras (perto do branco)
 * deixam fundo e texto quase iguais; o par do modo escuro (fundo escuro, texto claro) não sofre
 * desse problema pela mesma cor.
 */
export function hasAccessibleRoleColorContrast(hex: string): boolean {
  const rgb = hexToRgb(hex);
  const background: [number, number, number] = [
    mixChannel(rgb[0], 255, 0.15), mixChannel(rgb[1], 255, 0.15), mixChannel(rgb[2], 255, 0.15)
  ];
  const text: [number, number, number] = [
    mixChannel(rgb[0], 0, 0.65), mixChannel(rgb[1], 0, 0.65), mixChannel(rgb[2], 0, 0.65)
  ];
  return contrastRatio(background, text) >= 4.5;
}
