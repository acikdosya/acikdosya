"""
OG gorselleri icin statik font surumlerini uretir.

next/og'un altindaki satori yalnizca ttf, otf ve woff okur; sayfanin
kullandigi variable woff2 dosyalari gecmiyor. Bu script onlari acar,
wght=600'de sabitler ve app/_fonts/og/ altina yazar. Ciktilar repoya
commit edilir — build zamaninda uretilmezler, cunku fontTools JS
araclarinda yok.

Iki aile birden: Archivo 600 baslik ve arayuz icin, Source Serif 4 400
govde metni icin (CLAUDE.md §4). Paylasim kartlarinda duzeltme
gerekcesi gibi okunacak metinler var; onlar sayfadaki gibi serif.

latin ve latin-ext ayri kalir, birlestirilmez: ImageResponse'a ayri font
olarak verilir ve satori glif bulamadiginda sirayla sonrakine duser.
Sayfadaki font stack'i de ayni sekilde calisiyor. Birlestirmek yerine
ayri birakmanin bedeli yok, faydasi su: eksik alt kume yuklendiginde
gomulu bir yedek yazi tipine sessizce dusuldugu lib/og-fonts.test.ts
ile yakalanabiliyor.

Kaynak: app/_fonts/*.woff2 (SIL OFL 1.1, Omnibus-Type).
Calistirmak icin: python3 scripts/derive-og-font.py
Gereksinim: fontTools ve brotli.
"""

import io
import os
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import decompress
from fontTools.varLib import instancer

PAIRS = [
    ('app/_fonts/archivo-latin-wght-normal.woff2', 'app/_fonts/og/archivo-600-latin.ttf', 600),
    (
        'app/_fonts/archivo-latin-ext-wght-normal.woff2',
        'app/_fonts/og/archivo-600-latin-ext.ttf',
        600,
    ),
    (
        'app/_fonts/source-serif-4-latin-wght-normal.woff2',
        'app/_fonts/og/source-serif-400-latin.ttf',
        400,
    ),
    (
        'app/_fonts/source-serif-4-latin-ext-wght-normal.woff2',
        'app/_fonts/og/source-serif-400-latin-ext.ttf',
        400,
    ),
]

for source, target, weight in PAIRS:
    buffer = io.BytesIO()
    decompress(source, buffer)
    buffer.seek(0)

    font = TTFont(buffer)
    font = instancer.instantiateVariableFont(
        font, {'wght': weight}, inplace=True, optimize=True
    )
    font.flavor = None
    font.save(target)

    print(f'{target}  {os.path.getsize(target)} bayt')
