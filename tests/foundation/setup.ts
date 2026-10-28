import { convexTest } from 'convex-test';
import schema from '../../convex/schema';

// Deliberately isolated mock database; no URL, credential, or cloud client.
const modules = import.meta.glob('../../convex/**/*.ts');
export const makeTest = () => convexTest(schema, modules);
