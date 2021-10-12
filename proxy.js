const http = require('http')
const https = require('https')

/**
 * Proxy GET requests to registry.npmjs.org but respond using chunked-encoding
 * `npm install <package>` will fail with this registry.  
 */

// different sizes will reproduce the issue, but large sizes will not.
const size = 0x4000
const host = 'https://registry.npmjs.com'

http.createServer(async (req, res) => {
  if (req.method != 'GET') {
    console.log('reject', { method: req.method, url: req.url })
    res.writeHead(404)
    res.end()
    return
  }
  // forward to npm
  https.get(host + req.url, async proxyRes => {
    const {statusCode, statusMessage, headers} = proxyRes

    // remove content-length so the server uses chunked encoding.
    delete headers['content-length']

    res.writeHead(statusCode, statusMessage, headers)
    const buffer = await collect(proxyRes)

    for (let i = 0; i < buffer.length; i += size) {
      res.write(buffer.slice(i, i+size));
    }
    res.end()
  })
}).listen(4000, function () {
  console.log(this.address())
})

async function collect (stream) {
  const buffers = [];
  for await (const chunk of stream) {
    buffers.push(chunk)
  }
  return Buffer.concat(buffers)
}
