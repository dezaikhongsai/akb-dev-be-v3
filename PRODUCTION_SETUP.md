# Hướng dẫn cấu hình Production cho Cookie Authentication

## Vấn đề thường gặp

Trên môi trường production, bạn có thể gặp vấn đề không set được `accessToken` và `refreshToken` cookies. Đây là các nguyên nhân chính:

### 1. Environment Variables không đúng

Đảm bảo set các biến môi trường sau trong production:

```bash
# Bắt buộc cho production
NODE_ENV=production
IS_CLOUD=true
FORCE_HTTPS=true

# URLs
FE_URL_PROD=https://your-frontend-domain.com
MONGO_URI_CLOUD=your_production_mongodb_uri
DB_NAME_CLOUD=your_production_database_name
```

### 2. HTTPS Configuration

Nếu server production không chạy HTTPS nhưng `secure: true`, cookies sẽ không được set.

**Giải pháp:**

- Đảm bảo server chạy HTTPS
- Hoặc set `FORCE_HTTPS=false` nếu chưa có HTTPS

### 3. Cross-Origin Issues

Nếu frontend và backend có domain khác nhau:

**Giải pháp:**

- Cấu hình CORS đúng trong `cors.config.ts`
- Đảm bảo `FE_URL_PROD` trỏ đúng domain frontend

### 4. SameSite Policy

**Development:** `sameSite: 'lax'` - cho phép cross-site cookies
**Production:** `sameSite: 'strict'` - chỉ cho phép same-site cookies

## Cấu hình Production

### Backend (.env)

```bash
# Environment
NODE_ENV=production
IS_CLOUD=true
FORCE_HTTPS=true

# Database
MONGO_URI_CLOUD=mongodb+srv://username:password@cluster.mongodb.net/dbname
DB_NAME_CLOUD=your_production_db

# Frontend URL
FE_URL_PROD=https://your-frontend-domain.com

# JWT Secrets
JWT_ACCESS_SECRET=your_secure_access_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret
```

### Frontend (.env)

```bash
VITE_IS_PROD=true
VITE_API_PROD=https://your-backend-domain.com
```

## Debugging

### 1. Kiểm tra Environment Variables

```javascript
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("IS_CLOUD:", process.env.IS_CLOUD);
console.log("FORCE_HTTPS:", process.env.FORCE_HTTPS);
```

### 2. Kiểm tra Cookie Headers

Trong browser DevTools > Network tab, kiểm tra:

- `Set-Cookie` headers trong response
- Cookie attributes: `Secure`, `SameSite`, `HttpOnly`

### 3. Kiểm tra CORS

Đảm bảo CORS cho phép credentials:

```javascript
// backend/src/common/configs/cors.config.ts
export const corsOptions = {
  origin: envKey.fe.url, // Must match frontend domain exactly
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Important!
};
```

## Troubleshooting

### Vấn đề: Cookies không được set

**Nguyên nhân có thể:**

1. `secure: true` nhưng server không HTTPS
2. `sameSite: 'strict'` với cross-origin requests
3. CORS không cho phép credentials

**Giải pháp:**

1. Set `FORCE_HTTPS=false` nếu chưa có HTTPS
2. Kiểm tra domain matching giữa frontend và backend
3. Đảm bảo CORS `credentials: true`

### Vấn đề: Cookies bị clear ngay lập tức

**Nguyên nhân có thể:**

1. Domain mismatch
2. Path mismatch
3. Secure flag mismatch

**Giải pháp:**

1. Đảm bảo domain và path nhất quán
2. Kiểm tra HTTPS/HTTP configuration
3. Debug với browser DevTools

## Testing

### Test Cookie Setting

```bash
# Test login endpoint
curl -X POST https://your-api.com/vi/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# Check cookies
cat cookies.txt
```

### Test Cookie Reading

```bash
# Test protected endpoint
curl -X GET https://your-api.com/vi/auth/refresh-token \
  -b cookies.txt
```
