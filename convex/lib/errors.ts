import { ConvexError } from 'convex/values';
export type Code = 'UNAUTHENTICATED' | 'ACCESS_DENIED' | 'RECORD_NOT_ACCESSIBLE' | 'WORKSPACE_UNAVAILABLE' | 'CLASSIFICATION_DENIED' | 'INVALID_ARGUMENT' | 'IDEMPOTENCY_CONFLICT' | 'REFERENCE_EXHAUSTED' | 'INTEGRITY_ERROR';
export function fail(code: Code): never { throw new ConvexError(code); }
export function invariant(value: unknown): asserts value { if (!value) fail('INTEGRITY_ERROR'); }
