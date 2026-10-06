# API route conventions

All application endpoints use the `/api/v1` prefix. Resource names are plural,
lowercase, and kebab-cased when they contain multiple words.

Examples:

- `/api/v1/teams`
- `/api/v1/team-members/:teamId`
- `/api/v1/schedules/:scheduleId`
- `/api/v1/dept-charts/:teamId`

Static paths must be declared before parameter paths at the same router level.
For example, `/teams/active-team-count` precedes `/teams/:teamId`, and
`/profiles/search` precedes `/profiles/:id`.

Schedule create, update, cancel, and delete operations all use the plural
`/schedules` resource path.

## Mobile endpoint inventory

| Mobile client | API prefix |
| --- | --- |
| `api/auth.ts` | `/api/v1/auth` |
| `api/profile.ts` | `/api/v1/profiles` |
| `api/teams.ts` | `/api/v1/teams` |
| `api/teamMembers.ts` | `/api/v1/team-members` |
| `api/schedule.ts` | `/api/v1/schedules` |
| `api/practices.ts` | `/api/v1/practices` |
| `api/notification.ts` | `/api/v1/notifications` |
| `api/invites.ts` | `/api/v1/invites` |
| `api/deptCharts.ts` | `/api/v1/dept-charts` |
| `api/sports.ts` | `/api/v1/sports` |
