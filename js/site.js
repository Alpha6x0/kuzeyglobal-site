/* Kuzey Global - arayuz davranislari. Bagimlilik yok, saf JS.
   Ceviri: her ogenin data-tr / data-en ozniteligi tutulur, dil degisince
   icerik oradan yazilir. Form yer tutuculari icin data-tr-ph / data-en-ph. */

(function () {
  'use strict';

  // ======================= DIL =======================

  var ANAHTAR = 'kuzey-global-dil';
  var dilDugmeleri = document.querySelectorAll('[data-dil]');

  function dilUygula(dil) {
    document.documentElement.lang = dil;

    document.querySelectorAll('[data-' + dil + ']').forEach(function (oge) {
      var deger = oge.getAttribute('data-' + dil);
      if (deger !== null) oge.innerHTML = deger;
    });

    document.querySelectorAll('[data-' + dil + '-ph]').forEach(function (oge) {
      oge.setAttribute('placeholder', oge.getAttribute('data-' + dil + '-ph'));
    });

    dilDugmeleri.forEach(function (dugme) {
      dugme.classList.toggle('etkin', dugme.getAttribute('data-dil') === dil);
    });

    // arkadaki kayan gosterge
    var kutu = document.querySelector('.dil');
    if (kutu) kutu.classList.toggle('en-etkin', dil === 'en');

    try { localStorage.setItem(ANAHTAR, dil); } catch (hata) { /* gizli sekme */ }
  }

  dilDugmeleri.forEach(function (dugme) {
    dugme.addEventListener('click', function () {
      dilUygula(dugme.getAttribute('data-dil'));
    });
  });

  // sayfa acilisinda: once kayitli tercih, yoksa tarayici dili
  var baslangicDili = 'tr';
  try {
    var kayitli = localStorage.getItem(ANAHTAR);
    if (kayitli === 'tr' || kayitli === 'en') baslangicDili = kayitli;
    else if (navigator.language && navigator.language.slice(0, 2) !== 'tr') baslangicDili = 'en';
  } catch (hata) { /* gizli sekme */ }

  if (baslangicDili !== 'tr') dilUygula(baslangicDili);
  else dilUygula('tr');

  // ======================= MENU =======================

  var menu = document.getElementById('menu');
  var menuDugme = document.getElementById('menuDugme');

  if (menu && menuDugme) {
    menuDugme.addEventListener('click', function () {
      var acik = menu.classList.toggle('acik');
      menuDugme.classList.toggle('acik', acik);
      menuDugme.setAttribute('aria-expanded', String(acik));
    });

    menu.querySelectorAll('a').forEach(function (bag) {
      bag.addEventListener('click', function () {
        menu.classList.remove('acik');
        menuDugme.classList.remove('acik');
        menuDugme.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ======================= KAYDIRMA =======================

  var baslik = document.getElementById('baslik');
  var yukariDugme = document.getElementById('yukariDugme');
  var bolumler = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
  var menuBaglari = Array.prototype.slice.call(document.querySelectorAll('.menu a[href^="#"]'));

  function menuIsaretle() {
    var esik = window.scrollY + 150;
    var etkinKimlik = '';

    bolumler.forEach(function (bolum) {
      if (bolum.offsetTop <= esik) etkinKimlik = bolum.id;
    });

    menuBaglari.forEach(function (bag) {
      bag.classList.toggle('etkin', bag.getAttribute('href') === '#' + etkinKimlik);
    });
  }

  function kaydirmaIsle() {
    var y = window.scrollY;
    if (baslik) baslik.classList.toggle('kayik', y > 20);
    if (yukariDugme) yukariDugme.classList.toggle('gorunur', y > 600);
    menuIsaretle();
  }

  window.addEventListener('scroll', kaydirmaIsle, { passive: true });

  if (yukariDugme) {
    yukariDugme.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ======================= BELIRME =======================

  var belirenler = document.querySelectorAll('.belir');
  var gozcu = null;

  function belirt(oge, gecikme) {
    oge.classList.add('gorundu');
    if (gozcu) gozcu.unobserve(oge);
  }

  // Menuden bir bolume atlandiginda, atlanan noktanin USTUNDE kalan ogeler
  // hicbir zaman ekrana "girmedigi" icin IntersectionObserver onlar icin
  // tetiklenmez ve opacity 0'da donup kalirlar. Bu tarama onlari yakalar:
  // ekranin ustunde kalmis, animasyonu artik anlamsiz olan her seyi acar.
  function gecmisleriAc() {
    document.querySelectorAll('.belir:not(.gorundu)').forEach(function (oge) {
      if (oge.getBoundingClientRect().bottom < 0) belirt(oge);
    });
  }

  if ('IntersectionObserver' in window) {
    gozcu = new IntersectionObserver(function (girisler) {
      girisler.forEach(function (giris, sira) {
        if (!giris.isIntersecting) return;
        var oge = giris.target;
        // Kademeyi sinirla: 25 kartlik bir izgarada sira*70 ms toplam 1,75 sn
        // sürüyordu; ilk sekiz ogeden sonrasi ayni anda acilir.
        var gecikme = Math.min(sira, 8) * 60;
        setTimeout(function () { oge.classList.add('gorundu'); }, gecikme);
        gozcu.unobserve(oge);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    belirenler.forEach(function (oge) { gozcu.observe(oge); });

    window.addEventListener('scroll', gecmisleriAc, { passive: true });
    window.addEventListener('hashchange', function () { setTimeout(gecmisleriAc, 120); });
    setTimeout(gecmisleriAc, 300);
  } else {
    belirenler.forEach(function (oge) { oge.classList.add('gorundu'); });
  }

  // ======================= RAKAM SAYACI =======================

  var rakamlar = document.querySelectorAll('[data-sayi]');

  function sayacCalistir(oge) {
    var hedef = parseInt(oge.getAttribute('data-sayi'), 10) || 0;
    var sure = 1400;
    var baslangic = null;

    // sayinin yanindaki isareti (% veya +) ve konumunu koru
    var isaretOgesi = oge.querySelector('span');
    var isaret = isaretOgesi ? isaretOgesi.outerHTML : '';
    var isaretOnde = Boolean(isaretOgesi) && oge.firstChild === isaretOgesi;

    function adim(zaman) {
      if (baslangic === null) baslangic = zaman;
      var oran = Math.min((zaman - baslangic) / sure, 1);
      var yumusak = 1 - Math.pow(1 - oran, 3);
      var deger = Math.round(hedef * yumusak);
      oge.innerHTML = isaretOnde ? isaret + deger : deger + isaret;
      if (oran < 1) requestAnimationFrame(adim);
    }

    requestAnimationFrame(adim);
  }

  if ('IntersectionObserver' in window && rakamlar.length) {
    var sayacGozcusu = new IntersectionObserver(function (girisler) {
      girisler.forEach(function (giris) {
        if (!giris.isIntersecting) return;
        sayacCalistir(giris.target);
        sayacGozcusu.unobserve(giris.target);
      });
    }, { threshold: 0.5 });

    rakamlar.forEach(function (oge) { sayacGozcusu.observe(oge); });
  }

  // ======================= TEKLIF FORMU =======================

  // Teklif taleplerinin gidecegi adres. Tek yerde tutulur.
  var POSTA = 'muhasebe@kuzeyglobalmuhendislik.com';

  var form = document.getElementById('teklifFormu');
  var formSonuc = document.getElementById('formSonuc');

  var METIN = {
    tr: {
      eksik: 'Lütfen şu alanları kontrol edin: ',
      alanAd: 'ad soyad', alanTel: 'geçerli telefon', alanEposta: 'geçerli e-posta', alanMesaj: 'proje detayı',
      gonderiliyor: 'Gönderiliyor...',
      hata: 'Gönderilemedi. Lütfen doğrudan yazın: muhasebe@kuzeyglobalmuhendislik.com',
      tamam: function (isim) {
        return 'Teşekkürler ' + isim + '. Talebiniz iletildi, en kısa sürede dönüş yapacağız.';
      }
    },
    en: {
      eksik: 'Please check the following fields: ',
      alanAd: 'full name', alanTel: 'valid phone', alanEposta: 'valid e-mail', alanMesaj: 'project details',
      gonderiliyor: 'Sending...',
      hata: 'Could not send. Please write directly: muhasebe@kuzeyglobalmuhendislik.com',
      tamam: function (isim) {
        return 'Thank you, ' + isim + '. Your request has been sent; we will get back to you shortly.';
      }
    }
  };

  function suankiDil() {
    return document.documentElement.lang === 'en' ? 'en' : 'tr';
  }

  function epostaGecerli(deger) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(deger); }
  function telefonGecerli(deger) { return deger.replace(/\D/g, '').length >= 10; }

  if (form) {
    form.addEventListener('submit', function (olay) {
      olay.preventDefault();

      var s = METIN[suankiDil()];
      var eksikler = [];
      var ad = form.ad.value.trim();

      if (ad.length < 3) eksikler.push(s.alanAd);
      if (!telefonGecerli(form.telefon.value.trim())) eksikler.push(s.alanTel);
      if (!epostaGecerli(form.eposta.value.trim())) eksikler.push(s.alanEposta);
      if (form.mesaj.value.trim().length < 10) eksikler.push(s.alanMesaj);

      formSonuc.classList.add('gorunur');

      if (eksikler.length) {
        formSonuc.textContent = s.eksik + eksikler.join(', ') + '.';
        return;
      }

      // FormSubmit'in AJAX ucuna gonderilir: kullanici sayfada kalir, sayfa
      // yenilenmez. JS calismazsa formun kendi action'i devreye girer.
      var gonder = form.querySelector('button[type="submit"]');
      if (gonder) gonder.disabled = true;
      formSonuc.textContent = s.gonderiliyor;

      fetch('https://formsubmit.co/ajax/' + POSTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          'Ad Soyad': ad,
          'Firma': form.firma.value.trim(),
          'Telefon': form.telefon.value.trim(),
          'E-posta': form.eposta.value.trim(),
          'Hizmet konusu': form.konu.value,
          'Proje detayı': form.mesaj.value.trim(),
          '_subject': 'Kuzey Global - yeni teklif talebi',
          '_captcha': 'false',
          '_template': 'table',
          '_autoresponse': suankiDil() === 'en'
            ? 'Your request has reached Kuzey Global Elektromekanik Muhendislik. We will get back to you shortly. Urgent: +90 551 381 52 52'
            : "Talebiniz Kuzey Global Elektromekanik Mühendislik'e ulaştı. En kısa sürede dönüş yapacağız. Acil durumlar için: 0551 381 52 52"
        })
      }).then(function (y) {
        if (!y.ok) throw new Error('HTTP ' + y.status);
        return y.json();
      }).then(function (veri) {
        // DIKKAT: FormSubmit basarisiz durumda da HTTP 200 doner; hatayi
        // yalnizca govdedeki "success" alani soyler. Yalniz y.ok'a bakilirsa
        // (form aktif degilse, gunluk sinir dolduysa) kullaniciya "talebiniz
        // iletildi" yazilir ama hicbir e-posta gitmez. Bu yasandi.
        if (veri && String(veri.success) === 'false') {
          throw new Error(veri.message || 'FormSubmit reddetti');
        }
        formSonuc.textContent = s.tamam(ad.split(' ')[0]);
        form.reset();
      }).catch(function () {
        // Aglanti koparsa talep kaybolmasin: kullaniciya dogrudan iletisim yolu ver.
        formSonuc.textContent = s.hata;
      }).then(function () {
        if (gonder) gonder.disabled = false;
      });
    });
  }

  // ======================= IS LISTESI SUZGECI =======================

  var suzgecDugmeleri = document.querySelectorAll('[data-suzgec]');
  var isler = document.querySelectorAll('.is[data-il]');

  if (suzgecDugmeleri.length && isler.length) {
    suzgecDugmeleri.forEach(function (dugme) {
      dugme.addEventListener('click', function () {
        var secim = dugme.getAttribute('data-suzgec');

        suzgecDugmeleri.forEach(function (d) {
          d.classList.toggle('etkin', d === dugme);
        });

        isler.forEach(function (is) {
          is.hidden = secim !== 'hepsi' && is.getAttribute('data-il') !== secim;
        });
      });
    });
  }

  // ======================= YIL =======================

  var yil = document.getElementById('yil');
  if (yil) yil.textContent = String(new Date().getFullYear());

  kaydirmaIsle();
})();
