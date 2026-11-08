import Link from 'next/link';
import { buttonClass } from '@/components/ui/primitives';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-5xl text-gold-300">404</p>
      <p className="mt-2 text-charcoal-200">Halaman tidak dijumpai.</p>
      <Link href="/" className={buttonClass('primary', 'mt-6')}>
        Kembali ke Papan Utama
      </Link>
    </div>
  );
}
