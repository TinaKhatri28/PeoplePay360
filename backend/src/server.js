const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'PeoplePay360 API' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/time-off', require('./routes/timeoff'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`PeoplePay360 API running on http://localhost:${PORT}`));
