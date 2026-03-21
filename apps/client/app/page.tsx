"use client";

import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Hello World</h1>
        <Button
          variant="outline"
          onClick={() =>
            toast("Event has been created", {
              description: "Sunday, December 03, 2023 at 9:00 AM",
              action: {
                label: "Undo",
                onClick: () => console.log("Undo"),
              },
              className: "bg-red-500",
            })
          }
        >
          Show Toast
        </Button>
      </div>
    </div>
  );
}
