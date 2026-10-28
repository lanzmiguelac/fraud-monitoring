import type {DataModelFromSchemaDefinition,GenericQueryCtx,GenericMutationCtx} from 'convex/server';
import type {GenericId} from 'convex/values';
import type schema from '../schema';
export type DataModel=DataModelFromSchemaDefinition<typeof schema>;
export type QueryCtx=GenericQueryCtx<DataModel>;
export type MutationCtx=GenericMutationCtx<DataModel>;
// A mutation context structurally supplies the same reader interface.
export type Ctx=QueryCtx;
export type Id<T extends keyof DataModel & string>=GenericId<T>;
export type Actor={userId:Id<'users'>};
