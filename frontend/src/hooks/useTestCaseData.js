import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '@tms/config';

export const useTestCaseData = () => {
  const [testCases, setTestCases] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [testCasesRes, treeRes, foldersRes, usersRes] = await Promise.all([
        axios.get(`${config.apiUrl}/testcases`),
        axios.get(`${config.apiUrl}/folders/tree`),
        axios.get(`${config.apiUrl}/folders`),
        axios.get(`${config.apiUrl}/users/list`)
      ]);

      setTestCases(testCasesRes.data);
      setFolderTree(treeRes.data);
      setAllFolders(foldersRes.data);
      setUsers(usersRes.data);
      setError(null);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    testCases,
    setTestCases,
    folderTree,
    allFolders,
    users,
    loading,
    error,
    refetch: fetchData
  };
};
