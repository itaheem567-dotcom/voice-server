// Simple Node.js Signaling Server for Eaglercraft 26.2 Proximity Voice Chat
// Run with: node server.js (requires Node 18+)

const http = require("http");
const url = require("url");

const PORT = process.env.PORT || 3000;
const offers = {};  // { targetPlayer: [ { from, sdp }, ... ] }
const answers = {}; // { targetPlayer: [ { from, sdp }, ... ] }

function setCors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer((req, res) => {
    setCors(res);

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    const parsed = url.parse(req.url, true);

    if (req.method === "GET" && parsed.pathname === "/poll") {
        const player = parsed.query.player;
        if (!player) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Missing player query param" }));
        }

        const payload = {
            offers: offers[player] || [],
            answers: answers[player] || []
        };
        delete offers[player];
        delete answers[player];

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(payload));
    }

    if (req.method === "POST" && (parsed.pathname === "/offer" || parsed.pathname === "/answer")) {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
            try {
                const { from, to, sdp } = JSON.parse(body);
                if (!from || !to || !sdp) {
                    res.writeHead(400);
                    return res.end("Invalid payload");
                }
                const store = parsed.pathname === "/offer" ? offers : answers;
                if (!store[to]) store[to] = [];
                store[to].push({ from, sdp });

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true }));
            } catch (e) {
                res.writeHead(400);
                res.end("Bad JSON");
            }
        });
        return;
    }

    res.writeHead(404);
    res.end("Not found");
});

server.listen(PORT, () => {
    console.log(`Eaglercraft Voice Signaling Server running on port ${PORT}`);
});
