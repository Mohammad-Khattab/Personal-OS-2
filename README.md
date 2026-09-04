# MKHUB — Personal OS

A local-first personal dashboard built with React 19, Vite, and Supabase. Everything works offline against `localStorage` by default, with optional sync to a Supabase Postgres backend secured by row-level security policies.

## Features

- **Finance** — track income, expenses, and balances
- **Tasks** — a personal task manager
- **Notes** — freeform note-taking
- **Lists** — watchlists for games, anime, and movies
- **Certs** — a certification roadmap tracker
- **Subscriptions** — recurring payment tracker
- **Places** — a places-to-visit list
- **Password Vault** — client-side AES-GCM encrypted credential storage
- **Gmail widget** — inbox preview via a user-supplied Google OAuth client
- **Voice assistant** — Claude-powered assistant using a user-supplied Anthropic API key, kept in browser `localStorage` only

## Tech stack

- React 19 + Vite
- Supabase (Postgres + Row Level Security) for optional cloud sync
- Web Crypto API (AES-GCM) for the password vault

## Security notes

- The Supabase anon key and Google OAuth client ID are meant to be public client-side values — access control is enforced by Supabase RLS policies (see `supabase-schema.sql`), not by keeping these values secret.
- The Anthropic API key and Gmail token are entered by the user at runtime and stored only in the browser's `localStorage` — never committed to source or sent anywhere but their intended API.

## Local setup

```bash
npm install
cp .env.example .env   # fill in your own Supabase project URL/anon key
npm run dev
```

## Deployment

Configured for Vercel; see `vercel.json`.
