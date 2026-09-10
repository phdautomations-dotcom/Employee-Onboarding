/* Collapse a run of per-document "Document Verified" events into a single
   timeline line ("4 of 5 documents verified — Address Proof, …") so the
   Activity feed doesn't grow one row per file.
   `activities` is newest-first; the returned list keeps that order. */
export function collapseDocActivity(activities = [], docTotal = 0) {
  const out = [];

  for (let i = 0; i < activities.length; i += 1) {
    const a = activities[i];
    if (a.title !== 'Document Verified') {
      out.push(a);
      continue;
    }

    // gather the consecutive run of single-document verifications
    const run = [a];
    while (i + 1 < activities.length && activities[i + 1].title === 'Document Verified') {
      run.push(activities[i + 1]);
      i += 1;
    }
    if (run.length === 1) {
      out.push(a);
      continue;
    }

    const names = run
      .map((r) => (r.description || '').replace(/\s*verified\.?$/i, '').trim())
      .filter(Boolean);
    const total = Math.max(docTotal, run.length);

    out.push({
      ...run[0], // newest of the run — keeps its date/actor
      title: 'Documents Verified',
      description: `${run.length} of ${total} documents verified — ${names.join(', ')}`,
    });
  }

  return out;
}
