import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('IS_CLOUD:', process.env.IS_CLOUD);
console.log('FORCE_HTTPS:', process.env.FORCE_HTTPS);
console.log('FE_URL:', process.env.FE_URL);
console.log('FE_URL_PROD:', process.env.FE_URL_PROD);

// Calculate cookie settings
const isCloud = process.env.IS_CLOUD === 'true' || process.env.NODE_ENV === 'production';
const isHttps = process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true';

console.log('\n=== Cookie Configuration ===');
console.log('isCloud:', isCloud);
console.log('isHttps:', isHttps);

const cookieConfig = {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'strict' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
};

console.log('Cookie Config:', JSON.stringify(cookieConfig, null, 2));

console.log('\n=== Recommendations ===');
if (process.env.NODE_ENV === 'production') {
    console.log('✅ Production environment detected');
    if (!process.env.IS_CLOUD) {
        console.log('⚠️  IS_CLOUD not set - should be "true" for production');
    }
    if (!process.env.FORCE_HTTPS) {
        console.log('⚠️  FORCE_HTTPS not set - should be "true" for production');
    }
    if (!process.env.FE_URL_PROD) {
        console.log('⚠️  FE_URL_PROD not set - should be your production frontend URL');
    }
} else {
    console.log('✅ Development environment detected');
}

console.log('\n=== CORS Configuration ===');
console.log('Origin:', process.env.FE_URL || process.env.FE_URL_PROD);
console.log('Credentials:', true); 