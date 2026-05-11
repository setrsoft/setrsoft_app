import { useTranslation, Trans } from 'react-i18next';

const EMAIL = 'contact@setrsoft.com';

export function ContactPage() {
  const { t } = useTranslation();

  return (
    <>
      <title>Contact – SetRsoft</title>
      <meta name="description" content="Contactez l'équipe SetRsoft pour intégrer l'éditeur 3D dans votre salle d'escalade bouldering." />
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-6">{t('contact.title')}</h1>
        <p className="text-on-surface-variant text-lg">
          <Trans
            i18nKey="contact.body"
            components={{ emailLink: <a href={`mailto:${EMAIL}`} className="text-mint hover:underline" /> }}
          />
        </p>
      </div>
    </>
  );
}
