import axios from 'axios';
import url from 'url';

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
  
  let accessToken = cookies.access_token;

  if (!accessToken && code) {
    const formData = new url.URLSearchParams({
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

      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
          'Set-Cookie': `access_token=${accessToken}; HttpOnly; Path=/; Max-Age=3600, refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=1209600`,
        },
      });
    } catch (error) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      return new Response('Error during OAuth process', { status: 500 });
    }
  }

  if (!accessToken) {
    return new Response('Authorization required', { status: 401 });
  }

  try {
    const userinfo = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userData = userinfo.data;
    let userFlags = [];
    if (userData.flags) {
      userFlags = decodeFlags(userData.flags);
    }

    const guilds = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const guildsList = guilds.data.map(guild => `**${guild.name}** (${guild.id})`).join('<br>');

    let badgeDescription = [];
    if (userFlags.length > 0) {
      badgeDescription.push(...userFlags);
    }
    if (userData.premium_type) {
      badgeDescription.push('Nitro');
    }

    if (badgeDescription.length === 0) {
      badgeDescription.push('None');
    }

    const creationTimestamp = (BigInt(userData.id) >> 22n) + 1420070400000n;
    const createdAtDate = new Date(Number(creationTimestamp));
    const creationDateString = createdAtDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let avatarUrl;
    if (userData.avatar) {
      avatarUrl = userData.avatar.startsWith('a_')
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.gif`
        : `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
    } else {
      avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png'; // Fallback image
    }

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

    const response = new Response(`
      <!DOCTYPE html>
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
            flex-direction: column;
            width: 100%;
            max-width: 600px;
          }

          .card {
            background-color: var(--card-background-color-light);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
            padding: 20px;
            text-align: center;
            transition: background-color 0.3s, border-color 0.3s;
            width: 100%;
          }

          body.dark-mode .card {
            background-color: var(--card-background-color-dark);
            border-color: var(--secondary-color);
          }

          .avatar {
            border-radius: 50%;
            width: 120px;
            height: 120px;
            object-fit: cover;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          h1 {
            font-size: 2rem;
            margin: 0.5rem 0;
            color: var(--primary-color);
          }

          p {
            margin: 0.5rem 0;
          }

          button {
            background-color: var(--primary-color);
            border: none;
            border-radius: 8px;
            color: var(--text-color-dark);
            cursor: pointer;
            margin: 10px 0;
            padding: 10px 20px;
            font-size: 1rem;
            transition: background-color 0.3s, transform 0.2s;
          }

          button:hover {
            background-color: var(--secondary-color);
            transform: scale(1.05);
          }

          #theme-toggle {
            background-color: var(--secondary-color);
            color: var(--text-color-dark);
            border: 1px solid var(--border-color);
            border-radius: 8px;
          }

          #theme-toggle:hover {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="${avatarUrl}" alt="User Avatar" class="avatar">
            <h1>${userData.username}</h1>
            <p>ID: ${userData.id}</p>
            <p>Created on: ${creationDateString}</p>
            <p>Email: ${userData.email}</p>
            <p>Badges: ${badgeDescription.join(', ')}</p>
            <p>Guilds: ${guildsList || 'No guilds found'}</p>
            <button onclick="logout()">Logout</button>
            <button id="theme-toggle">Switch to Dark Mode</button>
          </div>
        </div>
        <script>
          function logout() {
            fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            .then(response => {
              if (response.ok) {
                window.location.href = '/';
              } else {
                alert('Logout failed. Please try again.');
              }
            })
            .catch(error => {
              console.error('Error during logout:', error);
              alert('An error occurred. Please try again.');
            });
          }

          document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const button = document.getElementById('theme-toggle');
            if (document.body.classList.contains('dark-mode')) {
              button.textContent = 'Switch to Light Mode';
            } else {
              button.textContent = 'Switch to Dark Mode';
            }
          });
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });

    return response;
  } catch (error) {
    let errorMessage = 'Unknown error occurred';

    if (error.response) {
      errorMessage = `Server responded with status ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      errorMessage = 'No response received from server';
    } else {
      errorMessage = `Error setting up request: ${error.message}`;
    }

    console.error('Error during user data retrieval:', errorMessage);
    return new Response('Error during user data retrieval: ' + errorMessage, { status: 500 });
  }
}
