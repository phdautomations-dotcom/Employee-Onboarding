/* Collapse a run of per-document activity events ("Document Uploaded",
   "Document Verified") into a single timeline line
   ("4 of 5 documents verified — Address Proof, …") so the Activity feed
   doesn't grow one row per file.
   `activities` is newest-first; the returned list keeps that order. */

// source title -> how to render the collapsed line
const COLLAPSIBLE = {
  'Document Uploaded': { title: 'Documents Uploaded', verb: 'uploaded', strip: /\s*uploaded.*$/i },
  'Document Verified': { title: 'Documents Verified', verb: 'verified', strip: /\s*verified\.?$/i },
};

export function collapseDocActivity(activities = [], docTotal = 0) {
  const out = [];

  for (let i = 0; i < activities.length; i += 1) {
    const a = activities[i];
    const cfg = COLLAPSIBLE[a.title];
    if (!cfg) {
      out.push(a);
      continue;
    }

    // gather the consecutive run of the same single-document event
    const run = [a];
    while (i + 1 < activities.length && activities[i + 1].title === a.title) {
      run.push(activities[i + 1]);
      i += 1;
    }
    if (run.length === 1) {
      out.push(a);
      continue;
    }

    const names = run
      .map((r) => (r.description || '').replace(cfg.strip, '').trim())
      .filter(Boolean);
    const total = Math.max(docTotal, run.length);

    out.push({
      ...run[0], // newest of the run — keeps its date/actor
      title: cfg.title,
      description: `${run.length} of ${total} documents ${cfg.verb} — ${names.join(', ')}`,
    });
  }

  return out;
}
