# GitLab AI Catalog — submission guide for Orbit Rover

Your hackathon form asks for:

> **Showcase Track: Links to your AI Catalog entries**  
> Link to your published artifact at https://gitlab.com/explore/ai-catalog/agents/

You need to **publish a public agent** in the GitLab AI Catalog, then paste its URL into the form.

This takes about **5–10 minutes** in the GitLab UI. Everything below is copy-paste ready.

---

## What you're publishing

| Field | Value |
|-------|--------|
| **Display name** | `Orbit Rover Pipeline Analyst` |
| **Managing project** | `aagneye-group/orbit-rover` |
| **Visibility** | **Public** |
| **Description** | See below |

### Description (copy-paste)

```
Investigates failed GitLab CI/CD pipelines — root cause, blast radius, and fix recommendations. Use in Duo Chat when a pipeline goes red and you need a structured diagnosis. Companion to Orbit Rover (open source): webhook → logs + MR + Orbit graph → automated MR comment. Repo: https://gitlab.com/aagneye-group/orbit-rover | Demo: https://orbit-rover.vercel.app
```

### System prompt (copy-paste)

Open [`orbit-rover/ai-catalog/orbit-rover-pipeline-analyst.system-prompt.txt`](../orbit-rover/ai-catalog/orbit-rover-pipeline-analyst.system-prompt.txt) and paste the **entire file** into the **System prompt** field.

---

## Step-by-step (GitLab.com)

### Prerequisites

- **Maintainer or Owner** on `aagneye-group/orbit-rover`
- GitLab Duo / Agent Platform enabled on your account (Ultimate trial or hackathon access)
- Custom agents allowed on your group (Settings → GitLab Duo → Allow custom agents)

### 1. Create the agent

**Option A — from your project (recommended)**

1. Go to https://gitlab.com/aagneye-group/orbit-rover
2. Left sidebar → **AI** → **Agents**
3. Click **New agent**
4. Fill in:
   - **Display name:** `Orbit Rover Pipeline Analyst`
   - **Description:** (paste from above)
   - **Visibility:** **Public**
   - **System prompt:** (paste from `orbit-rover-pipeline-analyst.system-prompt.txt`)
5. **Available tools (optional):** enable any CI/log/issue tools your tier exposes
6. Click **Create agent**

**Option B — from AI Catalog**

1. Go to https://gitlab.com/explore/ai-catalog/agents/
2. Click **New agent** (top right, if visible)
3. Select managing project `aagneye-group/orbit-rover`
4. Same fields as Option A

### 2. Release a version (required for public catalog)

Public agents need at least one **released** version:

1. Open your agent → **Versions** (or **Edit** / version panel)
2. If the first version is **Draft**, click **Release** (or **Publish** / bump with release)
3. Confirm version `1.0.0` (or latest) is **Released**

> If you only see a draft, the agent may not appear publicly until released.

### 3. Verify it appears in the catalog

1. Open https://gitlab.com/explore/ai-catalog/agents/
2. Search for **Orbit Rover**
3. Click your agent — you should see **Public** and project `aagneye-group/orbit-rover`

### 4. Copy the submission link

Use the URL from your browser when viewing the agent in the catalog:

```text
https://gitlab.com/explore/ai-catalog/agents/<AGENT_ID>
```

Replace `<AGENT_ID>` with the numeric ID from the URL (GitLab assigns this when you create the agent).

**Paste that full URL** into the hackathon form field.

---

## What to put in the submission form

**Single link (minimum):**

```text
https://gitlab.com/explore/ai-catalog/agents/YOUR_AGENT_ID
```

**Optional second link** (shows the full product, not just the catalog entry):

```text
https://gitlab.com/aagneye-group/orbit-rover
```

---

## How this relates to Orbit Rover

| Artifact | Purpose |
|----------|---------|
| **AI Catalog agent** (this submission) | Interactive Duo Chat specialist for pipeline RCA |
| **Orbit Rover backend** | Automated webhook agent — posts MR comments on failure |
| **Vercel dashboard** | Manager view — https://orbit-rover.vercel.app |

Same domain (pipeline root-cause analysis), different surfaces — catalog agent for chat, Orbit Rover for automation.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No **AI → Agents** in sidebar | Enable Duo Agent Platform; confirm Maintainer role |
| Cannot set **Public** | Release a version first; agent must be valid |
| Agent not in explore catalog | Visibility Public + version Released; wait a few minutes |
| **New agent** button missing | Create from project: AI → Agents → New agent |
| Form rejects link | URL must be `gitlab.com/explore/ai-catalog/agents/...` not project path |

---

## Files in this repo

| File | Use |
|------|-----|
| `orbit-rover/ai-catalog/orbit-rover-pipeline-analyst.system-prompt.txt` | Paste into System prompt |
| `orbit-rover/ai-catalog/agent-metadata.json` | Reference metadata + example prompts |
| `docs/AI_CATALOG_SUBMISSION.md` | This guide |

After publishing, add your real catalog URL to `agent-metadata.json` → `links.catalog_entry` if you want it documented in the repo.
