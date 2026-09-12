## Purpose

Bir sistemin varyantlarının ayrı dış biçim taşıyabilmesini tanımlar. Bir aile
altında toplanan varyantlar her zaman aynı gövdeyi paylaşmaz: aynı programın iki
ürünü farklı kanat düzeni, farklı burun ve ayrılabilir bir itici taşıyabilir.
Kapsam: biçim kaydının hangi anahtarla çözüldüğü, varyant tanımsızken davranış ve
sisteme düşüşün okunur kalması.

## Requirements

### Requirement: Biçim kaydı varyant düzeyinde çözülür

Bir varyantın dış biçimi, o varyantın kendi tanımından çözülmelidir (MUST). Aynı
sistemin iki varyantı, ikisi için ayrı tanım yazıldığında ayrı biçimlerle
çizilmelidir.

Bir varyant için tanım yoksa sistem düzeyindeki tanıma düşülebilir; düşüş SESSİZ
OLMAMALIDIR (MUST NOT). Kayıt, biçimin hangi anahtarla bulunduğunu söylemelidir.

#### Scenario: İki varyant iki biçim

- **WHEN** bir sistemin iki varyantı için ayrı biçim tanımı yazılır
- **THEN** her varyant kendi tanımıyla çizilir ve biri ötekinin oranlarını
  kullanmaz

#### Scenario: Varyantın kendi tanımı yok

- **WHEN** bir varyant için tanım yazılmamış ama sistem düzeyinde tanım varsa
- **THEN** sistem tanımı kullanılır ve bunun bir düşüş olduğu kayda geçer

#### Scenario: Hiçbir tanım yok

- **WHEN** ne varyantın ne sistemin biçim tanımı varsa
- **THEN** model üretilmez ve varsayılan bir geometriye düşülmez

### Requirement: Varyant biçimleri aynı ölçü seçimini kullanır

Bir varyantın modeli, o varyantın kendi ölçü kayıtlarından ölçeklenmelidir (MUST).
İki varyant aynı biçim tanımını paylaşsa bile ölçekleri kendi uzunluk ve çap
değerlerinden gelmelidir.

#### Scenario: Ortak tanım, ayrı ölçü

- **WHEN** iki varyant aynı biçim tanımını paylaşıyor ama uzunlukları farklı
- **THEN** iki model farklı boyda çizilir ve oranlar ikisinde de aynı kalır

#### Scenario: Ölçüsü olmayan varyant

- **WHEN** bir varyant modelin istediği ölçü alanlarından birini taşımıyor
- **THEN** o varyant için model üretilmez ve eksiklik sayfada adıyla yazılır

### Requirement: Üç boyutlu model ile iki boyutlu şema aynı varyant tanımını okur

Bir varyantın ortografik izdüşümü ile üç boyutlu modeli aynı biçim tanımından
türetilmelidir (MUST). İki katman farklı varyant tanımlarına bakmamalıdır
(MUST NOT).

#### Scenario: Varyant tanımı değişir

- **WHEN** bir varyantın oran tablosunda bir değer güncellenir
- **THEN** o varyantın hem şeması hem modeli değişir, öteki varyant etkilenmez
