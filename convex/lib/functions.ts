import {queryGeneric,mutationGeneric,type QueryBuilder,type MutationBuilder} from 'convex/server';
import type {DataModel} from './types';
export const query=queryGeneric as QueryBuilder<DataModel,'public'>;
export const mutation=mutationGeneric as MutationBuilder<DataModel,'public'>;
