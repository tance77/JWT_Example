# JSON Web Token Example

A small Node.js, Express, and MySQL example: register a user, log in, and use a signed JWT to retrieve that user's public profile claims.

## Requirements

- The latest patch release of Node.js 24 or 26 LTS and npm. `.nvmrc` selects Node.js 26.
- MySQL 8.4 LTS, running locally or on a host you configure.

## Run locally

```sh
git clone https://github.com/tance77/JWT_Example.git
cd JWT_Example
npm ci
```

Copy `.env.example` to `.env` (`cp .env.example .env` on macOS/Linux, `Copy-Item .env.example .env` in PowerShell). Set your database credentials and generate a unique signing secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Paste that value into `SECRET_KEY` in `.env`. The application requires at least 32 bytes and will refuse to start with an empty or short secret. `.env` is ignored by Git; do not commit credentials.

```sh
npm run db:create
npm run db:migrate
npm start
```

Open [http://localhost:3001](http://localhost:3001), create a user, and log in. The dashboard lets you inspect the token and send it to the protected API. Set `PORT` in `.env` to change the port. `npm run dev` restarts the server when source files change. No global npm packages or asset compilation are needed.

`db:create` needs permission to create the configured database. If it already exists, you can go straight to `db:migrate`. Both commands are safe to repeat.

## API example

Register with `POST /users/create`, supplying JSON fields `username`, `email`, and `password`; `firstName` and `lastName` are optional. New passwords must have at least 8 characters and at most 72 UTF-8 bytes, bcrypt's limit. Passwords receive separate random salts.

Log in with a username or email:

```sh
curl -X POST http://localhost:3001/users/login -H "Content-Type: application/json" -d '{"username":"demo","password":"your-password"}'
```

The response includes `token`, `tokenType: "Bearer"`, `expiresIn: 3600`, and `redirect: "/users/dashboard"`. Send the token to the API:

```sh
curl http://localhost:3001/api/test -H "Authorization: Bearer YOUR_TOKEN"
```

Missing, invalid, and expired tokens return HTTP 401. Tokens expire after one hour and verification restricts the algorithm to HS256 and checks issuer and audience. The original `token` request header and GET request body field are still accepted for older example clients; new clients should use `Authorization: Bearer`.

JWT payloads are readable, not encrypted. This example includes profile fields but never the password hash. The browser briefly uses `sessionStorage` to transfer the token from login to the dashboard, then removes the stored value; refreshing the dashboard clears its token field. Tokens are not included in redirect URLs.

## Updating an existing checkout

Install a supported Node.js version, run `npm ci`, and configure `.env` using your existing database credentials. Database settings now come from environment variables rather than `config/config.json` or `database.js`. Choose a new `SECRET_KEY`; the old hardcoded secret was public. Existing tokens will need to be replaced by logging in again.

The application retains the original `users` columns, bcrypt password hashes, and `SequelizeMeta` migration record named `20170518215602-db_create.js`. `npm run db:migrate` skips that migration when it has already been recorded. Existing users do not need to register again. The one-table setup uses `mysql2` directly, so Sequelize and its global CLI are no longer needed. The `.hbs` templates use `express-handlebars` in place of the vulnerable `hbs` package. Browser code uses native forms and `fetch`, with all assets served locally.

For a code rollback, restore the previous Git revision and its dependency/configuration files. This update does not change existing database tables or delete user data. Do not run a database reset or drop tables as part of the update.

## Checks and maintenance

```sh
npm test
npm audit
npm outdated
```

The default tests check rendering, input validation, password hashing, parameterized SQL, token verification, error handling, and rate limiting. To also run the MySQL integration test, configure `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` in your shell and set `TEST_MYSQL=1` before running `npm test`. This test creates a uniquely named disposable database, checks migrations and the full authentication flow, then removes that database. It never migrates or clears the configured `DB_NAME`. Its account must be allowed to create and drop test databases. `npm test` does not load your local `.env`.

GitHub Actions runs the complete suite with MySQL on Node.js 24 and 26, plus a Windows check, and runs `npm audit`. Dependabot checks npm packages and GitHub Actions weekly. Commit `package-lock.json` when updating dependencies and use `npm ci` for reproducible installs.

This repository is a learning example. A deployed authentication service also needs HTTPS, account recovery and verification, token revocation/refresh design, and a rate-limit store shared across server instances. The included in-memory limiter allows 50 registration/login attempts per IP per 15 minutes.
