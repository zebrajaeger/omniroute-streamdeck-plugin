# Verification: quota-key-display

## Automated scenario mapping

| New spec scenario | Evidence |
| --- | --- |
| Show two accounts independently | `quota-renderer.test.ts`: assigned accounts; `actions/quota-display.test.ts`: independent initial values |
| Reappear after background updates | `actions/quota-display.test.ts`: hidden and reappearing keys, same-context in-flight writes |
| Codex session and weekly values | `quota-renderer.test.ts`: assigned accounts with 84%/76% |
| Non-Codex windows and overflow | `quota-renderer.test.ts`: generic codepoint sorting, colliding labels, +1 |
| Unlimited, unknown and exhausted | `quota-renderer.test.ts`: generic windows with ∞, ?, 0% |
| Unassigned action | `quota-renderer.test.ts`: table of configuration/error priorities |
| Selected connection disappears | `quota-renderer.test.ts`: successful snapshot missing selected ID |
| Authentication failure without previous data | `quota-renderer.test.ts`: authentication row; existing client 401/403 classification tests |
| Preserve data during a transient outage | `actions/quota-display.test.ts`: shared service stale/recovery; renderer stale error table |
| Switch instance while old data exists | `actions/quota-display.test.ts`: instance change clears images to Laden before response |
| Hidden key stops rendering | `actions/quota-display.test.ts`: disappearance, hidden settings, pending title cancellation |

Additional tests cover exact SVG output, XML escaping, protected value column, ordering of slow SDK writes, duplicate suppression, removed-key failure isolation and a single shared request/timer sequence. Action identity and Inspector/controller metadata remain unchanged; manifest diff changes only the Quota tooltip.

## Local checks

- `npm test`: 37/37 passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed, including runtime dependency packaging.

## Live checks

User-assisted hardware verification completed on 2026-10-05. Stream Deck Developer Tools were opened by the user and confirmed through the local Developer Tools target list; the existing Rollup watch process was confirmed running.

The user explicitly confirmed:
- Independent values for two accounts and correct profile/assignment changes, including the lifecycle of hidden keys.
- Readable 72×72 output with long labels, two windows, +N, ∞ and ?, without clipped values.
- Controlled Offline/Auth/Recovery states with correct error/stale markers, leaving real provider configuration unchanged.

These are user-observed results, not agent-observed hardware checks. The read-only Node inspector attempt failed to import the module (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`); its temporary script was removed and it changed no global settings or provider configuration. The single polling sequence and sanitized image/log paths are additionally covered by automated tests and source inspection.

- `streamdeck validate`: passed.
- `openspec validate quota-key-display --strict`: passed.
