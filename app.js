const express = require('express');
const path = require('path');
const runSniperPipeline = require('./runSniperPipeline');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (if any)
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const homeRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const logsRoutes = require('./routes/logs');
const debugRoutes = require('./routes/debug');
app.use('/', homeRoutes);
app.use('/', exportRoutes);
app.use('/', logsRoutes);
app.use('/', debugRoutes);

// 🧠 Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Pump Fun Sniper Dashboard' });
});

app.get('/settings', (req, res) => {
  res.render('settings', { title: 'Settings' });
});

app.get('/logs', (req, res) => {
  res.render('logs', { title: 'System Logs' });
});

setInterval(() => {
  runSniperPipeline();
}, 5 * 60 * 1000); // 5 minutes

//async function runSniperPipeline() {
  //console.log('🔄 Testing Individual Function');
  //await scrapePumpFunTokens();
  //await runJupiterChecker();
  //await runTracker();
  //await runPerformanceEvaluator();
  //runEntryEvaluator();
//}

runSniperPipeline();

// 🔥 Start server
app.listen(PORT, () => {
  console.log(`🚀 Sniper Dashboard running at http://localhost:${PORT}`);
});