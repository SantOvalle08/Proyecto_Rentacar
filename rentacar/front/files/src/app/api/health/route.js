export async function GET() {
  return Response.json({
    ok: true,
    service: 'rentacar-frontend',
    timestamp: new Date().toISOString(),
  });
}
