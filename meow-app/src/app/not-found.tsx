import Link from "next/link";
import { Stamp } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Stamp size="lg" rotate={-8}>
        Mission Failed
      </Stamp>
      <h1 className="mt-8 font-stencil text-4xl text-olive-dark">404: Target not found</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Intel suggests this page was knocked off the table by a cat. Our best people are investigating.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Return to base</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/fleet">Browse the Fleet</Link>
        </Button>
      </div>
    </div>
  );
}
