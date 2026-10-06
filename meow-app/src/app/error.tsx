"use client";

import { useEffect } from "react";
import { Stamp } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Stamp size="lg" rotate={6}>
        Equipment Failure
      </Stamp>
      <h1 className="mt-8 font-stencil text-4xl text-olive-dark">Something jammed the treads</h1>
      <p className="mt-3 text-lg text-muted-foreground">An unexpected error occurred. Command has been notified.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Incident ref: {error.digest}</p>}
      <Button className="mt-8" size="lg" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
