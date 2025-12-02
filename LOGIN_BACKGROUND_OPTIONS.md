# Login Ekranı Arka Plan Animasyon Seçenekleri

Bu dosya, login ekranı için farklı arka plan animasyon seçeneklerini içerir. `styles.css` dosyasındaki `#login-screen` bölümünü bu seçeneklerden biriyle değiştirebilirsiniz.

## Mevcut: Animated Gradient + Mesh Gradient (Aktif)
- Renkli gradient'ların yavaşça hareket etmesi
- Mesh gradient efektleri ile derinlik
- Modern ve profesyonel görünüm

## Seçenek 1: Sadece Gradient Animasyonu (Daha Basit)

```css
#login-screen {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(
        135deg,
        #667eea 0%,
        #764ba2 25%,
        #f093fb 50%,
        #4facfe 75%,
        #00f2fe 100%
    );
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
```

## Seçenek 2: Parçacık Efekti (Particle Animation)

```css
#login-screen {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #0a0a0f;
}

#login-screen::before,
#login-screen::after {
    content: '';
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    filter: blur(80px);
    animation: float 20s ease-in-out infinite;
}

#login-screen::before {
    background: rgba(102, 126, 234, 0.4);
    top: 20%;
    left: 20%;
    animation-delay: 0s;
}

#login-screen::after {
    background: rgba(244, 91, 105, 0.4);
    bottom: 20%;
    right: 20%;
    animation-delay: 10s;
}

@keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(50px, -50px) scale(1.2); }
    66% { transform: translate(-50px, 50px) scale(0.8); }
}
```

## Seçenek 3: Wave/Dalga Animasyonu

```css
#login-screen {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

#login-screen::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='0.1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") no-repeat bottom;
    background-size: cover;
    animation: wave 10s ease-in-out infinite;
}

@keyframes wave {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(2deg); }
}
```

## Seçenek 4: Neon Glow Efekti

```css
#login-screen {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #0a0a0f;
}

#login-screen::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    animation: pulse 4s ease-in-out infinite;
}

#login-screen::after {
    content: '';
    position: absolute;
    top: 30%;
    right: 20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(244, 91, 105, 0.3) 0%, transparent 70%);
    animation: pulse 4s ease-in-out infinite;
    animation-delay: 2s;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 0.8; }
}
```

## Seçenek 5: Geometrik Şekiller

```css
#login-screen {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #0a0a0f;
}

#login-screen::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: 
        linear-gradient(45deg, transparent 30%, rgba(102, 126, 234, 0.1) 50%, transparent 70%),
        linear-gradient(-45deg, transparent 30%, rgba(244, 91, 105, 0.1) 50%, transparent 70%);
    background-size: 100px 100px;
    animation: rotate 20s linear infinite;
}

@keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

## Seçenek 6: Dark Mode Minimalist (Sade)

```css
#login-screen {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: radial-gradient(circle at top, #1a1a2e 0%, #0f0f1e 50%, #0a0a0f 100%);
}

#login-screen::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(244, 91, 105, 0.1) 0%, transparent 50%);
    animation: subtleMove 30s ease-in-out infinite;
}

@keyframes subtleMove {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(20px, -20px); }
}
```

## Kullanım

1. `styles.css` dosyasını açın
2. `#login-screen` ile başlayan bölümü bulun
3. Yukarıdaki seçeneklerden birini seçin
4. Mevcut `#login-screen` CSS'ini seçtiğiniz seçenekle değiştirin
5. İsterseniz renkleri ve animasyon hızlarını özelleştirebilirsiniz

## Özelleştirme İpuçları

- **Renkler**: `rgba(102, 126, 234, 0.3)` gibi değerleri değiştirerek renkleri özelleştirebilirsiniz
- **Hız**: `animation: gradientShift 15s` değerindeki `15s` süresini değiştirerek animasyon hızını ayarlayabilirsiniz
- **Opaklık**: `opacity: 0.3` değerini değiştirerek efektin yoğunluğunu ayarlayabilirsiniz
- **Kombinasyon**: İki farklı seçeneği birleştirerek daha karmaşık efektler oluşturabilirsiniz

