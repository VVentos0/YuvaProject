# YUVA Migration Simulation - 2026-05-22

This documents the pre-format migration rehearsal for moving YUVA to a fresh Ubuntu 24.04 VDS.

## Scope

The simulation tested the risky parts of a VDS replacement without touching the live production containers or production MongoDB volume:

- Build the app from the current Git commit.
- Start a clean Docker Compose stack with a brand-new MongoDB volume.
- Restore the current MongoDB archive backup into that clean volume.
- Verify the restored app behavior through local-only ports.
- Remove the isolated simulation stack afterward.

The simulation was run on the current VDS because the local Windows machine does not have Docker installed.

## Inputs Used

Backup archive:

```text
/home/admin/backups/yuva/yuva-20260522T110131Z.archive
```

Local backup copy:

```text
C:\Users\VVentos\Desktop\YUVA_VDS_BACKUPS\yuva-20260522T110131Z.archive
```

Backup SHA-256:

```text
c57c45ff95f17cac61ae6b5716fb860fafb6e77fe654c93cdc5da8604820b58e
```

Simulation isolation:

```text
Compose project: yuva-migration-sim
App port:        127.0.0.1:3300 -> 3000
Mongo port:      127.0.0.1:27018 -> 27017
Mongo volume:    yuva-migration-sim_mongo-data
```

The simulation used generated throwaway `.env` secrets, not production secrets.

## Results

Docker build:

```text
PASS
```

App health before restore:

```json
{"ok":true,"db":"connected"}
```

Restore result:

```text
65 document(s) restored successfully. 0 document(s) failed to restore.
```

Restored collection counts:

```json
{"letters":47,"chatMessages":18,"chatPresence":0,"chatBans":0,"blockedIps":0}
```

App checks after restore:

```text
PASS health:                 200 {"ok":true,"db":"connected"}
PASS public letters:         200, returned restored letter metadata
PASS short letter validation:400 {"error":"Letter body must be at least 500 characters"}
PASS Socket.IO client:       200
PASS database login page:    200, returned Yuva Database login HTML
PASS admin letters API:      200 with Basic Auth on database.yuvarchive.com host
```

Cleanup:

```text
PASS simulation containers removed
PASS simulation MongoDB volume removed
PASS simulation source tar removed
PASS simulation directory removed
```

## Finding Fixed

The simulation found that the deploy docs used an outdated `x-admin-token` example for admin letter reads. The current server code requires admin authentication by Basic Auth or login cookie, and the admin routes only respond on the `database.yuvarchive.com` host.

Docs were updated to use:

```bash
curl --user "ADMIN_USERNAME:ADMIN_PASSWORD" "https://database.yuvarchive.com/api/admin/letters?limit=1"
```

## Remaining Real-Cutover Risks

These cannot be fully simulated without the new VDS and DNS cutover:

- The new provider firewall may block SSH, 80, or 443 until opened.
- Cloudflare DNS must point `yuvarchive.com`, `www.yuvarchive.com`, and `database.yuvarchive.com` to the new IP.
- Certbot may require Cloudflare records to be temporarily DNS-only if HTTP validation fails.
- GitHub repository secrets must be updated for the new IP, user, SSH port, deploy key, and optional project directory.

The Docker build, clean Mongo restore, app health, public API, admin/database route behavior, Socket.IO serving, and 500-character validation were all verified in the isolated simulation.
