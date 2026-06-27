/**
 * POST /api/act  { name: ActionName, args: object }
 *
 * Executes a write — but ONLY after the UI has shown the user a confirmation
 * modal and they approved. Validates the action name + args server-side again
 * (never trust the client), runs the transactional executor, and returns the
 * affected rows + the new audit entry id.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { ActionSchemas, executeAction, isActionName } from "@/lib/actions";
import { isDemoMode, mockAct } from "@/lib/demo";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Body must be { name, args }" }, { status: 400 });
  }

  if (isDemoMode()) {
    if (!isActionName(body.name))
      return NextResponse.json({ error: `Unknown action: ${body.name}` }, { status: 400 });
    const parsed = ActionSchemas[body.name].safeParse(body.args);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid arguments", issues: parsed.error.issues }, { status: 400 });
    const result = mockAct(body.name, parsed.data as Record<string, unknown>);
    return NextResponse.json({ ok: true, ...result });
  }

  if (!isActionName(body.name)) {
    return NextResponse.json({ error: `Unknown action: ${body.name}` }, { status: 400 });
  }

  const parsed = ActionSchemas[body.name].safeParse(body.args);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid arguments for this action", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await executeAction(body.name, parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[act] execution failed:", err);
    return NextResponse.json({ error: "The action could not be completed." }, { status: 500 });
  }
}
