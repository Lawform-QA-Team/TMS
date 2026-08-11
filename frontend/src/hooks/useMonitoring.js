import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '@tms/config';

export function usePlaywrightRuns(filters = {}) {
  const [data, setData] = useState({ runs: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.project) params.set('project', filters.project);
      if (filters.environment) params.set('environment', filters.environment);
      if (filters.limit) params.set('limit', filters.limit);
      const res = await axios.get(`${config.apiUrl}/monitoring/playwright/runs?${params}`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('Playwright 실행 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [filters.project, filters.environment, filters.limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, error, refetch: fetch };
}

export function usePlaywrightStats() {
  const [data, setData] = useState({ trend: [], slow_tests: [], browser_pass_rate: [], failed_tests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.apiUrl}/monitoring/playwright/stats`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('Playwright 통계 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, error, refetch: fetch };
}

export function useK6Runs(filters = {}) {
  const [data, setData] = useState({ runs: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.scenario) params.set('scenario', filters.scenario);
      if (filters.environment) params.set('environment', filters.environment);
      if (filters.limit) params.set('limit', filters.limit);
      const res = await axios.get(`${config.apiUrl}/monitoring/k6/runs?${params}`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('K6 실행 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [filters.scenario, filters.environment, filters.limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, error, refetch: fetch };
}

export function useK6Timeseries(runs = 5) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.apiUrl}/monitoring/k6/timeseries?runs=${runs}`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('K6 timeseries 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [runs]);

  useEffect(() => { fetch(); }, [fetch]);

  return { timeseries: data, loading, error, refetch: fetch };
}

export function useK6Stats() {
  const [data, setData] = useState({ trend: [], web_vitals: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.apiUrl}/monitoring/k6/stats`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('K6 통계 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, error, refetch: fetch };
}
