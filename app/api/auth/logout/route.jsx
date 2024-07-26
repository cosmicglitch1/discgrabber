import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST(request) {
  try {
    // Clear cookies by setting them with an expired date
    const codeCookie = serialize('code', '', { maxAge: -1, path: '/' });
    const accessTokenCookie = serialize('access_token', '', { maxAge: -1, path: '/' });
    const refreshTokenCookie = serialize('refresh_token', '', { maxAge: -1, path: '/' });

    // Redirect to the home page after clearing cookies
    const response = NextResponse.redirect(new URL('/', request.url));

    // Set cookies to expire them
    response.headers.set('Set-Cookie', `${codeCookie}, ${accessTokenCookie}, ${refreshTokenCookie}`);

    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    // Return a 500 status code with a meaningful error message
    return new Response('Internal Server Error', { status: 500 });
  }
}
