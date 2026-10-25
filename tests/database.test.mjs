import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const base = new URL("../supabase/", import.meta.url);
test("SQL upgrade preserves rows and enforces roles, event policy and rate limit", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated,service_role;`);
    const original = readFileSync(
      new URL("neodat-schema.sql", base),
      "utf8",
    ).replace("create extension if not exists pgcrypto;", "");
    await db.exec(original);
    const admin = "00000000-0000-4000-8000-000000000001",
      other = "00000000-0000-4000-8000-000000000002";
    await db.exec(`insert into auth.users values ('${admin}'),('${other}'); insert into public.admin_users(user_id) values ('${admin}');
      insert into public.contact_leads(name,email,message) values ('Existing lead','test@example.com','Keep this');`);
    const hardening = readFileSync(new URL("hardening.sql", base), "utf8");
    await db.exec(hardening);
    await db.exec(hardening);
    assert.equal(
      (await db.query("select count(*)::int as count from contact_leads"))
        .rows[0].count,
      1,
    );
    await db.exec("set role anon");
    await assert.rejects(db.exec("select * from contact_leads"));
    await assert.rejects(
      db.exec(
        "insert into contact_leads(name,email,message) values ('Bad','a@b.com','test')",
      ),
    );
    await assert.rejects(
      db.exec("select public.claim_contact_slot(repeat('a',64))"),
    );
    const event = (type, conversion = false) =>
      `insert into analytics_events(event_type,visitor_id,session_id,device_type,screen_width,is_conversion) values ('${type}','visitor_123456789','session_123456789','Móvil',360,${conversion})`;
    await db.exec(event("page_engagement"));
    await db.exec(event("outbound_click"));
    await assert.rejects(db.exec(event("unknown")));
    await assert.rejects(db.exec(event("meeting_click", true)));
    await db.exec(
      `reset role; set request.jwt.claim.sub='${other}'; set role authenticated;`,
    );
    assert.equal(
      (await db.query("select * from contact_leads")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from analytics_events")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from financial_transactions")).rows.length,
      0,
    );
    await db.exec(
      `reset role; set request.jwt.claim.sub='${admin}'; set role authenticated;`,
    );
    assert.equal(
      (await db.query("select * from contact_leads")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from analytics_events")).rows.length,
      2,
    );
    await db.exec("reset role; set role service_role");
    for (let i = 0; i < 7; i++)
      assert.equal(
        (await db.query("select claim_contact_slot(repeat('a',64)) as ok"))
          .rows[0].ok,
        i < 5,
      );
    await db.exec(
      "insert into contact_leads(name,email,message,request_id) values ('Test','test@example.com','Hello','00000000-0000-4000-8000-000000000003') on conflict(request_id) do nothing;",
    );
    await db.exec(
      "insert into contact_leads(name,email,message,request_id) values ('Test','test@example.com','Hello','00000000-0000-4000-8000-000000000003') on conflict(request_id) do nothing;",
    );
    assert.equal(
      (await db.query("select count(*)::int as count from contact_leads"))
        .rows[0].count,
      2,
    );
  } finally {
    await db.close();
  }
});
