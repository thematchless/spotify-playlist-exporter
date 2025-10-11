import dotenv from "dotenv";
dotenv.config();

import http from "node:http";
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import open from "open";
import { setTimeout as wait } from "node:timers/promises";
import { fetch } from "undici";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read"
];

function base64url(input: Buffer | Uint8Array) {
  return Buffer.from(input).toString("base64").replace(/=/g, "")
    .replace(/\+/g, "-").replace(/\//g, "_");
}

async function pkce() {
  const verifier = base64url(crypto.randomBytes(64));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

async function getTokenWithPKCE(): Promise<{ access_token: string; refresh_token?: string }> {
  const { verifier, challenge } = await pkce();
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("scope", SCOPES.join(" "));

  await open(authUrl.toString());

  const code: string = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname === "/callback") {
        const returnedCode = url.searchParams.get("code");
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("Auth ok. Tab kann geschlossen werden.");
        server.close();
        returnedCode ? resolve(returnedCode) : reject(new Error("Kein Code"));
      }
    });
    server.listen(8888, "127.0.0.1");
  });

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID, grant_type: "authorization_code",
      code, redirect_uri: REDIRECT_URI, code_verifier: verifier
    })
  });
  if (!tokenRes.ok) throw new Error(`Token-Error: ${tokenRes.status} ${await tokenRes.text()}`);
  return tokenRes.json() as any;
}

async function fetchAll<T>(url: string, accessToken: string): Promise<T[]> {
  const items: T[] = [];
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.status === 429) { const retry = Number(res.headers.get("Retry-After") ?? "1"); await wait((retry + 1) * 1000); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    items.push(...(data.items ?? []));
    url = data.next ?? "";
  }
  return items;
}

type Playlist = { id: string; name: string; tracks: { href: string; total: number } };
type PlaylistItem = {
  added_at: string;
  track: {
    id: string | null;
    name: string;
    duration_ms: number;
    explicit: boolean;
    uri: string;
    external_urls?: { spotify?: string };
    external_ids?: { isrc?: string };
    album?: { id?: string; name?: string; release_date?: string };
    artists?: Array<{ id?: string; name: string }>;
  } | null;
};

function sanitize(name: string) {
  return name.replace(/[^\w\-]+/g, "_").slice(0, 80);
}

async function exportAll() {
  if (!CLIENT_ID) throw new Error("Setze SPOTIFY_CLIENT_ID in der Umgebung.");

  const { access_token } = await getTokenWithPKCE();

  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!meRes.ok) throw new Error(`/me: ${meRes.status} ${await meRes.text()}`);
  const me = await meRes.json() as { display_name?: string; id: string };
  console.log(`Angemeldet als ${me.display_name ?? me.id} (${me.id})`);

  const playlists = await fetchAll<Playlist>(
    "https://api.spotify.com/v1/me/playlists?limit=50",
    access_token
  );

  await mkdir("export", { recursive: true });

  const exportIndex: Array<{ id: string; name: string; file: string }> = [];

  for (const p of playlists) {
    console.log(`→ ${p.name} (${p.tracks.total} Titel)`);
    const items = await fetchAll<PlaylistItem>(
      `https://api.spotify.com/v1/playlists/${p.id}/tracks?limit=100&market=from_token`,
      access_token
    );

    const simplified = items.filter(it => it.track).map(it => {
      const t = it.track!;
      return {
        added_at: it.added_at,
        id: t.id,
        name: t.name,
        duration_ms: t.duration_ms,
        explicit: t.explicit,
        isrc: t.external_ids?.isrc,
        album: { id: t.album?.id, name: t.album?.name, release_date: t.album?.release_date },
        artists: (t.artists ?? []).map(a => ({ id: a.id, name: a.name })),
        spotify_uri: t.uri,
        spotify_url: t.external_urls?.spotify
      };
    });

    const out = { playlist: { id: p.id, name: p.name, total: p.tracks.total }, tracks: simplified };
    await writeFile(`export/${sanitize(p.name)}.json`, JSON.stringify(out, null, 2), "utf8");
    exportIndex.push({ id: p.id, name: p.name, file: `export/${sanitize(p.name)}.json` });
  }

  await writeFile("export/index.json", JSON.stringify(exportIndex, null, 2), "utf8");
  console.log(`Fertig. ${playlists.length} Playlists exportiert nach ./export/`);
}

exportAll().catch(err => { console.error(err); process.exit(1); });
