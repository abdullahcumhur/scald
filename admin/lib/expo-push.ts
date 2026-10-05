// Scald Coffee admin panel — Expo Push API'sine bildirim gönderme helper'ı.
//
// `app/api/send-notification/route.ts` (kampanya broadcast) ve
// `app/api/notify-order-status/route.ts` (tek kullanıcıya sipariş durumu
// bildirimi) tarafından ortak kullanılır. Token'ları 100'lük gruplara
// bölüp `https://exp.host/--/api/v2/push/send`'e POST atar.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_CHUNK_SIZE = 100;

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
};

type ExpoPushTicket = {
  status: "ok" | "error";
  message?: string;
  id?: string;
};

type ExpoPushResponse = {
  data?: ExpoPushTicket[];
  errors?: unknown[];
};

export type SendExpoPushResult = {
  sent: number;
  failed: number;
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function sendExpoPushNotifications(
  tokens: string[],
  title: string,
  body: string
): Promise<SendExpoPushResult> {
  let sent = 0;
  let failed = 0;

  for (const tokenChunk of chunk(tokens, EXPO_PUSH_CHUNK_SIZE)) {
    const messages: ExpoPushMessage[] = tokenChunk.map((to) => ({
      to,
      title,
      body,
      sound: "default",
    }));

    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!expoResponse.ok) {
      failed += tokenChunk.length;
      continue;
    }

    const result = (await expoResponse.json()) as ExpoPushResponse;
    const tickets = result.data ?? [];

    if (tickets.length === 0) {
      failed += tokenChunk.length;
      continue;
    }

    for (const ticket of tickets) {
      if (ticket.status === "ok") {
        sent += 1;
      } else {
        failed += 1;
      }
    }
  }

  return { sent, failed };
}
