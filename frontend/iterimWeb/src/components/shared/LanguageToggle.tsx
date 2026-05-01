import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

interface LanguageToggleProps {
  /** Tailwind klasės — leidžia tėviniam komponentui valdyti spalvą/spacing'ą. */
  className?: string;
}

/**
 * Pakartotinai naudojamas kalbos perjungiklis.
 * Spustelėjus — perjungia tarp `lt` ↔ `en`.
 * Mygtuke matomas dabartinės kalbos kodas (LT/EN), kad vartotojas
 * iš karto matytų, kuria kalba šiuo metu rodomas UI.
 */
export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={toggleLanguage}
      title={t('header.languageToggle.title')}
      aria-label={t('header.languageToggle.srLabel')}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-semibold uppercase">{language}</span>
    </Button>
  );
}
