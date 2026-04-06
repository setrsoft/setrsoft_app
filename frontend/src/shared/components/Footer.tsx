import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-20 border-t border-ghost-border/30 bg-surface-lowest">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold tracking-tight mb-4">{t('footer.org')}</h3>
            <p className="text-sm text-on-surface-variant">
              {t('footer.sentence')}
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">{t('footer.docs')}</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li><a href="#" className="hover:text-mint transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-mint transition-colors">Developer Guide</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">{t('footer.about')}</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li><a href="#" className="hover:text-mint transition-colors">{t('footer.partners')}</a></li>
              <li><a href="#" className="hover:text-mint transition-colors">{t('footer.contact')}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ghost-border/30 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-on-surface-variant">
          <p>{t('footer.rights')}</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-mint transition-colors font-medium">LinkedIn</a>
            <a href="#" className="hover:text-mint transition-colors font-medium">Facebook</a>
            <a href="#" className="hover:text-mint transition-colors font-medium">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
