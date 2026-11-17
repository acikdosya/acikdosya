## 1. Kit: anahtar kesit

- [x] 1.1 `lib/geometry/parts.ts`: `LatheStation.section`, `stationSections`, `stationExtents`, `isSectioned`; sınır ve çapa istasyon başına; `pnpm typecheck` geçsin
- [x] 1.2 `lib/geometry/build3d.ts` ve `project2d.ts`: istasyon başına halka ve uzanım; `pnpm test` geçsin
- [x] 1.3 `lib/geometry/sections.test.ts`: geçiş, red, sınır/izdüşüm, 3B nokta sayısı; `pnpm test` geçsin
- [x] 1.4 Altı mevcut ürünün sınır ve izdüşümleri değişiklikten önce/sonra aynı; karşılaştırma sonucu PR'da

## 2. KIZILELMA ürünü

- [ ] 2.1 Karelerden okuma: yan profil, kesitler, uç köşeleri, kanard, kuyruk, takım; sonuçlar `docs/research/kizilelma-sources.md`'ye; `pnpm lint` geçsin
- [ ] 2.2 `lib/geometry/kizilelma.ts` ve `registry.ts`; oranlar köken beyanıyla, `omitted`; `pnpm typecheck` geçsin
- [ ] 2.3 `messages/*.json` `RatioLabels`; `pnpm test` geçsin
- [ ] 2.4 `lib/geometry/kizilelma.test.ts`: oranların parçalarda karşılığı, yükseklik, köken; `pnpm test` geçsin
- [ ] 2.5 Sabit kamerayla siluet örtüşmesi (18 kare) ölçülür ve nota yazılır

## 3. İçerik ve kayıt

- [ ] 3.1 `content/systems/kizilelma.json` etiketleri; `pnpm validate:content` geçsin
- [ ] 3.2 `content/assets.json` `geometry-parametric-kizilelma`; `pnpm validate:content` geçsin
- [ ] 3.3 `lib/geometry/CLAUDE.md` anahtar kesit paragrafı; `pnpm lint` geçsin

## 4. Doğrulama

- [ ] 4.1 `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate:content` geçsin
- [ ] 4.2 `pnpm bake:models` < 3 MB; `pnpm build`; sayfa TR/EN tarayıcıda (model, şema, köken kaydı)
