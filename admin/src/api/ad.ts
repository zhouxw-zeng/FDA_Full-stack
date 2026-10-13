import { http } from './request';

import type { AdCampaign, AdCampaignPayload, AdQuery, AdStatus, PageResult } from '@/types';

export function fetchAds(params: AdQuery): Promise<PageResult<AdCampaign>> {
  return http.get<PageResult<AdCampaign>>('/ads', params);
}

export function createAd(payload: AdCampaignPayload): Promise<AdCampaign> {
  return http.post<AdCampaign>('/ads', payload);
}

export function updateAd(id: string, payload: AdCampaignPayload): Promise<AdCampaign> {
  return http.put<AdCampaign>('/ads', { id, ...payload });
}

export function updateAdStatus(id: string, status: AdStatus): Promise<void> {
  return http.put<void>('/ads/status', { id, status });
}

export function deleteAd(id: string): Promise<void> {
  return http.delete<void>(`/ads/${id}`);
}
