# VikiSize Life Assistant Agent Implementation Spec

## Status

- Stage: Agent-ready implementation spec
- Source PRD: GitHub Issue #1, `PRD: VikiSize personal life assistant MVP`
- Product spec: `vikisize-life-assistant-mvp.md`
- Target runtime: WeChat Mini Program
- First complete scenario: Travel Team
- First travel template source: `关东东京8天旅行计划.html`

## Goal

Implement the first production-oriented VikiSize personal life assistant MVP so another agent can move directly from spec to code.

The implementation must transform the current mini program from an early VikiSize shell into a collaborative life assistant centered on:

- Life Spaces.
- Today / Plans / Life / Decisions navigation.
- Owner / Member / Guest permissions.
- Shared Item Cards.
- WeChat login, cloud data, share-card invitations, and WeChat reminders.
- A Travel Team MVP backed by a structured Tokyo 8-day travel template.

The first version does not include AI features.

## Current Repo State

The current mini program already exists and has:

- A basic app shell.
- Existing pages for home, services, travel, records, and profile.
- Existing tab bar labels that still reflect an older product direction.
- Local seed data containing the Tokyo travel plan.
- A static HTML prototype used as design input.

The implementation should reuse visual patterns and existing travel content where useful, but the product structure must follow this spec rather than the older shell.

## Implementation Strategy

Use one top-level product seam: the current-space user journey.

The follow-up implementation should make this journey work end to end:

1. User opens the mini program and resolves a WeChat identity.
2. User creates or enters a Life Space.
3. User creates a Travel Team space from the Tokyo template.
4. User sees Today, Plans, Life, and Decisions.
5. User edits Travel Team itinerary cards.
6. User invites another member through a WeChat share card.
7. Owner and Member can edit; Guest can only view.
8. Assigned, due-soon, and needs-confirmation reminders are recorded and dispatched through the WeChat reminder path.
9. User archives completed plans or cards.

Avoid implementing isolated feature islands that do not participate in this journey.

## App Navigation

Replace the current primary navigation with four tabs:

- Today
- Plans
- Life
- Decisions

Do not keep Profile as a bottom tab. Profile, settings, member management, and space switching should be reachable from the current-space header or a top-right menu.

Recommended page set:

- Today page: current space summary, pending work, reminders, recent activity.
- Plans page: Travel Team MVP, itinerary, tasks, budget, archive entry.
- Life page: shared recipes, grocery lists, chores, and basic cards.
- Decisions page: purchase decisions, price records, target-price reminders.
- Space switch/create page: create spaces and choose templates.
- Space settings page: members, role management, invite action.
- Card detail page: edit card, comments, activity, attachments, opinions.
- Travel plan instance page: D1-D8 itinerary detail for a Travel Team space.

The exact file layout can follow local mini program conventions, but these routes must exist as user-facing flows.

## Core Domain Model

### User

Purpose: represent a WeChat-authenticated person.

Required fields:

- `id`
- `openid`
- `displayName`
- `avatarUrl`
- `createdAt`
- `updatedAt`

### Life Space

Purpose: collaboration boundary for a trusted small group.

Required fields:

- `id`
- `name`
- `templateType`: `family_life | travel_team | purchase_decision | blank`
- `ownerUserId`
- `currentTemplateInstanceId`
- `createdAt`
- `updatedAt`
- `archivedAt`

### Space Member

Purpose: role and membership record.

Required fields:

- `id`
- `spaceId`
- `userId`
- `role`: `owner | member | guest`
- `invitedBy`
- `joinedAt`
- `createdAt`
- `updatedAt`

### Item Card

Purpose: the shared work object across Plans, Life, and Decisions.

Required fields:

```js
{
  id: string,
  spaceId: string,
  module: "plans" | "life" | "decisions",
  title: string,
  description: string,
  ownerUserId: string,
  participantUserIds: string[],
  status: "todo" | "in_progress" | "pending_confirmation" | "done",
  dueAt: string | null,
  reminderAt: string | null,
  createdBy: string,
  createdAt: string,
  updatedAt: string,
  archivedAt: string | null
}
```

Module-specific fields should be stored in a structured `details` field or related records:

- Plan details: date, time, location, route, transport, booking, budget estimate.
- Life details: checklist items, quantities, grocery owner, recipe or prep notes.
- Decision details: target price, current price, final price, candidates, member opinions.

### Comment

Required fields:

- `id`
- `spaceId`
- `cardId`
- `authorUserId`
- `body`
- `createdAt`
- `deletedAt`

### Activity

Required fields:

- `id`
- `spaceId`
- `cardId`
- `actorUserId`
- `type`
- `summary`
- `createdAt`

Record activity for:

- Owner changes.
- Due date changes.
- Budget changes.
- Status changes.
- Itinerary node creation, edit, and deletion.
- Archive and unarchive.
- Permission changes.
- Member opinion changes.

### Reminder

Required fields:

- `id`
- `spaceId`
- `cardId`
- `recipientUserId`
- `type`: `assigned_to_me | due_soon | needs_confirmation`
- `scheduledAt`
- `status`: `pending | sent | failed | cancelled`
- `wechatTemplateId`
- `createdAt`
- `updatedAt`

Only these three reminder types are in scope for the first version.

### Attachment

Required fields:

- `id`
- `spaceId`
- `cardId`
- `uploadedBy`
- `cloudFileId`
- `mimeType`
- `createdAt`

Only image attachments are in scope. Limit each card to a small number of images, such as 9.

### Member Opinion

Required fields:

- `id`
- `spaceId`
- `cardId`
- `userId`
- `value`
- `createdAt`
- `updatedAt`

Allowed values should be module-appropriate:

- Travel: `agree | unavailable | undecided`
- Decision: `support | oppose | watching`
- Life: `want | do_not_want | neutral`

### Travel Template

Purpose: read-only source for built-in Travel Team templates.

Required fields:

- `id`
- `name`
- `sourceName`
- `version`
- `days`
- `createdAt`

For the first implementation, the authoritative source is `关东东京8天旅行计划.html`.

### Travel Plan Instance

Purpose: editable copy created inside a Life Space from a Travel Template.

Required fields:

- `id`
- `spaceId`
- `sourceTemplateId`
- `sourceName`
- `sourceVersion`
- `importedAt`
- `initialSnapshot`
- `days`
- `createdAt`
- `updatedAt`
- `archivedAt`

Owner and Member can edit the instance. Guest is read-only.

Do not implement template diff, one-click restore, automatic template update, or existing-instance sync in the first version.

## Cloud Collections

Use WeChat Cloud Database collections matching the domain model:

- `users`
- `spaces`
- `space_members`
- `cards`
- `comments`
- `activities`
- `reminders`
- `attachments`
- `member_opinions`
- `travel_templates`
- `travel_plan_instances`
- `invitations`

Collection names can be adjusted to local conventions, but the implementation must preserve the model boundaries.

## Cloud Functions

Create cloud-function boundaries for behavior that must not rely on client trust:

- `login`: resolve WeChat identity and create or update a user.
- `createSpace`: create a Life Space from a selected template.
- `createTravelInstanceFromTemplate`: copy the Tokyo template into an editable travel-plan instance.
- `createInvitation`: create a share-card invitation token.
- `acceptInvitation`: validate token and join the space with the intended role.
- `assertPermission`: shared permission helper or internal function used by write operations.
- `upsertCard`: create or edit an Item Card.
- `archiveCard`: archive or unarchive a card.
- `addComment`: create a comment and related activity.
- `setMemberOpinion`: create or update an opinion and related activity.
- `scheduleReminder`: create reminder records for the three supported reminder types.
- `dispatchReminders`: send due WeChat subscription messages and update reminder status.

If local development lacks real WeChat cloud credentials, keep the function interfaces stable and provide local seed adapters for manual preview, but do not replace the production design with local-only state.

## Permission Rules

Client UI should hide or disable actions the current user cannot perform, but cloud functions must enforce permissions.

Rules:

- Owner can manage members, edit all content, archive spaces, and delete spaces if deletion is implemented.
- Member can create and edit cards, travel-plan instance content, comments, attachments, reminders, and opinions.
- Guest can view allowed space content only.
- Guest cannot create, edit, delete, comment, be assigned, receive reminders, upload attachments, or invite members.
- Owners and Members can edit Travel Plan Instances.
- Key edits must create Activity records.

## Travel Team MVP Requirements

The Travel Team template is the first complete path.

Required views inside the current Travel Team space:

- Today: today's itinerary, pending confirmations, due reminders.
- Itinerary: D1-D8 day-by-day schedule.
- Tasks: tickets, hotels, transport, restaurants, packing, and confirmations.
- Budget: total budget, estimated cost, confirmed cost, and decision-related price records.
- Activity: comments, opinions, card changes, archive records.

The Tokyo template must be structured into:

- Built-in template name: `关东东京 8 天旅行小队`.
- D1-D8 itinerary records.
- Itinerary nodes with time, location, route or transport, booking info, and notes.
- Task cards for tickets, hotels, transport, restaurants, packing, and confirmations.
- Budget categories: transport, lodging, food, tickets, shopping, contingency.
- Reminder suggestions: departure, reservations, transfers, pending confirmations.
- Archive-ready travel history after completion.

## Implementation Phases

### Phase 1: Shell and Navigation

- Replace tab bar labels with Today, Plans, Life, Decisions.
- Add current-space header and space switch entry.
- Keep the app visually restrained and scannable.
- Preserve existing preview pages only if they do not conflict with the MVP navigation.

Acceptance:

- User can open all four primary tabs.
- The UI no longer presents the older Size/Services/Records/Profile product as the main experience.

### Phase 2: Local Domain Layer and Seed Data

- Add domain constants for roles, modules, statuses, templates, reminder types, and opinion values.
- Convert existing Tokyo travel content into structured seed data matching the Travel Template model.
- Add local repositories or adapters that mimic the cloud collections for initial UI development.

Acceptance:

- The app can create a local Travel Team space from the Tokyo template.
- The created instance is editable separately from the read-only template source.

### Phase 3: Life Spaces and Permissions

- Implement creating and switching spaces.
- Implement Owner, Member, and Guest role checks.
- Implement invitation flow UI and token-based entry path.

Acceptance:

- Owner and Member can edit.
- Guest can view but cannot mutate.
- Permission denial is handled clearly in UI and write APIs.

### Phase 4: Item Cards

- Implement cards across Plans, Life, and Decisions.
- Implement card detail, status changes, assignment, participant list, due date, reminder time, comments, activity, attachments, opinions, archive, and unarchive.

Acceptance:

- A single card implementation works across all three modules.
- Module-specific fields do not fork the core card behavior.

### Phase 5: Travel Team Full Loop

- Implement Travel Team views: Today, Itinerary, Tasks, Budget, Activity.
- Support editing D1-D8 itinerary nodes.
- Support task cards generated from the Tokyo template.
- Support travel budget categories and summaries.
- Support archiving a completed travel plan.

Acceptance:

- A user can create the Tokyo Travel Team space and complete the main planning flow without leaving the app.

### Phase 6: WeChat Cloud and Reminders

- Wire cloud database collections.
- Implement cloud functions.
- Implement WeChat subscription-message authorization.
- Implement reminder scheduling and dispatch for assigned-to-me, due-soon, and needs-confirmation.

Acceptance:

- Reminder records are created for supported cases.
- Due reminder dispatch updates reminder status.
- Comment-only changes do not create WeChat reminders.

## Testing Spec

Test external behavior through the highest practical seam: mini program user flows plus cloud-function contracts.

Required checks:

- JSON config remains valid.
- Required pages are registered in app config.
- User identity can be resolved.
- Space creation works for all four templates.
- Creating from the Tokyo template creates a separate editable Travel Plan Instance.
- Template source remains read-only.
- Owner and Member writes succeed.
- Guest writes fail.
- Invitation token joins the correct space with the intended role.
- Card status can move only through allowed statuses.
- Comments create Activity.
- Key edits create Activity.
- Image attachment limit is enforced.
- Current-space search excludes other spaces.
- Archive removes content from Today by default.
- Unarchive restores active visibility.
- Reminder records are created only for assigned-to-me, due-soon, and needs-confirmation.
- AI entry points are absent.

If WeChat Developer Tools CLI is unavailable, report that limitation and provide manual validation steps rather than pretending the build was verified.

## Non-Goals

Do not implement:

- AI features.
- Real-time co-editing.
- Live cursors or online presence.
- Complex per-card custom permissions.
- Public communities.
- Template marketplace.
- Full accounting.
- Complex cost splitting.
- Automatic bill recognition.
- Automatic price scraping.
- Complex charts.
- Investment analysis.
- External booking or ordering.
- Payment.
- Phone, password, or email account login.
- PDF, Word, Excel, video, OCR, image annotation, or large file management.
- Anonymous voting, weighted voting, vote deadlines, or complex counting.
- Full audit-log export.
- Field-level diff.
- Version restoration.
- Template-instance full diff.
- One-click restore from template.
- Automatic template updates.
- Existing-instance template sync.
- Cross-space search.

## Follow-Up Agent Prompt

```text
Implement the VikiSize life assistant MVP from docs/specs/vikisize-life-assistant-agent-spec.md.

Use the existing mini program as the starting point, but replace the old shell product direction with the Life Spaces model and Today / Plans / Life / Decisions navigation.

Build the Travel Team flow first. Treat 关东东京8天旅行计划.html as the source for a read-only Tokyo travel template, and create editable per-space Travel Plan Instances from it. Owner and Member can edit; Guest is read-only. Keep WeChat login, cloud collections, cloud functions, invitations, reminders, comments, activity, attachments, budget records, member opinions, archive, and search aligned with the spec.

Do not add AI features or any non-goals listed in the spec.

Validate JSON config, required pages, permission behavior, template-to-instance creation, card flows, reminders, archive behavior, and the absence of AI entry points. Report whether WeChat Developer Tools CLI is available.
```
