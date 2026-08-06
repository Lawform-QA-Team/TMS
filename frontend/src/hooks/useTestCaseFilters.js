import { useState, useMemo } from 'react';

export const useTestCaseFilters = (testCases = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // 고유값들 계산
  const uniqueEnvironments = useMemo(() => {
    const uniqueEnvs = new Set();
    testCases.forEach(tc => {
      if (tc.environment) {
        uniqueEnvs.add(tc.environment);
      }
    });
    return Array.from(uniqueEnvs).sort();
  }, [testCases]);

  const uniqueCategories = useMemo(() => {
    const uniqueCategories = new Set();
    testCases.forEach(tc => {
      if (tc.main_category) uniqueCategories.add(tc.main_category);
      if (tc.sub_category) uniqueCategories.add(`${tc.main_category} > ${tc.sub_category}`);
      if (tc.detail_category) uniqueCategories.add(`${tc.main_category} > ${tc.sub_category} > ${tc.detail_category}`);
    });
    return Array.from(uniqueCategories).sort();
  }, [testCases]);

  const uniqueCreators = useMemo(() => {
    const uniqueCreators = new Set();
    testCases.forEach(tc => {
      if (tc.creator_name) {
        uniqueCreators.add(tc.creator_name);
      }
    });
    return Array.from(uniqueCreators).sort();
  }, [testCases]);

  const uniqueAssignees = useMemo(() => {
    const uniqueAssignees = new Set();
    testCases.forEach(tc => {
      if (tc.assignee_name) {
        uniqueAssignees.add(tc.assignee_name);
      }
    });
    return Array.from(uniqueAssignees).sort();
  }, [testCases]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setEnvironmentFilter('all');
    setCategoryFilter('all');
    setCreatorFilter('all');
    setAssigneeFilter('all');
    setPriorityFilter('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    environmentFilter,
    setEnvironmentFilter,
    categoryFilter,
    setCategoryFilter,
    creatorFilter,
    setCreatorFilter,
    assigneeFilter,
    setAssigneeFilter,
    priorityFilter,
    setPriorityFilter,
    uniqueEnvironments,
    uniqueCategories,
    uniqueCreators,
    uniqueAssignees,
    clearAllFilters
  };
};
