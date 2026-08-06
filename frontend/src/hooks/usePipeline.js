import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@tms/contexts/AuthContext';

const API_BASE = '/api';

function buildAuthHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function usePipelineList(filters = {}) {
  const { token } = useAuth();
  const [data, setData] = useState({ tickets: [], pagination: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.pipelineStatus) params.set('pipelineStatus', filters.pipelineStatus);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.per_page) params.set('per_page', String(filters.per_page));

      const res = await fetch(`${API_BASE}/pipeline?${params}`, {
        headers: buildAuthHeader(token),
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error ?? '목록 조회 실패');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [token, filters.pipelineStatus, filters.priority, filters.page, filters.per_page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  return { ...data, loading, error, refresh: fetchList };
}

export function usePipelineDetail(pipelineId) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!pipelineId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/pipeline/${pipelineId}`, {
        headers: buildAuthHeader(token),
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error ?? '상세 조회 실패');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [token, pipelineId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { data, loading, error, refresh: fetchDetail };
}

export function usePipelineStats() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/pipeline/stats`, {
        headers: buildAuthHeader(token),
      });
      const json = await res.json();
      if (json.success) setStats(json.data);
      else setError(json.error ?? '통계 조회 실패');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

export async function cancelPipeline(pipelineId, token) {
  const res = await fetch(`${API_BASE}/pipeline/${pipelineId}/cancel`, {
    method: 'POST',
    headers: { ...buildAuthHeader(token), 'Content-Type': 'application/json' },
  });
  return res.json();
}
