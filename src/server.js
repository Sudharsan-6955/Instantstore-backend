require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const hostParserMiddleware = require('./middleware/hostParser');

const tenantRoutes = require('./routes/tenantRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const benchmarkRoutes = require('./routes/benchmarkRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: true, // Allow all origins including subdomains (e.g. *.localhost:5173)
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Layer 2: Edge Host Header Interception Middleware
app.use(hostParserMiddleware);

// Diagnostic Health & Edge Telemetry Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'InstantStore Edge Gateway & Virtualized Backend',
    edgeTelemetry: {
      clientHost: req.headers.host,
      interceptedSubdomain: req.tenantSubdomain || 'PLATFORM_ROOT',
      isPlatformHost: req.isPlatformHost,
      edgeResolutionMs: req.edgeResolutionMs,
      routingMode: req.tenantSubdomain ? 'DYNAMIC_TENANT_VIRTUALIZATION' : 'CENTRAL_STUDIO_INGRESS',
    },
    uptimeSeconds: process.uptime().toFixed(1),
    timestamp: new Date().toISOString(),
  });
});

// Mount Scoped API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/upload', uploadRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[InstantStore Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    edgeContext: {
      tenantSubdomain: req.tenantSubdomain,
      resolutionMs: req.edgeResolutionMs,
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ InstantStore Multi-Tenant Edge Gateway Running!`);
  console.log(`📡 Ingress Gateway: http://localhost:${PORT}`);
  console.log(`🧪 Edge Health:    http://localhost:${PORT}/api/health`);
  console.log(`📊 Benchmarking:   http://localhost:${PORT}/api/benchmarks/telemetry`);
  console.log(`=======================================================`);
});
