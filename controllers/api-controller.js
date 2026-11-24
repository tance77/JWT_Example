const jwt = require("jsonwebtoken");

module.exports = function apiController({ secret }) {
    return function test(req, res) {
        const authorization = req.get("authorization");
        // Keep the original token header/body for existing example clients.
        const token = authorization ? /^Bearer (\S+)$/i.exec(authorization)?.[1] :
            req.get("token") || req.body?.token;
        if (typeof token !== "string" || !token) {
            return res.status(401).json({ error: { code: 401, message: "No JSON token received." } });
        }
        try {
            return res.json(jwt.verify(token, secret, {
                algorithms: ["HS256"], issuer: "jwt-example", audience: "jwt-example-api"
            }));
        } catch {
            return res.status(401).json({ error: { code: 401, message: "JSON Web Token is invalid or expired." } });
        }
    };
};
