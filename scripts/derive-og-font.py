"""
OG gorselleri icin Archivo 600 statik surumunu uretir.

next/og'un altindaki satori yalnizca ttf, otf ve woff okur; sayfanin
kullandigi variable woff2 dosyalari gecmiyor. Bu script onlari acar,
wght=600'de sabitler ve app/_fonts/og/ altina yazar. Ciktilar repoya
commit edilir — build zamaninda uretilmezler, cunku fontTools JS
araclarinda yok.

latin ve latin-ext ayri kalir, birlestirilmez: ImageResponse'a iki font
olarak verilir ve satori glif bulamadiginda sirayla ikincisine duser.
Sayfadaki font stack'i de ayni sekilde calisiyor.

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
    ('app/_fonts/archivo-latin-wght-normal.woff2', 'app/_fonts/og/archivo-600-latin.ttf'),
    (
        'app/_fonts/archivo-latin-ext-wght-normal.woff2',
        'app/_fonts/og/archivo-600-latin-ext.ttf',
    ),
]

WEIGHT = 600

for source, target in PAIRS:
    buffer = io.BytesIO()
    decompress(source, buffer)
    buffer.seek(0)

    font = TTFont(buffer)
    font = instancer.instantiateVariableFont(
        font, {'wght': WEIGHT}, inplace=True, optimize=True
    )
    font.flavor = None
    font.save(target)

    print(f'{target}  {os.path.getsize(target)} bayt')
