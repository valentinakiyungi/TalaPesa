import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type z, type ZodTypeAny } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string, public details?: unknown) {
    super(message ?? code);
  }
}

export const badRequest = (code: string, message?: string, details?: unknown) => new ApiError(400, code, message, details);
export const forbidden = (code = 'forbidden', message?: string) => new ApiError(403, code, message);
export const notFound = (code = 'not_found', message?: string) => new ApiError(404, code, message);
export const conflict = (code: string, message?: string) => new ApiError(409, code, message);

type Handler<P> = (req: NextRequest, ctx: { params: P }) => Promise<unknown>;

/** Wraps a route handler: JSON in/out, uniform error shape `{ error: { code, message } }`. */
export function route<P = Record<string, string>>(fn: Handler<P>) {
  return async (req: NextRequest, ctx: { params: P }) => {
    try {
      const result = await fn(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: { code: err.code, message: err.message, details: err.details } }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: { code: 'validation', message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), details: err.issues } },
          { status: 400 },
        );
      }
      console.error('[api]', req.method, req.nextUrl.pathname, err);
      return NextResponse.json({ error: { code: 'internal', message: 'Internal server error' } }, { status: 500 });
    }
  };
}

export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw badRequest('invalid_json');
  }
  return schema.parse(json);
}

export function appUrl(req?: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  return req ? req.nextUrl.origin : 'http://localhost:3000';
}
