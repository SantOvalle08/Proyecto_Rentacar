import { NextResponse } from 'next/server';
import http from 'http';
import https from 'https';

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5001'
).replace(/\/$/, '');

function httpRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers,
    };

    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });

    req.on('error', reject);

    if (body) req.write(body);
    req.end();
  });
}

async function proxy(request, context) {
  const { path: pathArr } = await context.params;
  const pathStr = Array.isArray(pathArr) ? pathArr.join('/') : pathArr;

  const { search } = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/${pathStr}${search}`;

  const forwardHeaders = {};
  const contentType = request.headers.get('content-type');
  if (contentType) forwardHeaders['content-type'] = contentType;
  const auth = request.headers.get('authorization');
  if (auth) forwardHeaders['authorization'] = auth;

  let body;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.text();
    if (body) forwardHeaders['content-length'] = Buffer.byteLength(body).toString();
  }

  try {
    const result = await httpRequest(backendUrl, request.method, forwardHeaders, body);

    const responseHeaders = new Headers();
    const ct = result.headers['content-type'];
    if (ct) responseHeaders.set('Content-Type', ct);

    return new Response(result.body, {
      status: result.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[proxy] ${request.method} ${backendUrl} →`, error.message);
    return NextResponse.json(
      { success: false, message: 'No se pudo conectar con el servidor backend' },
      { status: 503 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
export const OPTIONS = proxy;
