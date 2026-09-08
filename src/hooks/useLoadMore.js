import { useEffect, useState } from 'react';

/* Show a long list a chunk at a time behind a "Load more" button.
   Resets back to the first chunk whenever the list changes (new search,
   filter or sort). `step` is how many rows each click adds. */
export function useLoadMore(list, step = 30) {
  const [visible, setVisible] = useState(step);

  useEffect(() => {
    setVisible(step);
  }, [list, step]);

  const rows = list.slice(0, visible);

  return {
    rows,
    shown: rows.length,
    total: list.length,
    step,
    hasMore: visible < list.length,
    loadMore: () => setVisible((v) => v + step),
  };
}
