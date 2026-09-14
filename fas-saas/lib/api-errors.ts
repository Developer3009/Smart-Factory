import { NextResponse } from "next/server";

import { ZodError } from "zod";

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation Error", details: (err as any).errors },
      { status: 400 }
    );
  }

  console.error("[API Error]", err);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
