import { http } from './request';

import type {
  AdCampaign,
  AdCampaignPayload,
  AdPartnerType,
  AdQuery,
  AdStatus,
  PageResult,
} from '@/types';

/**
 * 数据库驱动对部分数值列的返回类型并不稳定（实测 impressions / clicks 会返回字符串），
 * 这里统一归一化成 number，避免页面上的百分比计算出现 NaN。
 */
function normalizeAd(campaign: AdCampaign): AdCampaign {
  return {
    ...campaign,
    budget: Number(campaign.budget),
    spent: Number(campaign.spent),
    impressions: Number(campaign.impressions),
    clicks: Number(campaign.clicks),
    seed: Number(campaign.seed),
  };
}

/** GET /ads —— 分页查询广告计划 */
export async function fetchAds(params: AdQuery): Promise<PageResult<AdCampaign>> {
  const result = await http.get<PageResult<AdCampaign>>('/ads', params);
  return { ...result, list: result.list.map(normalizeAd) };
}

/** GET /ads/:id */
export async function fetchAdDetail(id: string): Promise<AdCampaign> {
  return normalizeAd(await http.get<AdCampaign>(`/ads/${id}`));
}

/** POST /ads */
export async function createAd(payload: AdCampaignPayload): Promise<AdCampaign> {
  return normalizeAd(await http.post<AdCampaign>('/ads', payload));
}

/** PUT /ads —— id 从 Body 传入 */
export async function updateAd(payload: AdCampaignPayload & { id: string }): Promise<AdCampaign> {
  return normalizeAd(await http.put<AdCampaign>('/ads', payload));
}

/** PUT /ads/status */
export async function updateAdStatus(payload: {
  id: string;
  status: AdStatus;
}): Promise<AdCampaign> {
  return normalizeAd(await http.put<AdCampaign>('/ads/status', payload));
}

/** DELETE /ads/:id */
export function deleteAd(id: string): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/ads/${id}`);
}

/** GET /ads/partner-types —— 广告对接方类型，用于投放计划表单 */
export function fetchAdPartnerTypes(): Promise<PageResult<AdPartnerType>> {
  return http.get<PageResult<AdPartnerType>>('/ads/partner-types', {
    page: 1,
    size: 100,
    status: 0,
  });
}

