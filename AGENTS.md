<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep private application pages under the shared `_authenticated` layout; it validates the user before loading so private data never flashes on public pages.
- Store names and preferences in profiles, and purpose-scoped records in management_entries with owner-only RLS; this preserves privacy across accounts and purpose switches.
- Keep management definitions and calculations in src/lib/management.ts and private operations in authenticated server functions; shared validation stays independently testable.
- Preserve /panel as a separate project view so existing story progress is not mixed with general administration records.
- Keep AI advice purpose-scoped and owner-readable; send aggregate indicators instead of customer records to reduce disclosure.
- Use request-local OpenAI Responses helpers in server-only modules and persist terminal access blocks so reloads cannot replay denied calls.
- Generate management PDFs from data and chart captures in the browser; prepare before download to preserve mobile activation.
- Keep appearance in a shared provider using semantic CSS tokens; automatic accents follow the active management type and manual appearance preferences persist on the device.
- Emit custom analytics only in successful action handlers; use built-in page views and engagement for panel usage to avoid double counting.
