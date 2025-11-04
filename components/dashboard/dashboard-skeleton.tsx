import { Card } from "@/components/shared/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-muted" />
          <div className="h-5 w-72 rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="space-y-1 animate-pulse">
            <div className="h-4 w-24 rounded-md bg-muted" />
            <div className="h-8 w-32 rounded-md bg-muted" />
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded-md bg-muted" />
          <div className="h-72 w-full rounded-md bg-muted" />
        </Card>
        <Card className="space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded-md bg-muted" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 w-full rounded-lg bg-muted" />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded-md bg-muted" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded-md bg-muted" />
                  <div className="h-4 w-20 rounded-md bg-muted" />
                </div>
                <div className="h-2 w-full rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded-md bg-muted" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full rounded-lg bg-muted" />
            ))}
          </div>
        </Card>
      </section>

      <section>
        <Card className="space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded-md bg-muted" />
          <div className="h-72 w-full rounded-md bg-muted" />
        </Card>
      </section>
    </div>
  );
}
