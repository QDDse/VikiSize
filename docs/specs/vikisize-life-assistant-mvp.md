# VikiSize Life Assistant Mini Program MVP Spec

## Status

- Stage: Product spec
- Owner: Codex / follow-up implementation agent
- Target runtime: WeChat Mini Program
- Primary data source for first travel template: `关东东京8天旅行计划.html`
- Related prototype: `wechat-mini-program-ui.html`

## Product Positioning

VikiSize should become a personal life assistant mini program for small trusted groups. The first version should focus on real collaboration around daily life plans, shared household work, and purchase decisions.

The target collaboration group is a close 2-6 person group such as family, partners, friends, travel companions, or housemates.

## First Version Principles

- Build a usable collaborative product, not a static preview.
- Make the first shipped scope small enough to implement and validate.
- Prioritize shared travel planning as the first complete scenario.
- Keep the three main modules unified by one shared card model.
- Do not include AI features in the first version.
- Use WeChat-native identity, sharing, and reminder capabilities.

## Main Modules

The app has three primary modules:

- Shared Plans: travel plans, weekend plans, household projects, archived plans.
- Shared Life: recipes, grocery lists, meal prep, chores, shared todos.
- Shared Decisions: price records, target-price reminders, purchase options, member opinions.

The bottom navigation should use four tabs:

- Today
- Plans
- Life
- Decisions

Personal profile, space settings, and member management should be accessed from the current space switcher or the top-right entry, not as a primary bottom tab.

## Collaboration Unit

The base collaboration unit is a Life Space.

Examples:

- Family Life
- Tokyo Travel Team
- Shared Apartment
- Fitness Meal Prep Group
- Purchase Decision Group

Each space contains the same three modules: Shared Plans, Shared Life, and Shared Decisions. The Today page shows the current space's actionable work first.

The first version must support:

- Creating multiple spaces.
- Switching the current space.
- Showing Today content only for the current space.
- Creating a space from built-in templates.

The first version does not need cross-space search or a template marketplace.

## Built-In Space Templates

Space creation should offer four options:

- Family Life
- Travel Team
- Purchase Decision
- Blank Space

The Travel Team template is the MVP priority and should be implemented as the first complete loop.

## Roles and Permissions

The first version uses three roles:

- Owner: manages members, archives or deletes spaces, edits all content, manages default reminders.
- Member: creates and edits plans, life cards, decision cards, comments, attachments, reminders, and member opinions.
- Guest: read-only access for selected shared content.

Guest users can view public cards in the invited space, including travel itinerary and grocery lists. Guests cannot create, edit, delete, comment, receive WeChat reminders, be assigned tasks, or invite other members.

## Invitation Flow

The first version should use WeChat Mini Program share-card invitations:

1. Owner or member taps Invite.
2. The mini program generates a share path containing `spaceId` and an invitation token.
3. The invitee opens the shared card from WeChat.
4. The invitee sees the space name, inviter, and proposed role.
5. The invitee taps Join Space.
6. The app opens the invited space's Today page.

The first version does not need phone-number invites, contact search, or public long-lived QR-code invitations.

## Unified Card Model

All three modules use a shared Item Card model.

Core fields:

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

Module-specific fields should extend this model instead of creating unrelated systems:

- Plan cards: date, time, location, route, budget estimate, responsible member.
- Life cards: checklist items, quantities, grocery owner, recipe or prep notes.
- Decision cards: target price, current price, final price, candidates, member opinions.

## Card Status Flow

The first version uses four card statuses:

- To Do
- In Progress
- Pending Confirmation
- Done

Do not add blocked, delayed, cancelled, risk, approval, or other fine-grained states in the first version. Module-specific differences should be represented by fields, not by separate status flows.

## Comments and Activity

The first version should include comments and lightweight activity records.

Required behavior:

- Each card can have comments.
- Space and card views show recent activity.
- Key operations are recorded, including owner changes, due-date changes, budget changes, status changes, deletion, archive, and permission changes.

The first version does not need field-level diff views, version restore, audit-log export, emoji reactions, or threaded replies.

## Reminders

The first version must support WeChat reminders for three high-value cases:

- Assigned to me.
- Due soon.
- Needs my confirmation.

Implementation should use WeChat login, subscription-message authorization, cloud database records, and cloud functions or scheduled jobs where needed.

Do not notify for every comment in the first version. That would create noise and make subscription-message handling harder.

## Authentication and Sync

The first version should use WeChat login plus WeChat Cloud Development.

Required backend capabilities:

- User identity from WeChat login.
- Cloud database storage for spaces, members, cards, comments, activities, reminders, attachments, templates, and template instances.
- Cloud functions for invitation validation, permission checks, archiving, and reminder dispatch.

The first version should not build a separate phone, password, or email account system.

## Search

The first version should support basic search inside the current space.

Search scope:

- Item cards.
- Plan titles.
- Recipe and list titles.
- Decision titles.

The first version does not need cross-space search, advanced filters, comment search, attachment search, or semantic search.

## Attachments

The first version should support image attachments on item cards.

Common uses:

- Menu photos.
- Shopping screenshots.
- Hotel or ticket screenshots.
- Price screenshots.

Constraints:

- Store images in WeChat cloud storage.
- Limit each card to a small number of images, such as 9.
- Do not support PDF, Word, Excel, video, OCR, annotation, or large file management in the first version.

## Budget and Cost Records

The first version should include lightweight budget and cost records for Plans and Decisions.

Required behavior:

- Travel plan total budget.
- Estimated cost on itinerary or task cards.
- Target price, current price, and final purchase price for decision cards.
- Simple summary of estimated total and confirmed cost.

The first version does not need daily accounting, assets, reimbursement, complex splitting, or automatic bill recognition.

## Member Opinions

The first version should support lightweight member opinions on cards that need confirmation.

Examples:

- Travel: agree, unavailable, undecided.
- Purchase decision: support, oppose, watching.
- Life arrangement: want, do not want, neutral.

Required behavior:

- A card can enable member opinions.
- Each member can select one opinion.
- The card shows an opinion summary.
- Opinion changes are recorded in activity.

The first version does not need anonymous voting, weighted voting, deadlines, or complex counting rules.

## Archive

The first version should support archiving for plans and cards.

Archived content:

- Completed travel plans.
- Completed life lists or recipe tasks.
- Completed purchase decisions.
- Inactive cards.

Archived content should not appear in Today by default. It should remain visible from the related module's Archived entry. Comments, activity, prices, participants, and attachments must be retained.

The first version should allow unarchiving, but does not need version restoration.

## Travel Team MVP

The Travel Team template is the first complete MVP scenario.

It should fully implement:

- Life spaces.
- Member invitation.
- Roles and guest access.
- Item cards.
- WeChat reminders.
- Comments.
- Lightweight activity.
- Image attachments.
- Budget records.
- Member opinions.
- Archive.

Other templates may be created in the first version, but can start with the base card model and minimal scenario-specific polish.

## Travel Team Views

Inside a Travel Team space, the first version should organize travel work through five views:

- Today: today's itinerary, pending confirmations, due reminders.
- Itinerary: day-by-day travel schedule, such as D1-D8.
- Tasks: hotels, tickets, routes, packing, reservations, and other preparation tasks.
- Budget: total budget, estimated cost, confirmed cost, and purchase decisions.
- Activity: comments, opinions, card changes, and archive records.

The global bottom navigation remains Today, Plans, Life, and Decisions. These travel views live inside the Plans module for the current travel space.

## Tokyo Travel Template

`关东东京8天旅行计划.html` is the authoritative source for the first Travel Team template.

The implementation should treat it as a source template, not as a standalone static page. The template should be converted into structured app data:

- A built-in template named `关东东京 8 天旅行小队`.
- D1-D8 itinerary records.
- Itinerary nodes for time, location, route, booking, and notes.
- Task cards for tickets, hotels, transport, restaurants, packing, and confirmations.
- Budget categories for transport, lodging, food, tickets, shopping, and contingency.
- Reminder suggestions for departure, reservations, transfers, and pending confirmations.
- Archive-ready travel history after the trip is completed.

### Template and Instance Model

Use a read-only template plus editable instance model.

The original HTML file is a template source. When a user creates a Travel Team space from it, the app creates an editable travel-plan instance inside that space.

Editable instance rules:

- Owner and members can edit the instance.
- Guests can only view.
- Owner and members can modify daily itinerary, add or delete itinerary nodes, change time, location, transport, budget, tasks, reminders, comments, images, and member opinions.
- Key edits must be recorded in activity.

Each instance should retain:

- Source template name: `关东东京8天旅行计划.html`.
- Template version or import timestamp.
- Initial creation snapshot.

The first version should not implement full template-instance diff, one-click restore from template, automatic template updates, or template sync into existing instances.

## AI Features

The first version does not include AI capabilities.

Do not implement:

- Chat-to-card extraction.
- Itinerary summarization.
- Recipe-to-grocery generation.
- Space activity summaries.
- Purchase recommendations.
- Automatic assignment.

Future AI work can be layered on top of the card, comment, activity, and template-instance data model after the collaboration MVP works.

## Non-Goals

The first version should not include:

- Real-time multi-user co-editing.
- Live cursors or online presence.
- Complex per-card custom permissions.
- Large public communities.
- Template marketplace.
- Full accounting.
- Automatic price scraping.
- Complex charts.
- Investment analysis.
- External booking or ordering.
- Payment.
- AI features.

## Acceptance Criteria

- The app supports WeChat login and cloud-backed sync.
- Users can create and switch multiple Life Spaces.
- Users can invite others through WeChat share cards.
- Roles support Owner, Member, and read-only Guest.
- The bottom navigation is Today, Plans, Life, Decisions.
- The Travel Team template is the first complete MVP path.
- `关东东京8天旅行计划.html` is converted into a structured read-only template source.
- Creating from the Tokyo template produces an editable travel-plan instance.
- Owner and members can edit travel-plan instances; guests are read-only.
- Item cards support status, owner, participants, due time, comments, activity, image attachments, reminders, archive, and module-specific fields.
- WeChat reminders cover assigned-to-me, due-soon, and needs-confirmation cases.
- The first version has no AI features.

## Handoff Prompt For Follow-Up Agent

```text
Implement the VikiSize life assistant MVP from docs/specs/vikisize-life-assistant-mvp.md.

Use WeChat Mini Program plus WeChat Cloud Development. Keep the product centered on Life Spaces, small-group collaboration, unified Item Cards, and the Travel Team MVP. Treat 关东东京8天旅行计划.html as the first read-only travel template source and create editable per-space travel-plan instances from it.

Do not add AI features in the first version. Do not build real-time co-editing, full accounting, automatic price scraping, template marketplace, or complex permission systems.
```
