const express = require('express');
const cors    = require('cors');
const routes  = require('./routes/dashboard');
const app     = express();
const PORT    = process.env.PORT || 3006;
app.use(cors()); app.use(express.json());
app.use('/api/dashboard', routes);
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'dashboard-service' }));
app.listen(PORT, () => console.log(`[dashboard-service] Listening on port ${PORT}`));
