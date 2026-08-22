import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function resolveCreds(input?: { clientId?: string; clientSecret?: string }) {
  const clientId = input?.clientId || process.env.STRAVA_CLIENT_ID || "";
  const clientSecret = input?.clientSecret || process.env.STRAVA_CLIENT_SECRET || "";
  return { clientId, clientSecret };
}

export const getStravaConfig = createServerFn({ method: "GET" }).handler(async () => {
  const clientId = process.env.STRAVA_CLIENT_ID ?? "";
  return {
    enabled: Boolean(clientId),
    clientId,
  };
});

export const exchangeStravaCode = createServerFn({ method: "POST" })
  .validator(
    z.object({
      code: z.string().min(1),
      redirectUri: z.string().url(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientSecret } = resolveCreds(data);
    if (!clientId || !clientSecret) {
      return { ok: false as const, error: "Add your Strava API Client ID and Secret in You → Integrations." };
    }
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: data.code,
      grant_type: "authorization_code",
    });
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      athlete?: { id?: number; firstname?: string; lastname?: string };
      message?: string;
    };
    if (!res.ok || !json.access_token || !json.refresh_token) {
      return { ok: false as const, error: json.message ?? "Strava login failed." };
    }
    return {
      ok: true as const,
      account: {
        athleteId: json.athlete?.id ?? 0,
        athleteName: [json.athlete?.firstname, json.athlete?.lastname].filter(Boolean).join(" "),
        accessToken: json.access_token,
        refreshToken: json.refresh_token,
        expiresAt: json.expires_at ?? 0,
      },
    };
  });

async function refreshIfNeeded(
  clientId: string,
  clientSecret: string,
  access: string,
  refresh: string,
  expiresAt: number,
) {
  if (!clientId || !clientSecret || expiresAt * 1000 >= Date.now() + 30_000) {
    return { access, refresh, expiresAt };
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  const refreshed = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await refreshed.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
  if (!refreshed.ok || !json.access_token) return { access, refresh, expiresAt };
  return {
    access: json.access_token,
    refresh: json.refresh_token ?? refresh,
    expiresAt: json.expires_at ?? expiresAt,
  };
}

export const stravaCreateActivity = createServerFn({ method: "POST" })
  .validator(
    z.object({
      accessToken: z.string().min(1),
      refreshToken: z.string().min(1),
      expiresAt: z.number(),
      name: z.string(),
      elapsedSec: z.number(),
      description: z.string(),
      startDate: z.string(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientSecret } = resolveCreds(data);
    const tokens = await refreshIfNeeded(
      clientId,
      clientSecret,
      data.accessToken,
      data.refreshToken,
      data.expiresAt,
    );
    const form = new URLSearchParams({
      name: data.name,
      sport_type: "WeightTraining",
      elapsed_time: String(Math.max(1, Math.round(data.elapsedSec))),
      description: data.description.slice(0, 4000),
      start_date_local: data.startDate,
    });
    const res = await fetch("https://www.strava.com/api/v3/activities", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.access}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const json = (await res.json()) as { id?: number; message?: string };
    if (!res.ok) {
      return { ok: false as const, error: json.message ?? "Could not post to Strava." };
    }
    return {
      ok: true as const,
      activityId: json.id,
      account: {
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        expiresAt: tokens.expiresAt,
      },
    };
  });

export const stravaListActivities = createServerFn({ method: "POST" })
  .validator(
    z.object({
      accessToken: z.string().min(1),
      refreshToken: z.string().min(1),
      expiresAt: z.number(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientSecret } = resolveCreds(data);
    const tokens = await refreshIfNeeded(
      clientId,
      clientSecret,
      data.accessToken,
      data.refreshToken,
      data.expiresAt,
    );
    const res = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=40", {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });
    const json = (await res.json()) as
      | {
          id: number;
          name: string;
          type?: string;
          sport_type?: string;
          elapsed_time: number;
          start_date?: string;
          start_date_local?: string;
        }[]
      | { message?: string };
    if (!res.ok || !Array.isArray(json)) {
      const err = Array.isArray(json) ? "Could not load Strava activities." : (json.message ?? "Could not load Strava activities.");
      return { ok: false as const, error: err };
    }
    return {
      ok: true as const,
      account: {
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        expiresAt: tokens.expiresAt,
      },
      activities: json.map((a) => ({
        id: a.id,
        name: a.name,
        sport: a.sport_type ?? a.type ?? "Workout",
        elapsedSec: a.elapsed_time,
        start: a.start_date_local ?? a.start_date ?? "",
      })),
    };
  });
