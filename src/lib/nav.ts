import type { IconName } from '@/components/ui/Icon';

export type NavItem = {
  href: string;
  label: string;
  /** Short label for the mobile bottom bar. */
  short: string;
  labelEn: string;
  icon: IconName;
  /** False while the module's main feature is still being built. */
  ready: boolean;
  description: string;
  /** What is already usable before the module's main phase lands. */
  availableNow?: string;
};


export const NAV: NavItem[] = [
  { href: '/', short: 'Utama', label: 'Papan Utama', labelEn: 'Dashboard', icon: 'home', ready: true, description: 'Ringkasan kemajuan dan sambung belajar.' },
  { href: '/learn', short: 'Belajar', label: 'Mula Belajar', labelEn: 'Start Learning', icon: 'route', ready: true, description: 'Program 48 jam, sesi demi sesi.' },
  { href: '/fundamentals', short: 'Asas', label: 'Asas Catur', labelEn: 'Chess Fundamentals', icon: 'book', ready: false, description: 'Papan, buah catur dan peraturan dari sifar.', availableNow: 'Penjelajah buah catur' },
  { href: '/openings', short: 'Pembukaan', label: 'Akademi Pembukaan', labelEn: 'Opening Academy', icon: 'flag', ready: true, description: 'Italian Game, Sicilian dan King’s Indian – tunjuk dan latih langkah demi langkah.' },
  { href: '/tactics', short: 'Taktik', label: 'Taktik Agresif', labelEn: 'Aggressive Tactics', icon: 'bolt', ready: false, description: 'Fork, pin, skewer, pengorbanan dan corak mat.' },
  { href: '/formations', short: 'Formasi', label: 'Perpustakaan Formasi', labelEn: 'Formation Library', icon: 'grid', ready: false, description: 'Struktur Pion dan cara menyerangnya.' },
  { href: '/prediction', short: 'Ramalan', label: 'Ramalan AI', labelEn: 'AI Prediction', icon: 'spark', ready: true, description: 'Jurulatih serangan: ancaman, 3 langkah calon, jawapan lawan dan petunjuk berperingkat.' },
  { href: '/play', short: 'Main', label: 'Lawan AI', labelEn: 'Play Against AI', icon: 'play', ready: true, description: 'Main lawan Stockfish pada 8 tahap, atau mod dua pemain.' },
  { href: '/masterclass', short: 'GM', label: 'Kelas Grandmaster', labelEn: 'Grandmaster Masterclass', icon: 'crown', ready: false, description: 'Permainan serangan Tal, Kasparov, Polgár dan lain-lain.' },
  { href: '/analysis', short: 'Analisis', label: 'Analisis Permainan', labelEn: 'Game Analysis', icon: 'chart', ready: false, description: 'Semak permainan dengan enjin: kesilapan, blunder, ketepatan.', availableNow: 'Import PGN/FEN' },
  { href: '/progress', short: 'Kemajuan', label: 'Kemajuan Saya', labelEn: 'My Progress', icon: 'trophy', ready: true, description: 'Sesi selesai, masa belajar dan laporan.' },
];

/** Shown directly in the mobile bottom bar; the rest live under "Lagi". */
export const MOBILE_PRIMARY = ['/', '/learn', '/tactics', '/play'];

export function isActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return href === '/' ? p === '/' : p === href || p.startsWith(`${href}/`);
}
