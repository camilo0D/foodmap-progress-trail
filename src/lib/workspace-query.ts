import { queryOptions } from '@tanstack/react-query';
import { readWorkspace } from './management.functions';
export const workspaceQuery = () => queryOptions({ queryKey: ['workspace'], queryFn: () => readWorkspace() });