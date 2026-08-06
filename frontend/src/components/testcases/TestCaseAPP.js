// src/TestCaseApp.js - 리팩토링된 버전
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';
import { formatUTCToKST } from '@tms/utils/dateUtils';
import JiraIssuesList from '@tms/components/jira/JiraIssuesList';
import SlidePanel from '@tms/components/common/SlidePanel';

// 컴포넌트 임포트
import TestCaseSearch from '@tms/components/testcases/TestCaseSearch';
import TestCaseTable from '@tms/components/testcases/TestCaseTable';
import TestCasePagination from '@tms/components/testcases/TestCasePagination';
import TestCaseModal from '@tms/components/testcases/modals/TestCaseModal';
import TestCaseFormModal from '@tms/components/testcases/modals/TestCaseFormModal';
import AiTcModal from '@tms/components/testcases/modals/AiTcModal';
import { getUserDisplayName } from '@tms/utils/userDisplay';

// 훅 임포트
import { useTestCaseData } from '@tms/hooks/useTestCaseData';
import { useTestCaseFilters } from '@tms/hooks/useTestCaseFilters';
import { useTestCasePagination } from '@tms/hooks/useTestCasePagination';

// 스타일 임포트
import '@tms/components/testcases/TestCaseAPP.css';

// 헬퍼 함수들
const findFolderInTree = (nodes, folderId) => {
  for (const node of nodes) {
    if (node.id === folderId) {
      return node;
    }
    if (node.children) {
      const found = findFolderInTree(node.children, folderId);
      if (found) return found;
    }
  }
  return null;
};

const getFolderType = (folderId, folderTree) => {
  const folder = findFolderInTree(folderTree, folderId);
  if (!folder) return 'unknown';
  return folder.type || 'unknown';
};

const getEnvironmentFolderIds = (nodes, environmentFolderId) => {
  const environmentNode = findFolderInTree(nodes, environmentFolderId);
  if (!environmentNode || environmentNode.type !== 'environment') {
    return [];
  }
  
  const folderIds = [];
  if (environmentNode.children) {
    for (const child of environmentNode.children) {
      if (child.type === 'deployment_date') {
        folderIds.push(child.id);
        if (child.children) {
          for (const grandChild of child.children) {
            if (grandChild.type === 'feature') {
              folderIds.push(grandChild.id);
            }
          }
        }
      }
    }
  }
  return folderIds;
};

const getDeploymentFolderIds = (nodes, deploymentFolderId) => {
  const deploymentNode = findFolderInTree(nodes, deploymentFolderId);
  if (!deploymentNode || deploymentNode.type !== 'deployment_date') {
    return [];
  }
  
  const folderIds = [deploymentNode.id];
  if (deploymentNode.children) {
    for (const child of deploymentNode.children) {
      if (child.type === 'feature') {
        folderIds.push(child.id);
      }
    }
  }
  return folderIds;
};

// axios 인터셉터 설정
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['Accept'] = 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 API Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('🔐 인증 오류 발생 - 로그인이 필요합니다');
      localStorage.removeItem('token');
      window.location.reload();
    }
    
    return Promise.reject(error);
  }
);

axios.defaults.baseURL = config.apiUrl;

const TestCaseAPP = ({ setActiveTab }) => {
  const { user } = useAuth();
  
  // 데이터 훅
  const {
    testCases,
    setTestCases,
    folderTree,
    allFolders,
    users,
    loading,
    error,
    refetch
  } = useTestCaseData();

  // 필터 훅
  const {
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
  } = useTestCaseFilters(testCases);

  // 모달 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState('');
  const [, setShowDeleteModal] = useState(false); // eslint-disable-line no-unused-vars
  
  // 선택 및 편집 상태
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadFolderId, setUploadFolderId] = useState('');
  
  // 댓글 관련 상태
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [showCommentMentions, setShowCommentMentions] = useState(false);
  const [commentMentionQuery, setCommentMentionQuery] = useState('');
  const [commentMentionIndex, setCommentMentionIndex] = useState(0);
  const [showEditMentions, setShowEditMentions] = useState(false);
  const [editMentionQuery, setEditMentionQuery] = useState('');
  const [editMentionIndex, setEditMentionIndex] = useState(0);
  
  const [weeklyActivity, setWeeklyActivity] = useState(null);

  // 폴더 및 정렬 상태
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [sortBy, setSortBy] = useState('tc_number');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    setSelectedTestCase(null);
    setComments([]);
    setEditingCommentId(null);
    setEditingCommentContent('');
  }, [
    selectedFolder,
    searchTerm,
    statusFilter,
    environmentFilter,
    categoryFilter,
    creatorFilter,
    assigneeFilter,
    priorityFilter
  ]);
  
  useEffect(() => {
    axios.get('/dashboard/weekly-activity').then(r => setWeeklyActivity(r.data)).catch(() => {});
  }, []);

  // 새 테스트 케이스 기본값
  const defaultTestCase = {
        name: '',
        main_category: '',
        sub_category: '',
        detail_category: '',
        pre_condition: '',
        expected_result: '',
        result_status: 'N/T',
        remark: '',
        folder_id: null,
        automation_code_path: '',
        automation_code_type: 'playwright',
        assignee_id: null
  };

  const [newTestCase, setNewTestCase] = useState(defaultTestCase);
  const [showAiModal, setShowAiModal] = useState(false);

  const handleSaveAiTc = async (tcList) => {
    for (const tc of tcList) {
      await axios.post('/testcases', {
        ...tc,
        folder_id: selectedFolder,
        result_status: 'N/T',
      });
    }
    refetch();
  };

  const handleSendToForm = (tc) => {
    setNewTestCase({ ...defaultTestCase, ...tc, folder_id: selectedFolder });
    setShowAiModal(false);
    setShowAddModal(true);
  };

  // 필터링된 테스트 케이스 계산
  const filteredTestCases = useMemo(() => {
    let filtered = selectedFolder 
      ? testCases.filter(tc => {
          const tcFolderId = Number(tc.folder_id);
          const selectedFolderId = Number(selectedFolder);
          
          const selectedFolderType = getFolderType(selectedFolderId, folderTree);
          
          if (selectedFolderType === 'environment') {
            const environmentFolderIds = getEnvironmentFolderIds(folderTree, selectedFolderId);
            return environmentFolderIds.includes(tcFolderId);
          } else if (selectedFolderType === 'deployment_date') {
            const deploymentFolderIds = getDeploymentFolderIds(folderTree, selectedFolderId);
            return deploymentFolderIds.includes(tcFolderId);
          } else if (selectedFolderType === 'feature') {
            return tcFolderId === selectedFolderId;
          } else {
            return true;
          }
        })
      : testCases;

    // 검색어 필터링
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(tc => 
        (tc.main_category && tc.main_category.toLowerCase().includes(searchLower)) ||
        (tc.sub_category && tc.sub_category.toLowerCase().includes(searchLower)) ||
        (tc.detail_category && tc.detail_category.toLowerCase().includes(searchLower)) ||
        (tc.expected_result && tc.expected_result.toLowerCase().includes(searchLower)) ||
        (tc.remark && tc.remark.toLowerCase().includes(searchLower)) ||
        (tc.creator_name && tc.creator_name.toLowerCase().includes(searchLower)) ||
        (tc.assignee_name && tc.assignee_name.toLowerCase().includes(searchLower))
      );
    }

    // 상태 필터 적용
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tc => tc.result_status === statusFilter);
    }

    // 환경 필터 적용
    if (environmentFilter !== 'all') {
      filtered = filtered.filter(tc => tc.environment === environmentFilter);
    }

    // 카테고리 필터 적용
    if (categoryFilter !== 'all') {
      const categoryParts = categoryFilter.split(' > ');
      if (categoryParts.length === 1) {
        filtered = filtered.filter(tc => tc.main_category === categoryParts[0]);
      } else if (categoryParts.length === 2) {
        filtered = filtered.filter(tc => tc.main_category === categoryParts[0] && tc.sub_category === categoryParts[1]);
      } else if (categoryParts.length === 3) {
        filtered = filtered.filter(tc => tc.main_category === categoryParts[0] && tc.sub_category === categoryParts[1] && tc.detail_category === categoryParts[2]);
      }
    }

    // 작성자 필터 적용
    if (creatorFilter !== 'all') {
      filtered = filtered.filter(tc => tc.creator_name === creatorFilter);
    }

    // 담당자 필터 적용
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(tc => tc.assignee_name === assigneeFilter);
    }

    // 중요도 필터 적용
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(tc => (tc.priority || '') === priorityFilter);
    }

    // 정렬 적용
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'tc_number': {
          // TC No. 없는 항목은 맨 뒤로
          const aNum = a.tc_number || '';
          const bNum = b.tc_number || '';
          if (!aNum && !bNum) comparison = 0;
          else if (!aNum) comparison = 1;
          else if (!bNum) comparison = -1;
          else comparison = aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
          break;
        }
        case 'id':
          comparison = (a.id || 0) - (b.id || 0);
          break;
        case 'name':
          comparison = (a.main_category || '').localeCompare(b.main_category || '');
          break;
        case 'status':
          comparison = (a.result_status || '').localeCompare(b.result_status || '');
          break;
        case 'assignee':
          comparison = (a.assignee_name || '').localeCompare(b.assignee_name || '');
          break;
        case 'creator':
          comparison = (a.creator_name || '').localeCompare(b.creator_name || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
          break;
        case 'environment':
          comparison = (a.environment || '').localeCompare(b.environment || '');
          break;
        default:
          comparison = 0;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [
    testCases, selectedFolder, folderTree, searchTerm, statusFilter,
    environmentFilter, categoryFilter, creatorFilter, assigneeFilter, priorityFilter,
    sortBy, sortOrder
  ]);

  const statusSummary = useMemo(() => {
    const counts = {
      pass: 0,
      fail: 0,
      block: 0,
      nt: 0,
      na: 0
    };

    filteredTestCases.forEach((tc) => {
      const rawStatus = (tc.result_status || 'N/T').toString().toLowerCase();
      if (rawStatus === 'pass') {
        counts.pass += 1;
      } else if (rawStatus === 'fail') {
        counts.fail += 1;
      } else if (rawStatus === 'block') {
        counts.block += 1;
      } else if (rawStatus === 'n/a' || rawStatus === 'na') {
        counts.na += 1;
      } else {
        counts.nt += 1;
      }
    });

    const total = filteredTestCases.length;
    const tested = Math.max(total - counts.nt, 0);
    const passRate = tested > 0 ? Math.round((counts.pass / total) * 100) : 0;
    const calcPercent = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);
    const percentPass = calcPercent(counts.pass);
    const percentFail = calcPercent(counts.fail);
    const percentBlock = calcPercent(counts.block);
    const percentNt = Math.max(0, 100 - percentPass - percentFail - percentBlock);
    const ntCombined = counts.nt + counts.na;

    return {
      total,
      tested,
      passRate,
      percentPass,
      percentFail,
      percentBlock,
      percentNt,
      ntCombined,
      ...counts
    };
  }, [filteredTestCases]);

  const pieSegments = useMemo(() => {
    const total = statusSummary.total;
    const segments = [
      { key: 'pass', label: 'Pass', value: statusSummary.pass, color: '#28a745' },
      { key: 'block', label: 'Block', value: statusSummary.block, color: '#ffc107' },
      { key: 'fail', label: 'Fail', value: statusSummary.fail, color: '#dc3545' },
      { key: 'nt', label: 'N/T', value: statusSummary.ntCombined, color: '#e2e3e5' }
    ].filter((item) => item.value > 0);

    if (total === 0) {
      return [];
    }

    let startAngle = 0;
    return segments.map((segment) => {
      const angle = (segment.value / total) * 360;
      const endAngle = startAngle + angle;
      const percent = Math.round((segment.value / total) * 100);
      const data = {
        ...segment,
        startAngle,
        endAngle,
        percent
      };
      startAngle = endAngle;
      return data;
    });
  }, [statusSummary]);

  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');
  };

  // 페이지네이션 훅
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    getPaginatedTestCases,
    handlePageChange,
    handleItemsPerPageChange
  } = useTestCasePagination(filteredTestCases);

  // 특정 테스트 케이스를 여는 함수 (다른 컴포넌트에서 호출 가능)
  const openTestCaseDetail = (testCaseId) => {
    const testCase = testCases.find(tc => tc.id === testCaseId);
    if (testCase) {
      setSelectedTestCase(testCase);
      fetchComments(testCaseId);
    } else {
      console.warn(`테스트 케이스 #${testCaseId}를 찾을 수 없습니다.`);
    }
  };

  // window 객체에 함수 등록 (다른 컴포넌트에서 호출 가능하도록)
  useEffect(() => {
    if (setActiveTab) {
      window.setActiveTab = setActiveTab;
    }
    window.openTestCaseDetail = openTestCaseDetail;
    
    return () => {
      if (window.openTestCaseDetail === openTestCaseDetail) {
        delete window.openTestCaseDetail;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testCases, setActiveTab]);

  // 이벤트 핸들러들
  const handleFolderSelect = (folderId) => {
    setSelectedFolder(folderId);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectTestCase = (testCaseId) => {
    setSelectedTestCases(prev => 
      prev.includes(testCaseId) 
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const handleSelectAll = () => {
    const paginatedTestCases = getPaginatedTestCases();
    if (selectedTestCases.length === paginatedTestCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(paginatedTestCases.map(tc => tc.id));
    }
  };

  const handleStatusChange = async (testCaseId, newStatus) => {
    try {
      await axios.put(`${config.apiUrl}/testcases/${testCaseId}/status`, { 
        status: newStatus 
      });
      
      // 로컬 상태 업데이트
      setTestCases(prev => prev.map(tc => 
        tc.id === testCaseId ? { ...tc, result_status: newStatus } : tc
      ));
      
      alert('테스트 케이스 상태가 성공적으로 변경되었습니다.');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || '알 수 없는 오류가 발생했습니다.';
      alert('테스트 케이스 상태 변경 중 오류가 발생했습니다: ' + errorMessage);
    }
  };

  const handleAssigneeChange = async (testCaseId, newAssigneeId) => {
    try {
      const response = await axios.put(`${config.apiUrl}/testcases/${testCaseId}`, {
        assignee_id: newAssigneeId ? Number(newAssigneeId) : null
      });
      
      if (response.status === 200) {
        const selectedUser = users.find(u => u.id === parseInt(newAssigneeId));
        setTestCases(prev => prev.map(tc => {
          if (tc.id === testCaseId) {
            return { 
              ...tc, 
              assignee_id: newAssigneeId ? parseInt(newAssigneeId) : null,
              assignee_name: selectedUser ? getUserDisplayName(selectedUser) : null
            };
          }
          return tc;
        }));
        
        alert('담당자가 성공적으로 변경되었습니다.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || '알 수 없는 오류가 발생했습니다.';
      alert('담당자 변경 중 오류가 발생했습니다: ' + errorMessage);
    }
  };

  const handleAddTestCase = async () => {
    if (!newTestCase.main_category || !newTestCase.sub_category || !newTestCase.detail_category) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    try {
      const autoName = `${newTestCase.main_category} - ${newTestCase.sub_category} - ${newTestCase.detail_category}`;
      const testCaseData = {
        ...newTestCase,
        name: autoName
      };

      await axios.post(`${config.apiUrl}/testcases`, testCaseData);
      alert('테스트 케이스가 성공적으로 추가되었습니다.');
      setShowAddModal(false);
      setNewTestCase(defaultTestCase);
      refetch();
    } catch (err) {
      alert('테스트 케이스 추가 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditTestCase = async () => {
    if (!editingTestCase.main_category || !editingTestCase.sub_category || !editingTestCase.detail_category) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    try {
      await axios.put(`${config.apiUrl}/testcases/${editingTestCase.id}`, editingTestCase);
      alert('테스트 케이스가 성공적으로 수정되었습니다.');
      setShowEditModal(false);
      setEditingTestCase(null);
      refetch();
    } catch (err) {
      alert('테스트 케이스 수정 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm('정말로 이 테스트 케이스를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/testcases/${testCaseId}`);
      alert('테스트 케이스가 성공적으로 삭제되었습니다.');
      refetch();
    } catch (err) {
      alert('테스트 케이스 삭제 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`선택한 ${selectedTestCases.length}개의 테스트 케이스를 삭제하시겠습니까?`)) {
      return;
    }
    let failed = 0;
    for (const id of selectedTestCases) {
      try {
        await axios.delete(`/testcases/${id}`);
      } catch {
        failed++;
      }
    }
    if (failed > 0) {
      alert(`${selectedTestCases.length - failed}개 삭제 완료, ${failed}개 실패`);
    } else {
      alert(`${selectedTestCases.length}개 삭제 완료`);
    }
    setSelectedTestCases([]);
    refetch();
  };

  const handleBulkMove = async () => {
    if (!moveTargetFolderId) {
      alert('이동할 폴더를 선택해 주세요.');
      return;
    }
    try {
      const res = await axios.post('/testcases/bulk-move', {
        testcase_ids: selectedTestCases,
        folder_id: Number(moveTargetFolderId),
      });
      alert(`${res.data.moved}개 이동 완료`);
      setShowMoveModal(false);
      setMoveTargetFolderId('');
      setSelectedTestCases([]);
      refetch();
    } catch (err) {
      alert('이동 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExecuteAutomation = async (testCaseId) => {
    try {
      const response = await axios.post(`/testcases/${testCaseId}/execute`);
      alert(`자동화 코드 실행 완료: ${response.data.result}`);
      refetch();
    } catch (err) {
      alert('자동화 코드 실행 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
  };

  // 댓글 조회
  const fetchComments = async (testCaseId) => {
    if (!testCaseId) return;
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/api/collaboration/comments`, {
        params: {
          entity_type: 'test_case',
          entity_id: testCaseId
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setComments(response.data || []);
    } catch (err) {
      console.error('댓글 조회 오류:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const updateMentions = (value, setShow, setQuery, setIndex) => {
    const atIndex = value.lastIndexOf('@');
    if (atIndex === -1) {
      setShow(false);
      setQuery('');
      setIndex(0);
      return;
    }

    const beforeAt = value[atIndex - 1];
    if (atIndex > 0 && beforeAt && !/\s/.test(beforeAt)) {
      setShow(false);
      setQuery('');
      setIndex(0);
      return;
    }

    const afterAt = value.slice(atIndex + 1);
    if (/\s/.test(afterAt)) {
      setShow(false);
      setQuery('');
      setIndex(0);
      return;
    }

    setQuery(afterAt);
    setShow(true);
    setIndex(0);
  };

  const getMentionCandidates = (query) => {
    const q = (query || '').toLowerCase();
    const list = users || [];
    if (!q) return list.slice(0, 8);
    return list
      .filter((u) => {
        const username = (u.username || '').toLowerCase();
        const display = (getUserDisplayName(u) || '').toLowerCase();
        return username.includes(q) || display.includes(q);
      })
      .slice(0, 8);
  };

  const insertMention = (value, selectedUser) => {
    if (!selectedUser?.username) return value;
    const atIndex = value.lastIndexOf('@');
    if (atIndex === -1) return value;
    const afterAt = value.slice(atIndex + 1);
    const nextSpaceIndex = afterAt.search(/\s/);
    const remaining = nextSpaceIndex === -1 ? '' : afterAt.slice(nextSpaceIndex);
    const before = value.slice(0, atIndex);
    const spacer = remaining && !remaining.startsWith(' ') ? ' ' : '';
    return `${before}@${selectedUser.username}${spacer}${remaining || ' '}`;
  };

  const handleCommentChange = (value) => {
    setNewComment(value);
    updateMentions(value, setShowCommentMentions, setCommentMentionQuery, setCommentMentionIndex);
  };

  const handleEditCommentChange = (value) => {
    setEditingCommentContent(value);
    updateMentions(value, setShowEditMentions, setEditMentionQuery, setEditMentionIndex);
  };

  const handleNewMentionSelect = (selectedUser) => {
    setNewComment((prev) => insertMention(prev, selectedUser));
    setShowCommentMentions(false);
    setCommentMentionQuery('');
    setCommentMentionIndex(0);
  };

  const handleEditMentionSelect = (selectedUser) => {
    setEditingCommentContent((prev) => insertMention(prev, selectedUser));
    setShowEditMentions(false);
    setEditMentionQuery('');
    setEditMentionIndex(0);
  };

  const handleCommentKeyDown = (e) => {
    const list = getMentionCandidates(commentMentionQuery);
    if (showCommentMentions && list.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCommentMentionIndex((prev) => (prev + 1) % list.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCommentMentionIndex((prev) => (prev - 1 + list.length) % list.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNewMentionSelect(list[commentMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommentMentions(false);
        setCommentMentionQuery('');
        setCommentMentionIndex(0);
        return;
      }
    }
  };

  const handleEditCommentKeyDown = (e) => {
    const list = getMentionCandidates(editMentionQuery);
    if (showEditMentions && list.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setEditMentionIndex((prev) => (prev + 1) % list.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setEditMentionIndex((prev) => (prev - 1 + list.length) % list.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEditMentionSelect(list[editMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowEditMentions(false);
        setEditMentionQuery('');
        setEditMentionIndex(0);
        return;
      }
    }
  };

  // 댓글 추가
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTestCase) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.apiUrl}/api/collaboration/comments`, {
        entity_type: 'test_case',
        entity_id: selectedTestCase.id,
        content: newComment.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNewComment('');
      setShowCommentMentions(false);
      setCommentMentionQuery('');
      setCommentMentionIndex(0);
      fetchComments(selectedTestCase.id);
    } catch (err) {
      console.error('댓글 추가 오류:', err);
      alert('댓글 추가 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
  };

  // 댓글 편집 시작
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
    setShowEditMentions(false);
    setEditMentionQuery('');
    setEditMentionIndex(0);
  };

  // 댓글 편집 취소
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
    setShowEditMentions(false);
    setEditMentionQuery('');
    setEditMentionIndex(0);
  };

  // 댓글 수정
  const handleUpdateComment = async (commentId) => {
    if (!editingCommentContent.trim() || !selectedTestCase) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${config.apiUrl}/api/collaboration/comments/${commentId}`, {
        content: editingCommentContent.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setEditingCommentId(null);
      setEditingCommentContent('');
      setShowEditMentions(false);
      setEditMentionQuery('');
      setEditMentionIndex(0);
      fetchComments(selectedTestCase.id);
    } catch (err) {
      console.error('댓글 수정 오류:', err);
      alert('댓글 수정 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/api/collaboration/comments/${commentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      fetchComments(selectedTestCase.id);
    } catch (err) {
      console.error('댓글 삭제 오류:', err);
      alert('댓글 삭제 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadFolderId) {
      formData.append('folder_id', uploadFolderId);
    }

    try {
      const response = await axios.post(`${config.apiUrl}/testcases/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(response.data.message);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadFolderId('');
      refetch();
    } catch (err) {
      alert('파일 업로드 중 오류가 발생했습니다: ' + err.response?.data?.error || err.message);
    }
  };

  const handleDownload = async () => {
    try {
      // 현재 적용된 필터 정보를 쿼리 파라미터로 전달
      const params = new URLSearchParams();
      
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (environmentFilter && environmentFilter !== 'all') {
        params.append('environment', environmentFilter);
      }
      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (creatorFilter && creatorFilter !== 'all') {
        params.append('creator', creatorFilter);
      }
      if (assigneeFilter && assigneeFilter !== 'all') {
        params.append('assignee', assigneeFilter);
      }
      if (selectedFolder) {
        params.append('folder_id', selectedFolder);
      }
      
      const queryString = params.toString();
      const url = queryString 
        ? `${config.apiUrl}/testcases/download?${queryString}`
        : `${config.apiUrl}/testcases/download`;
      
      const response = await axios.get(url, {
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `testcases_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('파일 다운로드 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolderTree = (nodes, level = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedFolders.has(node.id);
      const nodeType = node.type || getFolderType(node.id, folderTree);
      const isFolder = nodeType === 'environment' || nodeType === 'deployment_date' || nodeType === 'feature';
      
      return (
        <div key={node.id} style={{ marginLeft: level * 20 }}>
          <div 
            className={`folder-item ${selectedFolder === node.id && isFolder ? 'selected' : ''} ${isFolder ? 'clickable' : ''}`}
            onClick={() => {
              if (isFolder) {
                handleFolderSelect(node.id);
              }
            }}
          >
            {hasChildren && (
              <span 
                className={`folder-toggle ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.id);
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            <span className="folder-name">{node.name}</span>
            {isFolder && (
              <span className="folder-type-badge">
                {
                  nodeType === 'project' ? '프로젝트' :
                  nodeType === 'environment' ? '환경' : 
                  nodeType === 'deployment_date' ? '배포일자' : 
                  nodeType === 'feature' ? '기능명' : ''
                }
              </span>
            )}
          </div>
          {hasChildren && (
            <div className={`folder-children ${isExpanded ? 'expanded' : 'collapsed'}`}>
              {isExpanded && renderFolderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return <div className="testcase-loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="testcase-error">{error}</div>;
  }

  const commentMentionCandidates = getMentionCandidates(commentMentionQuery);
  const editMentionCandidates = getMentionCandidates(editMentionQuery);

  return (
    <div className="testcase-container">
      <div className="testcase-header">
        <h1>테스트 케이스 관리</h1>
        {user && user.role === 'guest' && (
          <div className="guest-notice" style={{ 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffc107', 
            borderRadius: '4px',
            marginBottom: '10px',
            fontSize: '14px'
          }}>
            게스트 모드: 조회만 가능합니다.
          </div>
        )}
        <div className="header-actions">
            {user && ['admin', 'user'].includes(user.role) && (
              <>
                <button
                  className="testcase-btn testcase-btn-ai"
                  onClick={() => setShowAiModal(true)}
                >
                  AI TC 생성
                </button>
                <button
                  className="testcase-btn testcase-btn-add"
                  onClick={() => setShowAddModal(true)}
                >
                  테스트 케이스 추가
                </button>
                <button 
                  className="testcase-btn testcase-btn-upload"
                  onClick={() => setShowUploadModal(true)}
                >
                  엑셀 업로드
                </button>
              </>
            )}
            <button 
              className="testcase-btn testcase-btn-download"
              onClick={handleDownload}
            >
              엑셀 다운로드
            </button>
            {user && ['admin', 'user'].includes(user.role) && selectedTestCases.length > 0 && (
              <>
                <button 
                  className="testcase-btn testcase-btn-execute"
                  onClick={() => setShowMoveModal(true)}
                >
                  📁 폴더 이동 ({selectedTestCases.length})
                </button>
                {user.role === 'admin' && (
                  <button 
                    className="testcase-btn testcase-btn-delete"
                    onClick={handleBulkDelete}
                  >
                    🗑️ 다중 삭제 ({selectedTestCases.length})
                  </button>
                )}
              </>
            )}
          </div>
      </div>

      <TestCaseSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        environmentFilter={environmentFilter}
        onEnvironmentFilterChange={setEnvironmentFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        creatorFilter={creatorFilter}
        onCreatorFilterChange={setCreatorFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        onClearFilters={clearAllFilters}
        uniqueEnvironments={uniqueEnvironments}
        uniqueCategories={uniqueCategories}
        uniqueCreators={uniqueCreators}
        uniqueAssignees={uniqueAssignees}
        totalItems={totalItems}
      />

      <div className="testcase-content">
        {/* 폴더 트리 */}
        <div className="folder-tree">
          <h3>폴더 구조</h3>
          <div className="folder-controls">
            {selectedFolder && (
              <button 
                className="testcase-btn testcase-btn-secondary"
                onClick={() => setSelectedFolder(null)}
                style={{ fontSize: '0.8em', padding: '4px 8px' }}
              >
                전체 보기
              </button>
            )}
          </div>
          <div className="tree-container">
            <div className="tree-scroll-inner">
              {renderFolderTree(folderTree)}
            </div>
          </div>
        </div>

        {/* 테스트 케이스 목록 */}
        <div className="testcase-list">
          {/* 상태 카운터 바 */}
          <div className="tc-status-counter-bar">
            {[
              { label: '전체', value: statusSummary.total, cls: 'tc-counter-total' },
              { label: 'Pass', value: statusSummary.pass, cls: 'tc-counter-pass' },
              { label: 'Fail', value: statusSummary.fail, cls: 'tc-counter-fail' },
              { label: 'N/T', value: statusSummary.ntCombined, cls: 'tc-counter-nt' },
              { label: 'N/A', value: statusSummary.na, cls: 'tc-counter-na' },
              { label: 'Block', value: statusSummary.block, cls: 'tc-counter-block' },
            ].map(item => (
              <div key={item.label} className={`tc-counter-item ${item.cls}`}>
                <div className="tc-counter-label">{item.label}</div>
                <div className="tc-counter-value">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Pass Rate 패널 + 주간 활동 */}
          <div className="testcase-stats">
            {/* Pass Rate 현황 */}
            <div className="stats-card tc-passrate-panel">
              <div className="stats-title">Pass Rate 현황</div>
              <div className="tc-passrate-body">
                <div className="tc-passrate-donut-wrap">
                  <svg className="tc-passrate-donut-svg" viewBox="0 0 100 100" role="img">
                    {statusSummary.total === 0 ? (
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e3e5" strokeWidth="16" />
                    ) : pieSegments.length === 1 ? (
                      <circle cx="50" cy="50" r="38" fill="none" stroke={pieSegments[0].color} strokeWidth="16" />
                    ) : (
                      pieSegments.map((segment) => {
                        const s = polarToCartesian(50, 50, 38, segment.startAngle);
                        const e = polarToCartesian(50, 50, 38, segment.endAngle);
                        const large = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
                        return (
                          <path
                            key={segment.key}
                            d={`M ${s.x} ${s.y} A 38 38 0 ${large} 1 ${e.x} ${e.y}`}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="16"
                            strokeLinecap="butt"
                          >
                            <title>{`${segment.label}: ${segment.value} (${segment.percent}%)`}</title>
                          </path>
                        );
                      })
                    )}
                    <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a2a40">{statusSummary.passRate}%</text>
                    <text x="50" y="59" textAnchor="middle" fontSize="7" fill="#888">Pass Rate</text>
                  </svg>
                </div>
                <div className="tc-passrate-details">
                  <div className="tc-passrate-bar-row">
                    {[
                      { v: statusSummary.pass, c: '#28a745' },
                      { v: statusSummary.fail, c: '#dc3545' },
                      { v: statusSummary.ntCombined, c: '#e2e3e5' },
                      { v: statusSummary.block, c: '#ffc107' },
                    ].map((s, i) => (
                      <div key={i} className="tc-bar-seg" style={{ flex: s.v || 0.01, backgroundColor: s.c }} />
                    ))}
                  </div>
                  <div className="tc-passrate-stat-list">
                    {[
                      { label: 'Pass', v: statusSummary.pass, pct: statusSummary.percentPass, c: '#28a745' },
                      { label: 'Fail', v: statusSummary.fail, pct: statusSummary.percentFail, c: '#dc3545' },
                      { label: 'N/T', v: statusSummary.ntCombined, pct: statusSummary.percentNt, c: '#e2e3e5' },
                      { label: 'Block', v: statusSummary.block, pct: statusSummary.percentBlock, c: '#ffc107' },
                    ].map(s => (
                      <div key={s.label} className="tc-stat-item">
                        <span className="tc-stat-dot" style={{ backgroundColor: s.c }} />
                        <span className="tc-stat-label">{s.label}</span>
                        <span className="tc-stat-value">{s.v}</span>
                        <span className="tc-stat-pct">{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="tc-passrate-footer">
                    완료 {statusSummary.pass} / 잔여 {statusSummary.total - statusSummary.pass} · 총 {statusSummary.total}건
                  </div>
                </div>
              </div>
            </div>

            {/* 주간 활동 */}
            <div className="stats-card tc-weekly-panel">
              <div className="stats-title">주간 활동</div>
              <div className="tc-weekly-body">
                {weeklyActivity ? [
                  { key: 'new_tc', label: '신규 TC 등록' },
                  { key: 'passed', label: 'Pass 완료' },
                  { key: 'failed', label: 'Fail 등록' },
                ].map(({ key, label }) => {
                  const thisWeek = weeklyActivity.this_week[key] || 0;
                  const lastWeek = weeklyActivity.last_week[key] || 0;
                  const diff = thisWeek - lastWeek;
                  return (
                    <div key={key} className="tc-activity-row">
                      <span className="tc-activity-label">{label}</span>
                      <span className="tc-activity-value">{thisWeek}</span>
                      <span className={`tc-activity-diff ${diff > 0 ? 'diff-up' : diff < 0 ? 'diff-down' : 'diff-neutral'}`}>
                        {diff > 0 ? '▲' : diff < 0 ? '▼' : '-'} {Math.abs(diff)} 지난 주
                      </span>
                    </div>
                  );
                }) : (
                  <div className="tc-activity-loading">로딩 중...</div>
                )}
              </div>
            </div>
          </div>
          <div className="testcase-list-header">
            <h3>
              테스트 케이스 ({totalItems}개)
              {selectedFolder && (
                <span className="folder-filter-info">
                  - {findFolderInTree(folderTree, selectedFolder)?.type === 'environment' ? '환경' : 
                     findFolderInTree(folderTree, selectedFolder)?.type === 'deployment_date' ? '배포일자' : 
                     findFolderInTree(folderTree, selectedFolder)?.type === 'feature' ? '기능명' : ''} 필터링됨
                </span>
              )}
            </h3>
            <div className="selection-controls">
              {selectedTestCases.length > 0 && (
                <span className="selected-count">
                  {selectedTestCases.length}개 선택됨
                </span>
              )}
            </div>
          </div>

          <TestCaseTable
            testCases={getPaginatedTestCases()}
            selectedTestCases={selectedTestCases}
            onSelectTestCase={handleSelectTestCase}
            onSelectAll={handleSelectAll}
            onStatusChange={handleStatusChange}
            onAssigneeChange={handleAssigneeChange}
            onEdit={(testCase) => {
                              setEditingTestCase(testCase);
                              setShowEditModal(true);
                            }}
            onDelete={handleDeleteTestCase}
            onExecute={handleExecuteAutomation}
            onViewDetails={(testCase) => {
              setSelectedTestCase(testCase);
              fetchComments(testCase.id);
            }}
            users={users}
            user={user}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          <TestCasePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>

        {/* 테스트 케이스 상세 패널 */}
        <SlidePanel
          isOpen={!!selectedTestCase}
          onClose={() => { setSelectedTestCase(null); setComments([]); }}
          title="상세 정보"
        >
          {selectedTestCase && (
            <div className="detail-panel-body">
              <div className="testcase-info-table">
                <table className="info-table">
                  <tbody>
                    <tr>
                      <th>대분류</th>
                      <td>{selectedTestCase.main_category || '없음'}</td>
                      <th>중분류</th>
                      <td>{selectedTestCase.sub_category || '없음'}</td>
                    </tr>
                    <tr>
                      <th>소분류</th>
                      <td>{selectedTestCase.detail_category || '없음'}</td>
                      <th>환경</th>
                      <td>
                        <span className={`environment-badge ${selectedTestCase.environment || 'dev'}`}>
                          {selectedTestCase.environment || 'dev'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>중요도</th>
                      <td>
                        {selectedTestCase.priority ? (
                          <span className={`priority-badge priority-${selectedTestCase.priority}`}>
                            {{ critical: '긴급', high: '높음', medium: '중간', low: '낮음' }[selectedTestCase.priority] || selectedTestCase.priority}
                          </span>
                        ) : '없음'}
                      </td>
                      <th>TC No.</th>
                      <td>{selectedTestCase.tc_number || '-'}</td>
                    </tr>
                    <tr>
                      <th>작성자</th>
                      <td>
                        <span className="creator-badge">
                          👤 {selectedTestCase.creator_name || '없음'}
                        </span>
                      </td>
                      <th>담당자</th>
                      <td>
                        <span className="assignee-badge">
                          👤 {selectedTestCase.assignee_name || '없음'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>사전조건</th>
                      <td colSpan="3" className="pre-condition">
                        {selectedTestCase.pre_condition || '없음'}
                      </td>
                    </tr>
                    <tr>
                      <th>기대결과</th>
                      <td colSpan="3" className="expected-result">
                        <div className="expected-result-content">
                          {selectedTestCase.expected_result || '없음'}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>비고</th>
                      <td colSpan="3" className="remark">
                        {selectedTestCase.remark || '없음'}
                      </td>
                    </tr>
                    <tr>
                      <th>생성일</th>
                      <td>{selectedTestCase.created_at ? formatUTCToKST(selectedTestCase.created_at) : '없음'}</td>
                      <th>수정일</th>
                      <td>{selectedTestCase.updated_at ? formatUTCToKST(selectedTestCase.updated_at) : '없음'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 댓글 섹션 */}
              <div className="testcase-comments-section">
                <h5>💬 댓글 ({comments.length})</h5>
                <div className="comments-container">
                  {loadingComments ? (
                    <div className="comments-loading">댓글을 불러오는 중...</div>
                  ) : comments.length === 0 ? (
                    <div className="no-comments">
                      <p>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
                    </div>
                  ) : (
                    <div className="comments-list">
                      {comments.map((comment) => {
                        const isOwnComment = user && (comment.author_id === user.id || comment.author?.id === user.id);
                        const canModifyComment = user && ['admin', 'user'].includes(user.role);
                        const isEditing = editingCommentId === comment.id;
                        
                        return (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-header">
                              <div className="comment-header-left">
                                <span className="comment-author">
                                  👤 {comment.author_name || getUserDisplayName(comment.author) || 'Unknown User'}
                                </span>
                                <span className="comment-date">
                                  {comment.created_at ? formatUTCToKST(comment.created_at) : ''}
                                  {comment.is_edited && <span className="comment-edited-badge"> (수정됨)</span>}
                                </span>
                              </div>
                              {canModifyComment && isOwnComment && !isEditing && (
                                <div className="comment-actions">
                                  <button
                                    className="comment-edit-btn"
                                    onClick={() => handleStartEdit(comment)}
                                    title="댓글 수정"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="comment-delete-btn"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    title="댓글 삭제"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="comment-edit-form">
                                <textarea
                                  className="comment-textarea"
                                  value={editingCommentContent}
                                  onChange={(e) => handleEditCommentChange(e.target.value)}
                                  onKeyDown={handleEditCommentKeyDown}
                                  rows="3"
                                />
                                {showEditMentions && editMentionCandidates.length > 0 && (
                                  <div
                                    className="mention-list"
                                    style={{
                                      border: '1px solid #e9ecef',
                                      borderRadius: '8px',
                                      maxHeight: '200px',
                                      overflowY: 'auto',
                                      marginBottom: '12px'
                                    }}
                                  >
                                    {editMentionCandidates.map((u, index) => (
                                      <button
                                        key={u.id}
                                        type="button"
                                        className="mention-item"
                                        onClick={() => handleEditMentionSelect(u)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          width: '100%',
                                          padding: '8px 12px',
                                          border: 'none',
                                          background: index === editMentionIndex ? '#f1f3f5' : 'white',
                                          cursor: 'pointer',
                                          textAlign: 'left'
                                        }}
                                      >
                                        <span style={{ marginRight: '8px' }}>👤</span>
                                        <span>{getUserDisplayName(u)}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="comment-edit-actions">
                                  <button
                                    className="testcase-btn testcase-btn-primary"
                                    onClick={() => handleUpdateComment(comment.id)}
                                    disabled={!editingCommentContent.trim()}
                                  >
                                    저장
                                  </button>
                                  <button
                                    className="testcase-btn testcase-btn-secondary"
                                    onClick={handleCancelEdit}
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="comment-body">
                                {comment.content}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* 댓글 작성 */}
                  {user && ['admin', 'user'].includes(user.role) && (
                    <div className="comment-add">
                      <textarea
                        className="comment-textarea"
                        placeholder="댓글을 입력하세요... (@username 형식으로 멘션 가능)"
                        value={newComment}
                        onChange={(e) => handleCommentChange(e.target.value)}
                        onKeyDown={handleCommentKeyDown}
                        rows="3"
                      />
                      {showCommentMentions && commentMentionCandidates.length > 0 && (
                        <div
                          className="mention-list"
                          style={{
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            marginBottom: '12px'
                          }}
                        >
                          {commentMentionCandidates.map((u, index) => (
                            <button
                              key={u.id}
                              type="button"
                              className="mention-item"
                              onClick={() => handleNewMentionSelect(u)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                background: index === commentMentionIndex ? '#f1f3f5' : 'white',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              <span style={{ marginRight: '8px' }}>👤</span>
                              <span>{getUserDisplayName(u)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        className="testcase-btn testcase-btn-primary"
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        댓글 작성
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 이슈 관리 */}
              <div className="testcase-jira-integration">
                <h5>🔗 이슈 관리</h5>
                <JiraIssuesList modalMode={false} testCaseId={selectedTestCase?.id} />
              </div>
            </div>
          )}
        </SlidePanel>
      </div>

      {/* 모달들 */}
      <TestCaseFormModal
        isOpen={showAddModal}
        onClose={() => {
                  setShowAddModal(false);
          setNewTestCase(defaultTestCase);
        }}
        testCase={newTestCase || defaultTestCase}
        onChange={setNewTestCase}
        onSubmit={handleAddTestCase}
        onCancel={() => {
                  setShowAddModal(false);
          setNewTestCase(defaultTestCase);
        }}
        users={users}
        isEdit={false}
        onOpenAiModal={() => { setShowAddModal(false); setShowAiModal(true); }}
      />

      <TestCaseFormModal
        isOpen={showEditModal}
        onClose={() => {
                  setShowEditModal(false);
                  setEditingTestCase(null);
                }}
        testCase={editingTestCase || defaultTestCase}
        onChange={setEditingTestCase}
        onSubmit={handleEditTestCase}
        onCancel={() => {
                  setShowEditModal(false);
                  setEditingTestCase(null);
                }}
        users={users}
        isEdit={true}
        onOpenAiModal={() => { setShowEditModal(false); setShowAiModal(true); }}
      />

      <AiTcModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onSaveTc={handleSaveAiTc}
        onSendToForm={handleSendToForm}
        selectedFolderId={selectedFolder}
      />

      {/* 업로드 모달 */}
      <TestCaseModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploadFolderId('');
        }}
        title="엑셀 파일 업로드"
        size="medium"
        actions={
          <>
            <button 
              className="testcase-btn testcase-btn-primary"
              onClick={handleFileUpload}
            >
              업로드
            </button>
              <button 
                className="testcase-btn testcase-btn-secondary"
                onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                }}
              >
              취소
              </button>
          </>
        }
      >
        <div className="form-group">
          <label>엑셀 파일 선택</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <p className="help-text">지원 형식: .xlsx 파일</p>
        </div>
        <div className="form-group">
          <label>폴더 선택 (선택 사항)</label>
          <select
            value={uploadFolderId}
            onChange={(e) => setUploadFolderId(e.target.value)}
            className="form-control"
          >
            <option value="">-- 폴더 미지정 (엑셀 데이터 사용) --</option>
            {allFolders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.folder_name} ({folder.folder_type})
              </option>
            ))}
          </select>
          <p className="help-text">선택 시 모든 행에 해당 폴더가 적용됩니다</p>
        </div>
      </TestCaseModal>

      {/* 폴더 이동 모달 */}
      <TestCaseModal
        isOpen={showMoveModal}
        onClose={() => { setShowMoveModal(false); setMoveTargetFolderId(''); }}
        title={`폴더 이동 (${selectedTestCases.length}개 선택)`}
        size="small"
        actions={
          <>
            <button className="testcase-btn testcase-btn-primary" onClick={handleBulkMove}>
              이동
            </button>
            <button className="testcase-btn testcase-btn-secondary" onClick={() => { setShowMoveModal(false); setMoveTargetFolderId(''); }}>
              취소
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>이동할 폴더 선택</label>
          <select
            value={moveTargetFolderId}
            onChange={e => setMoveTargetFolderId(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
          >
            <option value="">-- 폴더를 선택하세요 --</option>
            {allFolders && allFolders.map(f => (
              <option key={f.id} value={f.id}>
                [{f.environment || f.folder_type}] {f.folder_name}
              </option>
            ))}
          </select>
        </div>
      </TestCaseModal>
    </div>
  );
};

export default TestCaseAPP;
