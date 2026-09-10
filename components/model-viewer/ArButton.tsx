'use client';

import {useEffect, useState} from 'react';
import styles from './ModelSection.module.css';

type XrLike = {isSessionSupported?: (mode: string) => Promise<boolean>};

/**
 * ARCore Scene Viewer intent'i. Runtime geometri kabul etmedigi icin
 * dosya build zamaninda pisirilir (scripts/bake-glb.mjs).
 * resizable=false: model olculu bir belge, kullanici olcegi bozmasin.
 */
function sceneViewerIntent(file: string, title: string, fallback: string) {
  const query = new URLSearchParams({
    file,
    mode: 'ar_preferred',
    title,
    resizable: 'false'
  });

  return (
    `intent://arvr.google.com/scene-viewer/1.0?${query}` +
    '#Intent;scheme=https;package=com.google.android.googlequicksearchbox;' +
    'action=android.intent.action.VIEW;' +
    `S.browser_fallback_url=${encodeURIComponent(fallback)};end;`
  );
}

/**
 * Yalnizca Android + ARCore'da render edilir. iOS icin USDZ yok, buton da yok.
 * Destek yoksa hic basilmaz — calismayan buton gostermeyiz.
 */
export function ArButton({
  modelUrl,
  title,
  label
}: {
  modelUrl: string;
  title: string;
  label: string;
}) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (!/android/i.test(navigator.userAgent)) return;

    const xr = (navigator as unknown as {xr?: XrLike}).xr;
    if (!xr?.isSessionSupported) return;

    let live = true;
    xr.isSessionSupported('immersive-ar')
      .then((ok) => {
        if (!live || !ok) return;
        setHref(sceneViewerIntent(modelUrl, title, window.location.href));
      })
      .catch(() => {
        // ARCore yok veya erisim reddedildi — buton gorunmez kalir.
      });

    return () => {
      live = false;
    };
  }, [modelUrl, title]);

  if (!href) return null;

  return (
    <a className={styles.button} href={href} rel="noopener">
      {label}
    </a>
  );
}
