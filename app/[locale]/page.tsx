import {getTranslations, setRequestLocale} from 'next-intl/server';
import {getSystemSlugs, getSystem} from '@/lib/content';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';

type Props = {params: Promise<{locale: string}>};

export default async function HomePage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Home');
  const systems = getSystemSlugs()
    .map((slug) => getSystem(slug))
    .filter((system) => system !== undefined);

  return (
    <div className="py-14">
      <h1 className="mb-8 text-4xl font-semibold tracking-tight">
        {t('heading')}
      </h1>
      <ul className="border-t border-rule">
        {systems.map((system) => (
          <li key={system.slug} className="border-b border-rule">
            <Link
              href={{pathname: '/sistemler/[slug]', params: {slug: system.slug}}}
              className="flex flex-wrap items-baseline gap-x-4 py-5 hover:text-signal"
            >
              <span className="font-display text-2xl font-semibold">
                {system.name[locale as Locale]}
              </span>
              <span className="text-sm text-ink-2">
                {system.summary?.[locale as Locale] ?? system.manufacturer.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
