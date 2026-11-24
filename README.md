# JWT Example

Create an account, log in, and use a JSON Web Token (JWT) to get your account details.

**New here? Follow steps 1–5 in order. Setup only needs to be done once.**

## 1. Install these first

- [Node.js 26 LTS](https://nodejs.org/en/download) — includes npm. Use the latest version of Node.js 26 (at least 26.13.1).
- [Git](https://git-scm.com/install/) — downloads this project.
- [MySQL Server 8.4](https://dev.mysql.com/downloads/mysql/8.4.html) — stores your accounts. Start the server after installing it, and save the password you choose for its `root` user.

Open a **new terminal** after installing. Use **PowerShell** on Windows or **Terminal** on macOS/Linux.

Run these to check that Node.js and npm work:

```sh
node --version
npm --version
```

Both should print a version number. The Node.js version should start with `v26`.

## 2. Download the project

Run these commands one at a time:

```sh
git clone https://github.com/tance77/JWT_Example.git
cd JWT_Example
npm ci
```

Keep this terminal open. Run the remaining commands from inside the `JWT_Example` folder.

## 3. Add your settings

Copy `.env.example` to a new file called `.env`.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```sh
cp .env.example .env
```

Now generate a secret key:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the long line it prints. Open `.env` in a text editor and change these two lines:

```dotenv
SECRET_KEY=paste_the_long_line_here
DB_PASSWORD="your_mysql_password"
```

- Replace `paste_the_long_line_here` with the generated key.
- Replace `your_mysql_password` with the MySQL `root` password from step 1. Keep the quotes.
- Leave the other settings as they are for a normal local installation. If you use another MySQL username, change `DB_USER` too.

Save the file as **`.env`**, not `.env.txt`. Keep it private.

**This MySQL password connects the app to the database. You will create your website login in step 5.**

## 4. Set up the database and start the app

Make sure MySQL Server is running. Then run:

```sh
npm run db:create
npm run db:migrate
npm start
```

Run each command after the previous one finishes successfully. The first two create the database and account table. They are safe to run again.

When you see **`Listening on port 3001`**, open:

**[http://localhost:3001](http://localhost:3001)**

Leave the terminal running while you use the app. Press **Ctrl+C** to stop it.

## 5. Try it

1. Click **Create New User** and fill in the form. Use a password with at least 8 characters.
2. Click **Register**.
3. Log in with the username and password you just created.
4. On the dashboard, click **Get Secure Information**.

You should see your account details. The long text in the token box is your JWT: the app sends it to the server to prove you logged in.

If you refresh the dashboard or the token expires after one hour, log in again.

## Run it again later

Start MySQL Server, open a terminal in the `JWT_Example` folder, and run:

```sh
npm start
```

Your settings and accounts are saved. You can skip the setup steps.

## Something went wrong?

| What you see | What to do |
| --- | --- |
| `node`, `npm`, or `git` is not recognized / command not found | Install the missing tool from step 1, then close and reopen your terminal. |
| `EBADENGINE` / unsupported Node.js version | Install the latest Node.js 26 LTS release. Check it with `node --version`. |
| `ECONNREFUSED` / cannot connect to MySQL | Start MySQL Server. Check `DB_HOST` and `DB_PORT` in `.env`; the defaults are `127.0.0.1` and `3306`. |
| `Access denied` | Check `DB_USER` and `DB_PASSWORD` in `.env`. If your MySQL account has no password, use `DB_PASSWORD=`. The user needs permission to create the database. |
| Unknown database / missing `users` table | Run `npm run db:create`, then `npm run db:migrate`. |
| An error mentioning `SECRET_KEY` | Generate a key in step 3, paste it into `.env`, save, and restart the app. |
| `EADDRINUSE` / port already in use | Change `PORT=3001` to `PORT=3002` in `.env`, restart, and open `http://localhost:3002`. |
| HTTP 401 / invalid or expired token | Log in again to get a new token. |
| HTTP 429 / too many attempts | Wait up to 15 minutes, then try again. |

## Optional details

<details>
<summary>Updating an old copy of this project</summary>

1. Install the latest Node.js 26 LTS release.
2. Run `git pull`, then `npm ci` in the project folder.
3. Create `.env` if you do not have one. Add your existing database credentials and `DB_NAME`, then generate a new `SECRET_KEY` using step 3 above.
4. Run `npm run db:migrate`, then `npm start`.

Existing accounts and password hashes are preserved. The original table layout and `SequelizeMeta` migration record are retained. Keep your database; no reset is needed.

Database settings now come from `.env`. Sequelize and its global CLI are no longer needed. Log in again after updating because the old hardcoded signing key has been removed.

To roll back the code, restore the previous Git revision and its dependency/configuration files. This update does not change existing database tables or delete user data.

</details>

<details>
<summary>Using the API directly</summary>

| Request | What to send |
| --- | --- |
| `POST /users/create` | JSON with `username`, `email`, and `password`. `firstName` and `lastName` are optional. |
| `POST /users/login` | JSON with `username` (or email) and `password`. |
| `GET /api/test` | An `Authorization: Bearer YOUR_TOKEN` header. |

Login returns `token`, `tokenType: "Bearer"`, `expiresIn: 3600`, and `redirect: "/users/dashboard"`. Read the token from the JSON response.

Passwords must have at least 8 characters and at most 72 UTF-8 bytes. Tokens expire after one hour. Missing, invalid, and expired tokens return HTTP 401. Older clients can still use the original `token` header or GET request body field.

JWT contents are readable, so keep secrets out of them. This app excludes password hashes from tokens and keeps tokens out of URLs. The browser briefly uses `sessionStorage` to transfer the token to the dashboard, then removes the stored value.

</details>

<details>
<summary>Development, tests, and maintenance</summary>

- `npm run dev` — restart automatically when code changes.
- `npm test` — run tests; MySQL is not required for the default tests.
- `npm audit` — check dependencies for reported vulnerabilities.
- `npm outdated` — check for newer package versions.

For the MySQL integration test, set `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` in your shell, set `TEST_MYSQL=1`, and run `npm test`. This test creates and removes its own database. Its MySQL user needs permission to create and drop test databases. It leaves the database named in `DB_NAME` alone. `npm test` does not load `.env`.

Supported Node.js versions are 24.22.3+ within version 24, or 26.13.1+ within version 26. `.nvmrc` selects 26. GitHub Actions runs tests with MySQL on both versions, plus a Windows check, and runs `npm audit`. Dependabot checks packages and GitHub Actions weekly. Commit `package-lock.json` when updating packages and use `npm ci` to install them.

This is a learning example. A deployed authentication service also needs HTTPS, account recovery and verification, token revocation/refresh design, and a rate-limit store shared across server instances. The included limiter allows 50 registration/login attempts per IP per 15 minutes.

</details>
