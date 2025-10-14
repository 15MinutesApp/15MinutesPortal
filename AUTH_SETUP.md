# 15 Minutes Portal - Authentication Setup

## 🚀 Backend'e Bağlanma Rehberi

Login sistemi başarıyla backend GraphQL API'ye entegre edildi! İşte nasıl kullanacağınız:

## 📋 Kurulum Adımları

### 1. Environment Variables

`.env.local` dosyası oluşturun (root dizinde):

```bash
# .env.local dosyası oluşturun
cp .env.example .env.local
```

Dosya içeriği:

```env
NEXT_PUBLIC_GRAPHQL_API_URL=https://api.15minutes.app/graphql
```

### 2. Paketleri Yükleyin

```bash
npm install
# veya
pnpm install
```

### 3. Uygulamayı Çalıştırın

```bash
npm run dev
# veya
pnpm dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## 🔐 Login Akışı

### İki Aşamalı Giriş Sistemi:

1. **Adım 1: Email & Şifre**

   - Kullanıcı email ve şifresini girer
   - Backend `Admin_startPasswordLogin` mutation'ını çağırır
   - Başarılı olursa `challengeToken` döner ve 2. adıma geçilir

2. **Adım 2: TOTP veya Backup Code Doğrulama**
   - **TOTP Seçeneği**: Google Authenticator'dan 6 haneli TOTP kodu
     - Backend `Admin_verifyTotp` mutation'ını çağırır
   - **Backup Code Seçeneği**: One-time backup kodu (8 karakter)
     - Backend `Admin_verifyBackupCode` mutation'ını çağırır
   - Başarılı olursa `accessToken` ve `refreshToken` döner
   - Tokenlar localStorage'a kaydedilir ve kullanıcı dashboard'a yönlendirilir

## 🛡️ Güvenlik Özellikleri

- ✅ **İki Aşamalı Doğrulama**: Email/Şifre + TOTP
- ✅ **Token Yönetimi**: Access & Refresh Token sistemi
- ✅ **Protected Routes**: Login olmadan erişilemeyen sayfalar
- ✅ **Otomatik Yönlendirme**: Login olmayan kullanıcılar otomatik login sayfasına yönlendirilir
- ✅ **Error Handling**: Kullanıcı dostu hata mesajları
- ✅ **Loading States**: İşlem sırasında butonlar disabled olur

## 📁 Oluşturulan Dosyalar

### 1. API & Auth Services

- `lib/api/graphql.ts` - GraphQL client
- `lib/auth/authService.ts` - Login & TOTP fonksiyonları

### 2. Context & State Management

- `contexts/AuthContext.tsx` - Global auth state

### 3. Middleware

- `middleware.ts` - Route protection (şu an basic)

### 4. Updated Pages

- `app/login/page.tsx` - Backend entegrasyonu + backup code eklendi
- `app/page.tsx` - Route protection eklendi
- `app/users/page.tsx` - Route protection eklendi
- `app/interests/page.tsx` - Route protection eklendi
- `app/reports/page.tsx` - Route protection eklendi
- `app/layout.tsx` - AuthProvider & Toaster eklendi
- `app/test-api/page.tsx` - API test sayfası eklendi

### 5. Updated Components

- `components/nav-user.tsx` - Logout fonksiyonu + admin email gösterimi

## 🔧 Kullanım Örnekleri

### Login Yapmak

```typescript
import { startPasswordLogin, verifyTotp } from "@/lib/auth/authService";
import { useAuth } from "@/contexts/AuthContext";

// Component içinde
const { login } = useAuth();

// Adım 1: Email & Password
const challengeToken = await startPasswordLogin(email, password);

// Adım 2: TOTP Verification
const { accessToken, refreshToken } = await verifyTotp(
  challengeToken,
  totpCode
);

// Token'ları kaydet
login(accessToken, refreshToken);
```

### Auth State Kullanımı

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { isAuthenticated, accessToken, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      Welcome! <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### API Çağrısı Yapmak (Authenticated)

```typescript
import { graphqlRequest } from "@/lib/api/graphql";
import { useAuth } from "@/contexts/AuthContext";

const { accessToken } = useAuth();

const query = `
  query GetUsers($page: Int!, $limit: Int!) {
    Admin_users(page: $page, limit: $limit) {
      id
      email
      createdAt
    }
  }
`;

const data = await graphqlRequest(query, { page: 1, limit: 10 }, accessToken);
```

## 🧪 Test Etme

### API Test Sayfası

`http://localhost:3000/test-api` adresine giderek:

- Backend bağlantısını test edebilirsiniz
- Admin users API'sini çağırabilirsiniz
- Debug bilgilerini görebilirsiniz

### Test Adımları

1. Uygulamayı çalıştırın: `npm run dev`
2. `http://localhost:3000` adresine gidin
3. Login sayfasına yönlendirileceksiniz
4. Admin bilgilerinizle giriş yapın
5. Dashboard'a erişim sağlayın
6. `/test-api` sayfasından API'yi test edin

## 🎯 Sonraki Adımlar (Opsiyonel İyileştirmeler)

1. **Refresh Token Mekanizması**: Access token expire olduğunda otomatik refresh
2. **Remember Me**: Kullanıcıyı hatırla özelliği
3. **Logout Everywhere**: Tüm cihazlardan çıkış
4. **Session Management**: Aktif oturumları görüntüleme
5. **Better Middleware**: Server-side route protection (httpOnly cookies ile)
6. **Admin User Management**: Kullanıcı ekleme/düzenleme/silme
7. **Real-time Notifications**: WebSocket ile gerçek zamanlı bildirimler

## 🐛 Troubleshooting

### CORS Hatası

Backend'inizde CORS ayarlarını kontrol edin:

```
Access-Control-Allow-Origin: http://localhost:3000
```

### Token Expire Hatası

Access token 15 dakika sonra expire olur. Refresh token mekanizması eklenebilir.

### Login Sonrası Redirect Çalışmıyor

Browser console'da hata var mı kontrol edin. AuthProvider'ın layout.tsx'e eklendiğinden emin olun.

## 📞 İletişim

Sorularınız için: [Proje Sahibi]

---

**Not**: Production'a almadan önce:

1. Environment variables'ı production değerleriyle güncelleyin
2. Error logging ekleyin (Sentry, LogRocket, vb.)
3. Analytics ekleyin
4. Refresh token mekanizması ekleyin
