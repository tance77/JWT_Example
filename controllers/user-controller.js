const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function validText(value, max = 255) {
    return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function validPassword(value) {
    // bcrypt only hashes the first 72 bytes. Reject longer passwords rather than truncate.
    return typeof value === "string" && value.length > 0 && !bcrypt.truncates(value);
}

module.exports = function userController({ database, secret }) {
    return {
        async createUser(req, res) {
            const { username, email, password, firstName = "", lastName = "" } = req.body || {};
            if (!validText(username) || !validText(email) || !/^\S+@\S+\.\S+$/.test(email) ||
                !validPassword(password) || password.length < 8 ||
                typeof firstName !== "string" || firstName.length > 255 ||
                typeof lastName !== "string" || lastName.length > 255) {
                return res.status(400).json({ error: { code: 400,
                    message: "Provide a username, valid email, and password of at least 8 characters and at most 72 bytes." } });
            }
            const hash = await bcrypt.hash(password, 12);
            try {
                await database.execute(
                    "INSERT INTO users (username, password, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
                    [username.trim(), hash, email.trim(), firstName.trim(), lastName.trim()]
                );
            } catch (error) {
                if (error.code !== "ER_DUP_ENTRY") throw error;
                return res.status(409).json({ error: { code: 409, message: "This user already exists." } });
            }
            res.status(201).json({ redirect: "/users/login" });
        },

        async login(req, res) {
            const { username, password } = req.body || {};
            if (!validText(username) || !validPassword(password)) {
                return res.status(400).json({ error: { code: 400, message: "Provide a username or email and password." } });
            }
            const [rows] = await database.execute(
                "SELECT id, username, password, email, first_name, last_name, display_name, location FROM users WHERE username = ? OR email = ? LIMIT 1",
                [username.trim(), username.trim()]
            );
            const user = rows[0];
            if (!user || !await bcrypt.compare(password, user.password)) {
                return res.status(401).json({ error: { code: 401, message: "Invalid username or password." } });
            }
            const { id, email, first_name, last_name, display_name, location } = user;
            const token = jwt.sign({ id, username: user.username, email, first_name, last_name, display_name, location }, secret, {
                algorithm: "HS256", expiresIn: "1h", issuer: "jwt-example",
                audience: "jwt-example-api", subject: String(id)
            });
            res.json({ redirect: "/users/dashboard", token, tokenType: "Bearer", expiresIn: 3600 });
        }
    };
};
