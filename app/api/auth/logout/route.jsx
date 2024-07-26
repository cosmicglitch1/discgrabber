import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST(request) {
  try {
    // Clear cookies by setting them with an expired date
    const codeCookie = serialize('code', '', { maxAge: -1, path: '/' });
    const accessTokenCookie = serialize('access_token', '', { maxAge: -1, path: '/' });
    const refreshTokenCookie = serialize('refresh_token', '', { maxAge: -1, path: '/' });

    const response = NextResponse.redirect(new URL('/', request.url));
    response.headers.set('Set-Cookie', codeCookie);
    response.headers.append('Set-Cookie', accessTokenCookie);
    response.headers.append('Set-Cookie', refreshTokenCookie);

    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.error();
  }
}
