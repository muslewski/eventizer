// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Harmless fallbacks so suites that transitively import the payload config
// chain (auth → OAuth fail-fast guards) can be collected without a real .env
// (e.g. CI). Real values from .env always win; POSTGRES_URL is deliberately
// NOT defaulted — DB-dependent suites skip on it instead.
process.env.GOOGLE_PROVIDER_CLIENT_ID ??= 'test-google-client-id'
process.env.GOOGLE_PROVIDER_CLIENT_SECRET ??= 'test-google-client-secret'
process.env.FACEBOOK_CLIENT_ID ??= 'test-facebook-client-id'
process.env.FACEBOOK_CLIENT_SECRET ??= 'test-facebook-client-secret'
process.env.RESEND_API_KEY ??= 're_test_dummy'
process.env.PAYLOAD_SECRET ??= 'test-payload-secret'
process.env.STRIPE_SECRET_KEY ??= 'sk_test_dummy'
process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET ??= 'whsec_test_dummy'
