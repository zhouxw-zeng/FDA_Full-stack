import { http } from './request';

import type { Customer, CustomerQuery, PageResult } from '@/types';

export function fetchCustomers(params: CustomerQuery): Promise<PageResult<Customer>> {
  return http.get<PageResult<Customer>>('/customers', params);
}

export function auditCustomer(
  id: string,
  payload: { status: 'approved' | 'rejected' | 'banned'; remark?: string },
): Promise<void> {
  return http.post<void>(`/customers/${id}/audit`, payload);
}

