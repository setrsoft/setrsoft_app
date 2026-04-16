import { useTranslation, Trans } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const EMAIL = 'contact@setrsoft.com';

export function PartnersPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>Partenaires – SetRsoft</title>
        <meta name="description" content="Salles d'escalade partenaires de SetRsoft, logiciel de routesetting 3D bouldering." />
      </Helmet>
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-6">{t('partners.title')}</h1>
        <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed">
          <Trans
            i18nKey="partners.body"
            components={{ emailLink: <a href={`mailto:${EMAIL}`} className="text-mint hover:underline" /> }}
          />
        </p>
      </div>
    </>
  );
}
