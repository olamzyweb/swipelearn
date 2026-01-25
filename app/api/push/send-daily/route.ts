import webpush from "web-push";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@swipelearn.com";
const cronSecret = process.env.REMINDER_CRON_SECRET ?? "";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "Missing server env" }, { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.from("push_subscriptions").select("subscription");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = JSON.stringify({
    title: "Swiple",
    body: "Keep your streak alive today.",
    url: "/learn"
  });

  let sent = 0;
  let failed = 0;

  for (const row of data ?? []) {
    try {
      await webpush.sendNotification(row.subscription, payload);
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ sent, failed });
}
