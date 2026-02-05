import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router as healthRouter } from './routes/health.js';
import { router as mathRouter } from './routes/math.js';
import { router as dbRouter } from './routes/db.js';
import { router as cryptoRouter } from './routes/crypto.js';
import { router as authRouter } from './routes/auth/index.js';
import { router as protectedRouter } from './routes/protected.js';
import { router as walletRouter } from './routes/wallet.js';
import { router as blockchainRouter } from './routes/blockchain.js';
import { router as portfolioRouter } from './routes/portfolio.js';
import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from './lib/rateLimitStore.js';
import { router as issuersRouter } from './routes/issuers.js';
import { router as auctionsRouter } from './routes/auctions.js';
import { router as adminControlsRouter } from './routes/admin-controls.js';
import { router as bidsRouter } from './routes/bids.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { router as uploadsRouter, ensureUploadsDir } from './routes/uploads.js';
import { router as servLedgerRouter } from './routes/serv-ledger.js';
import { router as transactionsRouter } from './routes/transactions.js';
import { router as lpSnapshotRouter } from './routes/lp-snapshot.js';
import { router as accountRouter } from './routes/account.js';
import { router as adminAuditRouter } from './routes/admin-audit.js';
import { router as tradingRouter } from './routes/trading.js';
import { router as adminTickersRouter } from './routes/admin-tickers.js';
import { router as adminTagsRouter } from './routes/admin-tags.js';
import { router as adminReconcileRouter } from './routes/admin-reconcile.js';
import lpSettingsRouter from './routes/lp-settings.js';
import { router as ownershipRouter } from './routes/ownership.js';
import { router as combinedHistoryRouter } from './routes/combined-history.js';
import { router as longTermRouter } from './routes/long-term.js';
import { router as shortTermRouter } from './routes/short-term.js';
import { router as debugRouter } from './routes/debug.js';
import { router as proferRouter } from './routes/profer.js';
import { router as newsRouter } from './routes/news.js';
import { router as indexsRouter } from './routes/indexs.js';
import { router as indexSnapshotsRouter } from './routes/index-snapshots.js';
import { router as tradingBotRouter } from './routes/trading-bot.js';
import { router as investorInquiryRouter } from './routes/investor-inquiry.js';
import { router as waitlistRouter } from './routes/waitlist.js';
import { presenceRouter } from './lib/presenceManager.js';
import { scheduleLpSnapshots } from './lib/lpSnapshots.js';
import { ensureServerWallet } from './lib/ensure-server-wallet.js';
import { processNextQueueItem } from './lib/trading.js';
import { startIndexSnapshotRecording, startShortIndexSnapshotRecording } from './lib/indexSnapshot.js';
// TODO: FIFO.js was deleted - need to restore or implement startAutoRecalcListener
// import { startAutoRecalcListener } from '../FIFO.js';

// .env loaded via side-effect import above

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer the new fuel-your-dreamers build; fall back to the legacy Pauv SPA if it is missing
const dreamersBuildPath = path.join(__dirname, '..', '..', 'fuel-your-dreamers-main', 'dist');
const legacyBuildPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
const frontendBuildPath = fs.existsSync(dreamersBuildPath)
  ? dreamersBuildPath
  : (fs.existsSync(legacyBuildPath) ? legacyBuildPath : dreamersBuildPath);
const frontendIndexPath = path.join(frontendBuildPath, 'index.html');

// Respect reverse proxies/load balancers for correct IP and secure cookies
if ((process.env.TRUST_PROXY || 'false').toLowerCase() === 'true') {
  app.set('trust proxy', 1);
}

// Basic security and CORS
// Explicit CSP: previously relied on helmet default (production) which blocked Google Fonts & possibly API fetches.
// We define a tailored policy allowing only what we need while unblocking required resources.
const connectSrc = ["'self'"];
if (process.env.CONNECT_SRC_EXTRA) {
  connectSrc.push(...process.env.CONNECT_SRC_EXTRA.split(',').map(s => s.trim()).filter(Boolean));
}
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Disable CSP entirely in development for DX; enforce in production.
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    useDefaults: true, // Starts with helmet's sane defaults (default-src 'self', etc.)
    directives: {
      "default-src": ["'self'"],
      // No inline scripts currently; if needed, prefer nonces over 'unsafe-inline'.
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://static.cloudflareinsights.com", "https://www.googletagmanager.com", "https://www.clarity.ms", "https://c.bing.com"],
      "script-src-elem": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://static.cloudflareinsights.com", "https://www.googletagmanager.com", "https://www.clarity.ms", "https://c.bing.com"],
      // Allow Google Fonts stylesheet; inline styles from frameworks (Tailwind runtime) may inject <style> tags, so allow 'unsafe-inline'.
      // If you pre-build all styles and remove any runtime style injections you can drop 'unsafe-inline'.
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https:"],
      "style-src-elem": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https:"],
      // Font files served from fonts.gstatic.com. Allow data: for any embedded fonts.
      "font-src": ["'self'", "https://fonts.gstatic.com", "https:", "data:"],
      // API / fetch / websockets (add wss: if using real-time sockets). Additional domains via CONNECT_SRC_EXTRA env var.
      "connect-src": [...connectSrc, "https://cloudflareinsights.com", "https:", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://analytics.google.com", "https://www.clarity.ms", "https://c.bing.com"],
      "frame-src": ["'self'", "https://www.googletagmanager.com"],
      // Media (video/audio) - allow blobs for players
      "media-src": ["'self'", "https:", "data:", "blob:"],
      // Workers - often needed for HLS players
      "worker-src": ["'self'", "blob:"],
      // Images (allow data: for small inlined icons / base64 placeholders)
      "img-src": ["'self'", 'data:', "https:"],
      // Allow iframes (e.g. video players)
      "frame-src": ["'self'", "https://iframe.mediadelivery.net"],
      // Disallow everything else by default
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'none'"],
      // Prevent form submissions to other origins
      "form-action": ["'self'"],
      // Optional: uncomment to force HTTPS for all subresources
      // "upgrade-insecure-requests": []
    }
  } : false,
}));
app.use((req, res, next) => {
  // Additional security headers aligned with security.txt
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', "geolocation=(), camera=(), microphone=()");
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Redirect pauv.com to www.pauv.com
app.use((req, res, next) => {
  if (req.hostname === 'pauv.com') {
    return res.redirect(301, 'https://www.pauv.com' + req.originalUrl);
  }
  next();
});

// Serve uploaded files with permissive access BEFORE global CORS so image tags aren't blocked in the browser
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  ensureUploadsDir(uploadsDir);
  app.use('/uploads', express.static(uploadsDir, {
    index: false,
    redirect: false,
    setHeaders: (res) => {
      // Allow embedding from any origin; safe for static assets
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
  // TEMP: also serve legacy files that were placed under backend/uploads (migration aid)
  const legacyDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(legacyDir) && legacyDir !== uploadsDir) {
    app.use('/uploads', express.static(legacyDir, {
      index: false,
      redirect: false,
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7d for legacy
        res.setHeader('X-Legacy-Uploads','true');
      }
    }));
  }
  // Debug middleware (after static mounts) to log resolution & 404 diagnostics when enabled
  if (process.env.DEBUG_UPLOADS === '1') {
    app.use('/uploads', (req, res, next) => {
      const start = Date.now();
      const originalPath = req.path;
      res.on('finish', () => {
        if (req.method === 'GET') {
          const took = Date.now() - start;
          if (res.statusCode === 404) {
            try {
              const rootFile = path.join(uploadsDir, originalPath.replace(/^\\+|^\/+/,'').replace(/\.\.+/g,''));
              const legacyFile = path.join(legacyDir, originalPath.replace(/^\\+|^\/+/,'').replace(/\.\.+/g,''));
              console.log(`[uploads:404] ${originalPath} (${took}ms) rootExists=${fs.existsSync(rootFile)} legacyExists=${fs.existsSync(legacyFile)}`);
              if (fs.existsSync(rootFile)) console.log('[uploads:404] NOTE: root file exists but not served (cache or path issue) ->', rootFile);
              if (fs.existsSync(legacyFile)) console.log('[uploads:404] NOTE: legacy file exists ->', legacyFile);
            } catch (e) {
              console.log('[uploads:debug:error]', e.message);
            }
          } else {
            console.log(`[uploads:get] ${res.statusCode} ${originalPath} (${took}ms)`);
          }
        }
      });
      next();
    });
  }
} catch (_) {}

// Serve brand/social photos folder (backend/photos) for frontend consumption
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const photosDir = path.join(__dirname, '..', 'photos');
  if (fs.existsSync(photosDir)) {
    app.use('/photos', express.static(photosDir, {
      index: false,
      redirect: false,
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Lower cache during dev to see edits sooner; promote to long-lived in prod if desired
        const dev = (process.env.NODE_ENV || 'development') !== 'production';
        res.setHeader('Cache-Control', dev ? 'public, max-age=30' : 'public, max-age=31536000, immutable');
      }
    }));
  }
} catch (_) {}

// Serve React frontend static assets in production
if (process.env.NODE_ENV === "production") {
  try {
    if (fs.existsSync(frontendBuildPath)) {
      app.use(express.static(frontendBuildPath, {
        index: false, // Don't serve index.html automatically
        redirect: false,
        setHeaders: (res, path) => {
          // Different caching strategies for different file types
          if (path.endsWith('.html')) {
            // HTML files should not be cached aggressively
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          } else if (path.includes('/assets/') && (path.includes('.') && path.match(/\.[a-f0-9]{8,}\./))) {
            // Hashed assets can be cached forever
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            // Other static files get shorter cache
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
          }
        }
      }));
      console.log(`[frontend] serving SPA from ${frontendBuildPath}`);
    } else {
      console.warn(`[frontend] frontend build not found at ${frontendBuildPath}`);
    }
  } catch (_) {}
}

// CORS Configuration
// For production SPA deployments where frontend and backend are served from the same domain,
// CORS_ORIGIN can be left unset and the server will allow same-origin requests.
// For separate domain deployments, set CORS_ORIGIN to the frontend domain(s).
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

// For production SPA deployment where frontend and backend are served from same domain
const isProductionSPA = process.env.NODE_ENV === 'production' && allowedOrigins.length === 0;

app.use(cors({
  origin: function(origin, cb) {
    // Allow requests with no origin (same-origin requests, mobile apps, etc.)
    if (!origin) return cb(null, true);
    
    // For production SPA, be more permissive since frontend and backend are same-origin
    if (isProductionSPA) {
      return cb(null, true);
    }
    
    // Check explicit allowed origins
    const ok = allowedOrigins.includes(origin);
    if (ok) return cb(null, true);
    
    // In development, be more permissive if no origins configured
    if (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0) {
      return cb(null, true);
    }
    
    console.log(`CORS blocked origin: ${origin}, allowed: ${allowedOrigins.join(', ')}`);
    cb(new Error('CORS not allowed'), false);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use((req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });

// Global rate limit (burst control, optional Redis) - DISABLED FOR BULK REGISTRATION
let globalLimiter = null;
// Commenting out rate limiting for bulk user registration
/*
try {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const max = Number(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 600 : 10000)); // Much higher limit for development
  // Note: store is async; we cannot await in top-level middleware setup easily
  // so we set a temporary in-memory limiter and upgrade when store is ready.
  globalLimiter = rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false });
  (async () => {
    const store = await createRateLimitStore();
    if (store) {
      globalLimiter = rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, store });
    }
  })();
} catch (_) {}
if (globalLimiter) app.use(globalLimiter);
*/

// JSON body parsing with a sane limit
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/health', healthRouter);
app.use('/math', mathRouter);
app.use('/db', dbRouter);
app.use('/crypto', cryptoRouter);
app.use('/auth', authRouter);
app.use('/protected', protectedRouter);
app.use('/wallet', walletRouter);
app.use('/blockchain', blockchainRouter);
app.use('/portfolio', portfolioRouter);
app.use('/issuers', issuersRouter);
app.use('/auctions', auctionsRouter);
app.use('/admin-controls', adminControlsRouter);
app.use('/bids', bidsRouter);
app.use('/uploads', uploadsRouter);
app.use('/serv-ledger', servLedgerRouter); // admin-only service internal ledger
app.use('/transactions', transactionsRouter); // unified user transaction history
app.use('/account', accountRouter); // account overview stats
app.use('/admin-audit', adminAuditRouter); // admin financial audit
app.use('/trading', tradingRouter); // trading endpoints (market + order queue)
app.use('/trading-bot', tradingBotRouter); // trading bot management (admin only)
app.use('/admin/tickers', adminTickersRouter); // admin tickers management
app.use('/admin/tags', adminTagsRouter); // admin tags management
app.use('/admin/reconcile', adminReconcileRouter); // admin reconciliation management
app.use('/lp-settings', lpSettingsRouter); // LP settings management
app.use('/ownership', ownershipRouter); // FIFO ownership tracking and P&L calculations
app.use('/combined-history', combinedHistoryRouter); // Combined buy/sell history from profer and portfolio_assets
app.use('/profer', proferRouter); // profer utilities (current_price refresh)
app.use('/long-term', longTermRouter); // long-term PV snapshots metrics
app.use('/short-term', shortTermRouter); // short-term PV snapshots history
app.use('/debug', debugRouter); // UI debug event logs
app.use('/news', newsRouter); // news stories by tag
app.use('/indexs', indexsRouter); // index creation & management
app.use('/index-snapshots', indexSnapshotsRouter); // index snapshots history
app.use('/investor-inquiry', investorInquiryRouter); // investor inquiry form emails
app.use('/api', waitlistRouter); // public waitlist capture for fuel-your-dreamers landing
// Support both underscore and hyphen path styles for lp snapshot for caller convenience
app.use(['/lp_snapshot','/lp-snapshot'], lpSnapshotRouter);
// Presence system for on-demand background job coordination
if ((process.env.PRESENCE_API_ENABLED || 'true').toLowerCase() === 'true') {
  app.use('/presence', express.json({ limit: '64kb' }), presenceRouter);
}

// Root
app.get('/', (_req, res) => {
  // In production, serve the React app for the root route
  if (process.env.NODE_ENV === "production") {
    if (fs.existsSync(frontendIndexPath)) {
      res.sendFile(frontendIndexPath);
    } else {
      res.status(503).json({ error: 'Frontend build not found' });
    }
  } else {
    res.json({ name: 'PAUV2 API', status: 'ok' });
  }
});

// Serve static files from React build (in production)
if (process.env.NODE_ENV === "production") {
  if (fs.existsSync(frontendBuildPath)) {
    // Serve static assets with fallback to index.html for SPA routing
    app.use(express.static(frontendBuildPath, {
      index: false, // Don't serve index.html automatically
      fallthrough: true // Continue to next middleware if file not found
    }));
  } else {
    console.warn(`[frontend] static assets not mounted; missing build at ${frontendBuildPath}`);
  }
}

// 404 handler - serve React app for SPA routes, or API 404 for API routes
app.use((req, res) => {
  if (process.env.NODE_ENV === "production") {
    // Check if this looks like an API request based on path patterns only
    // API routes typically have specific patterns like /issuers/public/, /issuers/data/, etc.
    // Frontend routes are typically /issuers/:ticker or /issuers/:ticker/basic
    const isApiRequest = req.path.startsWith('/api/') || 
                        req.path.startsWith('/health') ||
                        req.path.startsWith('/math') ||
                        req.path.startsWith('/db') ||
                        req.path.startsWith('/crypto') ||
                        req.path.startsWith('/auth') ||
                        req.path.startsWith('/protected') ||
                        req.path.startsWith('/wallet') ||
                        req.path.startsWith('/blockchain') ||
                        req.path.startsWith('/portfolio') ||
                        req.path.startsWith('/issuers/public/') ||
                        req.path.startsWith('/issuers/closed') ||
                        req.path.startsWith('/issuers/me') ||
                        req.path.startsWith('/issuers/requests') ||
                        req.path.startsWith('/issuers/tags') ||
                        req.path.startsWith('/issuers/market-data') ||
                        req.path.startsWith('/issuers/admin') ||
                        req.path.startsWith('/issuers/data/') ||
                        req.path.startsWith('/issuers/exists/') ||
                        req.path.startsWith('/issuers/holders/') ||
                        req.path.startsWith('/issuers/tickers/') ||
                        req.path.startsWith('/bids') ||
                        req.path.startsWith('/uploads') ||
                        req.path.startsWith('/serv-ledger') ||
                        req.path.startsWith('/transactions') ||
                        req.path.startsWith('/account') ||
                        req.path.startsWith('/admin') ||
                        req.path.startsWith('/trading') ||
                        req.path.startsWith('/lp-') ||
                        req.path.startsWith('/ownership') ||
                        req.path.startsWith('/combined-history') ||
                        req.path.startsWith('/profer') ||
                        req.path.startsWith('/long-term') ||
                        req.path.startsWith('/short-term') ||
                        req.path.startsWith('/debug') ||
                        req.path.startsWith('/news') ||
                        req.path.startsWith('/indexs/') ||
                        req.path.startsWith('/index-snapshots') ||
                        req.path.startsWith('/presence');
    
    if (isApiRequest) {
      res.status(404).json({ error: 'Not Found' });
    } else {
      // Serve React app for SPA routes with proper cache headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      if (fs.existsSync(frontendIndexPath)) {
        // Inject version for cache busting
        try {
          let htmlContent = fs.readFileSync(frontendIndexPath, 'utf8');
          const version = Date.now().toString(); // Use timestamp as version
          htmlContent = htmlContent.replace('{{VERSION_PLACEHOLDER}}', version);
          res.send(htmlContent);
        } catch (err) {
          res.sendFile(frontendIndexPath);
        }
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    }
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
