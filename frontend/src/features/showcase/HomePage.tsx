import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ROUTES } from '@/core/config';
import { posthog } from '@/shared/analytics/posthog';
import demoVideo from '@/assets/demo-CISe8V-c.mp4';

export function HomePage() {
  const { t } = useTranslation();
  const [repoStats, setRepoStats] = useState<null | { stars: number; forks: number }>(null);
  const [repoStatsError, setRepoStatsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('https://api.github.com/repos/setrsoft/setrsoft_app')
      .then(async (res) => {
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setRepoStats({
          stars: Number(data?.stargazers_count ?? 0),
          forks: Number(data?.forks_count ?? 0),
        });
        setRepoStatsError(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Keep the UI stable if GitHub rate-limits/blocks this request.
        setRepoStatsError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
    <Helmet>
      <title>SetRsoft – Éditeur 3D Bouldering en ligne</title>
      <meta name="description" content="Éditeur 3D virtuel pour créer vos blocs d'escalade bouldering. Simulation, routesetting, partage de séquences." />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "SetRsoft",
        "applicationCategory": "SportsApplication",
        "operatingSystem": "Web",
        "description": "Éditeur 3D de blocs d'escalade bouldering en ligne. Routesetting virtuel.",
        "url": "https://setrsoft.com",
        "offers": { "@type": "Offer", "price": "0" }
      })}</script>
    </Helmet>
    <div className="flex flex-col gap-24 py-12 md:py-20 animate-fade-in">
      
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
          SetRsoft
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant mb-10 max-w-2xl mx-auto font-medium">
          {t('hero.subtitle')}
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <Link
            to={ROUTES.EDITOR}
            className="bg-gradient-to-br from-mint-dim to-mint text-on-primary font-bold px-8 py-3.5 rounded-sm transition-transform hover:scale-105 shadow-lg shadow-mint/20"
            onClick={() => posthog.capture({ distinctId: 'anonymous', event: 'editor cta clicked', properties: { source: 'hero' } })}
          >
            {t('hero.test_editor')}
          </Link>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <a
              href="https://dataset.setrsoft.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-high text-white font-medium px-6 py-2.5 rounded-sm hover:bg-surface-lowest transition-colors border border-transparent hover:border-ghost-border/50 text-sm"
            >
              {t('hero.holds_database')}
            </a>
            <Link 
              to="#" 
              className="bg-surface-high text-white font-medium px-6 py-2.5 rounded-sm hover:bg-surface-lowest transition-colors border border-transparent hover:border-ghost-border/50 text-sm"
            >
              {t('hero.stock_management')}
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {t('demo.title')}
          </h2>
          <p className="text-on-surface-variant text-sm md:text-base">
            {t('demo.subtitle')}
          </p>
        </div>
        <div className="w-full max-w-4xl rounded-md overflow-hidden border border-ghost-border/30 bg-surface-low shadow-xl">
          <video
            src={demoVideo}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="w-full block"
          />
        </div>
      </section>

      {/* Split Organization Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Developers Block */}
        <div className="bg-surface-low rounded-md p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-sm bg-surface-high text-mint">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('split.dev_title')}</h2>
            <p className="text-on-surface-variant mb-6 line-clamp-3">
              {t('split.dev_desc')}
            </p>
            
            {/* Github Stats */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant font-tabular-nums">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span>
                  {repoStats
                    ? `${repoStats.stars.toLocaleString()} ${t('split.stats_stars_label')}`
                    : repoStatsError
                      ? `— ${t('split.stats_stars_label')}`
                      : t('split.stats_loading')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant font-tabular-nums">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><path d="M18 9v1a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V9"></path><path d="M12 12v3"></path></svg>
                <span>
                  {repoStats
                    ? `${repoStats.forks.toLocaleString()} ${t('split.stats_forks_label')}`
                    : repoStatsError
                      ? `— ${t('split.stats_forks_label')}`
                      : t('split.stats_loading')}
                </span>
              </div>
            </div>
          </div>
          <div>
            <a 
              href="https://github.com/setrsoft/setrsoft_app"
              target="_blank" 
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-mint font-medium hover:underline underline-offset-4"
            >
              {t('split.dev_btn')}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>

        {/* Routesetters Block */}
        <div className="bg-surface-high rounded-md p-8 md:p-12 flex flex-col justify-between border border-surface-lowest">
          <div>
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-sm bg-surface-low text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('split.setter_title')}</h2>
            <p className="text-on-surface-variant mb-8 line-clamp-3">
              {t('split.setter_desc')}
            </p>
          </div>
          <div>
            <Link 
              to={ROUTES.EDITOR} 
              className="inline-flex items-center gap-2 text-white font-medium hover:text-mint transition-colors"
            >
              {t('split.setter_btn')}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}
