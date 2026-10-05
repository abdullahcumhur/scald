-- Scald Coffee — sadakat puanı bakiyesinin negatife düşmesini önleme
-- Bug: apply_loyalty_transaction() trigger'ı (bkz. 0002_admin_and_loyalty.sql)
-- loyalty_points'i hiçbir taban kontrolü yapmadan güncelliyor; admin panelindeki
-- (admin/app/dashboard/loyalty/page.tsx) harcama (redeem) formu da müşterinin
-- güncel bakiyesini kontrol etmeden işlemi kabul ediyor. Bu yüzden bir barista
-- yanlışlıkla müşterinin sahip olduğundan fazla puan harcayabiliyor ve bakiye
-- negatife düşebiliyor.
--
-- Çözüm: profiles.loyalty_points üzerine doğrudan bir CHECK constraint
-- ekliyoruz. apply_loyalty_transaction() zaten
-- `update profiles set loyalty_points = loyalty_points + ...` çalıştırdığından,
-- bu constraint ihlal edildiğinde Postgres normal bir hata fırlatır ve o anki
-- loyalty_transactions insert'i (trigger'ı tetikleyen işlem) transactional
-- olarak tamamen geri alınır — trigger fonksiyonunda ayrıca bir exception
-- fırlatma mantığına ihtiyaç yok.
alter table public.profiles drop constraint if exists profiles_loyalty_points_non_negative;
alter table public.profiles
  add constraint profiles_loyalty_points_non_negative check (loyalty_points >= 0);
