const https = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'builtat-local.growthx.club';
const port = 443;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('/Users/arjan/builtat-local.growthx.club-key.pem'),
  cert: fs.readFileSync('/Users/arjan/builtat-local.growthx.club.pem'),
};

app.prepare().then(() => {
  https.createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`> Ready on https://${hostname}`);
  });
});
