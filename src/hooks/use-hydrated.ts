import { useEffect, useState } from "react";
import { useInterviewStore } from "@/lib/interviews/store";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    if (useInterviewStore.persist.hasHydrated()) {
      finish();
      return;
    }
    return useInterviewStore.persist.onFinishHydration(finish);
  }, []);

  return hydrated;
}
