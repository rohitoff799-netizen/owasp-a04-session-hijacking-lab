const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const sessions = new Map();

app.use((req, res, next) => {
  const sid = req.cookies.SESSIONID;
  if (sid && sessions.has(sid)) {
    req.user = { username: sessions.get(sid) };
  }
  next();
});

app.get('/', (req, res) => {
  if (!req.user) {
    return res.send(`
      <h1>Dummy Bank (INSECURE)</h1>
      <p>Not logged in</p>
      <a href="/login">Login</a>
    `);
  }

  res.send(`
    <h1>Dummy Bank (INSECURE)</h1>
    <p>Welcome, ${req.user.username}</p>
    <p>Balance: ₹10,000</p>
    <form method="POST" action="/transfer">
      <label>Recipient account: <input name="to"></label><br><br>
      <label>Amount: <input name="amount" value="1000"></label><br><br>
      <button type="submit">Send</button>
    </form>
  `);
});

app.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="POST" action="/login">
      <label>Username: <input name="username" value="rohit"></label><br><br>
      <label>Password: <input name="password" type="password" value="password"></label><br><br>
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', (req, res) => {
  const { username } = req.body;
  const sid = crypto.randomBytes(16).toString('hex');
  sessions.set(sid, username);

  res.cookie('SESSIONID', sid, {
    httpOnly: false,
    secure: false
  });

  res.redirect('/');
});

app.post('/transfer', (req, res) => {
  if (!req.user) {
    return res.status(401).send('Not authenticated');
  }

  const { to, amount } = req.body;
  console.log(`[TRANSFER] ${req.user.username} -> ${to} amount ${amount}`);

  res.send(`
    <p>Transfer submitted from ${req.user.username} to ${to} amount ${amount}</p>
    <a href="/">Back</a>
  `);
});

app.listen(8080, () => {
  console.log('Vulnerable app listening on http://127.0.0.1:8080');
});
