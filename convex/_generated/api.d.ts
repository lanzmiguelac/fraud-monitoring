/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cases from "../cases.js";
import type * as compat from "../compat.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_classification from "../lib/classification.js";
import type * as lib_compatSchema from "../lib/compatSchema.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_functions from "../lib/functions.js";
import type * as lib_idempotency from "../lib/idempotency.js";
import type * as lib_identity from "../lib/identity.js";
import type * as lib_references from "../lib/references.js";
import type * as lib_relationships from "../lib/relationships.js";
import type * as lib_types from "../lib/types.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_workspace from "../lib/workspace.js";
import type * as monitoring from "../monitoring.js";
import type * as services_cases from "../services/cases.js";
import type * as services_monitoring from "../services/monitoring.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cases: typeof cases;
  compat: typeof compat;
  "lib/audit": typeof lib_audit;
  "lib/authorization": typeof lib_authorization;
  "lib/classification": typeof lib_classification;
  "lib/compatSchema": typeof lib_compatSchema;
  "lib/errors": typeof lib_errors;
  "lib/functions": typeof lib_functions;
  "lib/idempotency": typeof lib_idempotency;
  "lib/identity": typeof lib_identity;
  "lib/references": typeof lib_references;
  "lib/relationships": typeof lib_relationships;
  "lib/types": typeof lib_types;
  "lib/validators": typeof lib_validators;
  "lib/workspace": typeof lib_workspace;
  monitoring: typeof monitoring;
  "services/cases": typeof services_cases;
  "services/monitoring": typeof services_monitoring;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
