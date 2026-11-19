const http = require('http');

const TARGET_PORT = 54322;
const PROXY_PORT = 54321;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Strip /rest/v1
  let targetPath = req.url;
  if (targetPath.startsWith('/rest/v1')) {
    targetPath = targetPath.slice('/rest/v1'.length) || '/';
  }

  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: targetPath,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${TARGET_PORT}` }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway', details: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Supabase REST Proxy listening on 0.0.0.0:${PROXY_PORT} -> ${TARGET_PORT}`);
});
