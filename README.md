
# HTTP Session Hijacking Lab – OWASP Top 10 A04: Cryptographic Failures

## 1. Why I built this

I created this lab after studying **OWASP Top 10 Cryptographic Failures**, where weak protection of session tokens and cookies is highlighted as a common issue.[web:179][web:187]  
Instead of only reading theory, I wanted a small project where I could **build an insecure session design, exploit it with Burp Suite, and then discuss how to fix it**.[web:181][web:190]

---

## 2. What this lab shows

This repo demonstrates how insecure cookie settings can turn into a **cryptographic failure** and allow session hijacking:

- Session cookie `SESSIONID` is sent over plain HTTP, with **no `Secure`, `HttpOnly`, or `SameSite` flags**.[web:185][web:186][web:188]  
- The server trusts only the cookie value to identify the user.  
- Anyone who can steal the cookie (simulated via Burp) can fully impersonate the victim and trigger actions like a money transfer.[web:181]

This ties directly into OWASP’s guidance about protecting data in transit and secrets such as session tokens.[web:179][web:185]

---

## 3. Stack and setup

**Tech stack**

- Node.js, Express, cookie‑parser  
- Burp Suite Community Edition (proxy + Repeater)[web:181]  

**Run locally**

```bash
git clone https://github.com/rohitoff799-netizen/owasp-a04-session-hijacking-lab.git
cd owasp-a04-session-hijacking-lab
npm install
node app.js
App URL:

text
http://127.0.0.1:8080
4. Application design (intentionally insecure)
The app is a simple “Dummy Bank”:

GET /login – login form

POST /login – creates a random session ID and sets it in a cookie

GET / – dashboard that requires a valid session

POST /transfer – dummy transfer endpoint

On login, the server generates sid with crypto.randomBytes(...) and does:

js
res.cookie('SESSIONID', sid, {
  httpOnly: false,
  secure: false
});
Then middleware looks up req.cookies.SESSIONID in an in‑memory Map and sets req.user if it exists.

Issues on purpose

secure: false → cookie can be sniffed on HTTP traffic.

httpOnly: false → cookie readable via document.cookie, so XSS can steal it.[web:186][web:190]

No SameSite → easier CSRF and cross‑site abuse.[web:185]

The result: whoever knows the SESSIONID value is treated as the logged‑in user.

5. Attack walkthrough (Burp Suite)
High‑level steps to reproduce the hijack:

Configure the browser to use Burp as an HTTP proxy and start the lab app.[web:181]

Log in at http://127.0.0.1:8080/login.

In Burp → Proxy → HTTP history, find the POST /login response and note the header:

text
Set-Cookie: SESSIONID=<victim_session_id>; Path=/
Send the subsequent authenticated GET / request to Repeater.

In Repeater, send the request with:

text
Cookie: SESSIONID=<victim_session_id>
You will see the logged‑in dashboard HTML in the response, even though the request is sent directly from Burp.[web:181]

Change the cookie to a random value and resend; you get the login page or a 401.
This proves that possession of the session cookie alone is enough to hijack the account.

6. Relation to OWASP Cryptographic Failures
This lab maps to OWASP Cryptographic Failures because it shows:

Data in transit not adequately protected – cookies are sent over HTTP instead of HTTPS.[web:179][web:186]

Secrets (session IDs) not protected – missing Secure, HttpOnly, SameSite, no clear expirations.[web:185][web:190]

Weak session design – “if you have this token, you are the user”, with no extra checks.

This is exactly the kind of misconfiguration OWASP warns about when discussing cryptographic failures and session management.

7. Hardening ideas
After the attack, I experimented with defenses:

js
res.cookie('SESSIONID', sid, {
  httpOnly: true,        // hide from document.cookie
  secure: true,          // only over HTTPS
  sameSite: 'Lax',       // limit cross-site use
  maxAge: 15 * 60 * 1000 // short lifetime
});
Additional improvements:

Serve the app only over HTTPS and enable HSTS.[web:186]

Store sessions in a proper store with expiry and invalidation.

Fix XSS so cookies cannot be stolen via script.

Follow OWASP Session Management and Cookie Attribute guidelines when designing real apps.[web:185][web:190]

8. What this repo represents
My practical exploration of OWASP Cryptographic Failures using a real Node.js app.

A reproducible lab showing session hijacking via insecure cookies and how to talk about it in assessments.

A starting point to extend into more advanced scenarios (XSS‑based cookie theft, CSRF, secure version of the app).

