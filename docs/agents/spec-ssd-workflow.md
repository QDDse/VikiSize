# Spec SSD Workflow

Use this workflow when turning Notion project MRD notes into PRDs, specs, and implementation tasks.

## Terms

- MRD: A project-level Notion document where daily ideas are recorded.
- Idea: A raw insight, problem, opportunity, user need, experiment, or feature thought found in an MRD.
- PRD: A product requirements document created from validated or recurring MRD ideas.
- SSD: Spec -> Synthesis -> Delivery.

## Cadence

1. Search the user's Notion workspace for project pages and MRD documents.
2. Fetch each MRD and extract new ideas since the last run.
3. Group ideas by project, product surface, user problem, and feature theme.
4. For a new project with no PRD, create a first PRD page under the same project.
5. For an existing PRD, append or update the relevant sections instead of creating duplicates.
6. Create or update implementation specs and tasks only when the PRD has enough concrete requirements.
7. Report what changed, what is ambiguous, and what needs user input.

## PRD Shape

Create PRDs with these sections:

- Overview
- Problem
- Users and use cases
- Goals
- Non-goals
- Requirements
- Acceptance criteria
- Open questions
- Source ideas
- Change log

Keep direct links back to the source MRD and the specific idea snippets used.

## SSD Gates

### Spec

Use this gate when an idea has a clear problem, affected user, and desired outcome.

Output:

- Problem statement
- Requirements
- Acceptance criteria
- Constraints
- Open questions

### Synthesis

Use this gate when multiple MRD ideas overlap.

Output:

- Merged theme
- Duplicates or related ideas
- Proposed PRD update
- Risks and assumptions

### Delivery

Use this gate only after the PRD is specific enough to execute.

Output:

- Implementation plan
- 1-2 day tasks
- Dependencies
- Validation plan
- Progress tracking notes

## Notion Operating Rules

- Search first, then fetch before creating or updating pages.
- Do not create duplicate PRDs if a project already has a PRD-like page.
- If multiple candidate project or PRD pages match, leave a clear ambiguity report instead of guessing.
- Preserve MRD wording for source references, but summarize requirements in clean product language.
- If Notion write tools are unavailable, produce a structured change proposal that can be applied later.
