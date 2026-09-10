import createNextIntlPlugin from 'next-intl/plugin';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /*
   * Docker imaji icin: .next/standalone altina kendi node_modules'unu
   * tasiyan bir sunucu cikar. Statik disa aktarim (output: 'export')
   * kullanilamaz — proxy.ts'teki next-intl ara katmani dil yonlendirmesini
   * istek aninda yapiyor, o da Node calisma zamani gerektiriyor.
   */
  output: 'standalone'
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
