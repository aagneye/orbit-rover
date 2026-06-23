from app.models.schemas import AnalysisReport, InvestigationContext
from app.utils.helpers import confidence_label


def format_mr_comment(
  report: AnalysisReport,
  context: InvestigationContext,
  analysis_id: str,
  dashboard_url: str,
  api_url: str,
) -> str:
  project = context.webhook.project.path_with_namespace
  pipeline = context.webhook.object_attributes
  failed_jobs = ", ".join(j.name for j in context.failed_jobs) or "unknown"

  create_issue_link = f"{api_url}/api/analyses/{analysis_id}/create-issue"
  view_details_link = f"{dashboard_url}/analyses/{analysis_id}"

  evidence_lines = "\n".join(
    f"- **{e.source}**: {e.summary}" + (f" — _{e.detail}_" if e.detail and len(e.detail) < 120 else "")
    for e in report.evidence[:5]
  )

  affected_lines = "\n".join(
    f"- **{s.name}** ({s.team or 'unknown team'}): {s.impact}"
    for s in report.affected_services
  )

  fix_lines = "\n".join(
    f"- **[{f.priority.upper()}]** {f.action}" + (f" — {f.details}" if f.details else "")
    for f in report.suggested_fixes
  )

  mr_section = ""
  if report.responsible_mr:
    mr = report.responsible_mr
    mr_section = (
      f"\n### Responsible MR\n"
      f"- [!{mr.get('iid', '?')}]({mr.get('url', '#')}) — {mr.get('title', 'Unknown')}\n"
      f"- **Author**: {mr.get('author', 'Unknown')}\n"
    )

  breaking = ""
  if report.breaking_change:
    breaking = f"\n### Breaking Change\n{report.breaking_change}\n"

  reviewer = f"\n**Reviewer**: {report.reviewer}" if report.reviewer else ""

  return f"""## 🔍 Orbit Rover — Pipeline Failure Analysis

> Pipeline [#{pipeline.iid}]({pipeline.url or '#'}) failed on `{pipeline.ref}`. Root cause identified automatically.

### ⚡ Quick Actions

| Action | Link |
|--------|------|
| 🎫 **Create Fix Issue** | [Click to create GitLab issue]({create_issue_link}) |
| 📋 **View Details** | [Open full analysis]({view_details_link}) |

---

### Cause
**{report.cause}**

### Summary
{report.summary}

### Confidence
{confidence_label(report.confidence)}

### Failed Jobs
`{failed_jobs}`

### Evidence
{evidence_lines or "_No evidence collected_"}

### Blast Radius
- **Severity**: {report.blast_radius.severity.upper()}
- **Services**: {", ".join(report.blast_radius.services) or "unknown"}
- **Teams**: {", ".join(report.blast_radius.teams) or "unknown"}

### Affected Services
{affected_lines or "_None identified_"}

{breaking}{mr_section}
### Recommendations
{fix_lines or "_No recommendations_"}
{reviewer}

---
<sub>🛰️ **Orbit Rover** · `{project}` · Analysis `{analysis_id[:8]}` · Provider: `{report.provider}`</sub>
"""
