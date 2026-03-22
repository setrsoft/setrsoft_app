import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ru', label: 'Русский' },
  { code: 'cn', label: '中文' }
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en';
  const selectedOption = languages.find(lng => currentLanguage.startsWith(lng.code))?.code || 'en';

  return (
    <div className="flex items-center">
      <select
        value={selectedOption}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="text-xs font-medium px-2 py-1 rounded-sm bg-transparent text-on-surface-variant hover:text-white transition-colors appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-surface-high"
      >
        {languages.map((lng) => (
          <option key={lng.code} value={lng.code} className="bg-background text-on-surface">
            {lng.label}
          </option>
        ))}
      </select>
    </div>
  );
}
