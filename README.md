# 🎓 YoklamaPilot — Ders & Devamsızlık Takip Uygulaması

Asaf için özel olarak yapılandırılmış, 2026-2027 Güz yarıyılı (5. Yarıyıl) derslerine tam entegre, yüzdelik yoklama ve kalan devamsızlık hakkı hesaplama aracı.

---

## ⚡ Hızlı Başlangıç

1. Klasördeki **`start.bat`** dosyasına çift tıklayın veya **`index.html`** dosyasını doğrudan tarayıcınızda (Chrome, Edge, Brave, Safari vb.) açın.
2. Kurulum, internet sunucusu veya kütüphane gerektirmez.

---

## 🎯 Özellikler

- **1. Haftadan 14. Haftaya Kadar Takip:**
  - İstediğiniz haftaya (H1, H2, H3, H4 vb.) tıklayarak geçmiş ve gelecek haftaların yoklamasını düzenleyebilirsiniz.
  - Şu an **4. Hafta** aktif olarak işaretlenmiştir.
- **Tek Tıkla Yoklama:**
  - `Girdim` (Yeşil)
  - `Gitmedim` (Kırmızı)
  - `İptal / Tatil` (Sarı — devamsızlık oranını düşürmez, paydadan düşer)
- **Toplu İşlemler:**
  - **"Bu Haftanın Tümüne Girdim":** Tek tıkla o haftadaki tüm 9 ders bloğunu katıldı olarak işaretler. (Böylece 1., 2., 3. haftaları 3 saniyede doldurup sadece gitmediğiniz dersleri tek tıkla değiştirebilirsiniz).
- **Matematiksel Baraj ve Kalan Hak Hesabı:**
  - **Teori Dersleri:** %70 devam barajı $\rightarrow$ 14 haftada **en fazla 4 hafta** devamsızlık hakkı.
  - **Laboratuvar Dersleri:** %80 devam barajı $\rightarrow$ 14 haftada **en fazla 2 hafta** devamsızlık hakkı.
  - Anlık uyarı sistemi: *Güvenli*, *Kritik Sınırda (1 Hak)*, *Son Hak!*, *Devamsızlıktan Kaldı (DZ)*.
- **14 Haftalık İnteraktif Matris:**
  - Sayfanın altındaki tabloda tüm 14 haftayı bir arada görebilir, herhangi bir hücreye tıklayarak durumunu anında değiştirebilirsiniz.
- **Veri Güvenliği & Kalıcılık:**
  - Veriler tarayıcınızın `localStorage` alanına otomatik kaydedilir, sayfa kapansa da kaybolmaz.
  - Üst bardaki **"Yedekle"** butonuyla tüm yoklama durumunu tek tıkla `.json` dosyası olarak indirebilir, **"Yükle"** ile geri yükleyebilirsiniz.

---

## 📋 Ön Tanımlı Dersler

| Gün | Saat | Ders Adı | Tür | Baraj | Maks. Devamsızlık | Sınıf |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Pazartesi** | 08:30 - 11:10 | Signal Processing | Teori | %70 | 4 Hafta | K Blok: K-B07 |
| **Pazartesi** | 11:15 - 13:55 | Algorithm Analysis | Teori | %70 | 4 Hafta | K Blok: K-Z06 |
| **Salı** | 08:30 - 11:10 | Veri Madenciliği | Teori | %70 | 4 Hafta | B Blok: Yazılım Lab. A |
| **Salı** | 11:15 - 13:55 | Operating Systems | Teori | %70 | 4 Hafta | A Blok: D-701 |
| **Çarşamba** | 12:10 - 13:55 | Yönetim Bilişim Sistemleri | Teori | %70 | 4 Hafta | A Blok: D-701 |
| **Perşembe** | 13:05 - 14:50 | Bilgisayar Org. ve Tasarımı Lab. | Lab | %80 | 2 Hafta | B Blok: Yazılım Lab. A |
| **Perşembe** | 14:55 - 16:40 | Operating Systems (Lab) | Lab | %80 | 2 Hafta | B Blok: Yazılım Lab. A |
| **Cuma** | 14:00 - 15:45 | Veri Tabanı Yönetim Sistemleri | Teori | %70 | 4 Hafta | K Blok: K-B07 |
| **Cuma** | 15:50 - 17:35 | Veri Tabanı Yön. Sis. (Lab) | Lab | %80 | 2 Hafta | K Blok: K-B07 |
