import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const urlPathArray = resolvedParams.path;

  if (!urlPathArray || urlPathArray.length === 0) {
    return new NextResponse(JSON.stringify({ error: 'Missing path parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sanitize path elements to prevent path traversal
  const sanitizedSegments = urlPathArray.map(segment => segment.replace(/(\.\.|\/|\\)/g, ''));
  const segmentsWithoutData = sanitizedSegments[0] === 'data' ? sanitizedSegments.slice(1) : sanitizedSegments;
  
  // Resolution candidates
  const candidatePaths = [
    path.resolve(process.cwd(), 'assets', ...sanitizedSegments),
    path.resolve(process.cwd(), ...sanitizedSegments),
    path.resolve(process.cwd(), 'game', 'Data', ...sanitizedSegments),
    path.resolve(process.cwd(), 'game', 'Data', ...segmentsWithoutData),
    path.resolve(process.cwd(), 'public', ...sanitizedSegments),
  ];

  let filePath = candidatePaths.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  
  console.log(`[Assets Route] CWD: ${process.cwd()}, Requested: ${sanitizedSegments.join('/')}, Resolved: ${filePath || 'NONE'}`);

  try {
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    return new NextResponse(JSON.stringify({ error: `File not found: ${sanitizedSegments.join('/')}` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error(`[Assets Route] Error serving path ${sanitizedSegments.join('/')}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
