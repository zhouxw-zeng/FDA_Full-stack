import { http } from './request';

import type { AuditStatus, Customer, CustomerQuery, EnabledFlag, PageResult } from '@/types';

/** tinyint / int 列在不同驱动下可能返回字符串，统一成 number */
function normalizeCustomer(customer: Customer): Customer {
  return {
    ...customer,
    gender: Number(customer.gender),
    vipLevel: Number(customer.vipLevel),
    enabled: Number(customer.enabled) === 1 ? 1 : 0,
    dynamicCount: Number(customer.dynamicCount),
  };
}

/** GET /customers —— 分页查询 C 端用户 */
export async function fetchCustomers(params: CustomerQuery): Promise<PageResult<Customer>> {
  const result = await http.get<PageResult<Customer>>('/customers', params);
  return { ...result, list: result.list.map(normalizeCustomer) };
}

/** GET /customers/:id */
export async function fetchCustomerDetail(id: string): Promise<Customer> {
  return normalizeCustomer(await http.get<Customer>(`/customers/${id}`));
}

/** PUT /customers/audit —— 资料审批 */
export async function auditCustomer(payload: {
  id: string;
  status: Extract<AuditStatus, 'approved' | 'rejected'>;
  remark?: string;
}): Promise<Customer> {
  return normalizeCustomer(await http.put<Customer>('/customers/audit', payload));
}

/** PUT /customers/status —— enabled=1 启用，enabled=0 禁用 */
export async function updateCustomerStatus(payload: {
  id: string;
  enabled: EnabledFlag;
}): Promise<Customer> {
  return normalizeCustomer(await http.put<Customer>('/customers/status', payload));
}

