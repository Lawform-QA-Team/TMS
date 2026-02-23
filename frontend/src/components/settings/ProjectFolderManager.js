import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';
import '@tms/components/settings/ProjectFolderManager.css';

axios.defaults.baseURL = config.apiUrl;

const ProjectFolderManager = () => {
  const { user: currentUser, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolder, setNewFolder] = useState({
    folder_name: '',
    folder_type: 'environment',
    environment: 'dev',
    parent_folder_id: null,
    deployment_date: '',
    project_id: null
  });

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchFolders();
      fetchFolderTree();
    } else {
      setFolders([]);
      setFolderTree([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/projects');
      const list = res.data || [];
      setProjects(list);
      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(list[0].id);
      }
      if (selectedProjectId && !list.find((p) => p.id === selectedProjectId)) {
        setSelectedProjectId(list.length ? list[0].id : null);
      }
      setError(null);
    } catch (err) {
      setError('프로젝트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/folders`);
      const data = response.data.data || response.data.items || response.data;
      setFolders(Array.isArray(data) ? data : []);
    } catch (err) {
      setFolders([]);
    }
  };

  const fetchFolderTree = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/folders/tree`);
      setFolderTree(response.data.data || response.data || []);
    } catch (err) {
      setFolderTree([]);
    }
  };

  const getErrorMessage = (err, fallback) =>
    err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;

  const canManageProjects = () => currentUser?.role === 'admin';
  const canManageFolders = () => currentUser && (currentUser.role === 'admin' || currentUser.role === 'user');

  const foldersForProject = selectedProjectId
    ? folders.filter((f) => f.project_id === selectedProjectId)
    : [];

  const getParentFolderOptions = () => {
    const options = [];
    const projectNode = folderTree.find((p) => p.type === 'project' && p.id === selectedProjectId);
    const environments = projectNode?.children || [];
    environments.forEach((envFolder) => {
      options.push({ id: envFolder.id, name: `🌍 ${envFolder.name} (환경)`, type: 'environment' });
      (envFolder.children || []).forEach((depFolder) => {
        options.push({ id: depFolder.id, name: `📅 ${depFolder.name} (배포일자)`, type: 'deployment_date' });
        (depFolder.children || []).forEach((featureFolder) => {
          options.push({ id: featureFolder.id, name: `🔧 ${featureFolder.name} (기능명)`, type: 'feature' });
        });
      });
    });
    return options;
  };

  const handleAddProject = async () => {
    if (!newProject.name) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }
    try {
      await axios.post('/projects', newProject);
      alert('프로젝트가 성공적으로 추가되었습니다.');
      setShowAddProjectModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      alert(getErrorMessage(err, '프로젝트 추가 중 오류가 발생했습니다.'));
    }
  };

  const handleEditProject = async () => {
    if (!editingProject?.name) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }
    try {
      await axios.put(`/projects/${editingProject.id}`, editingProject);
      alert('프로젝트가 성공적으로 수정되었습니다.');
      setShowEditProjectModal(false);
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      alert(getErrorMessage(err, '프로젝트 수정 중 오류가 발생했습니다.'));
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/projects/${projectId}`);
      alert('프로젝트가 성공적으로 삭제되었습니다.');
      if (selectedProjectId === projectId) setSelectedProjectId(projects[0]?.id || null);
      fetchProjects();
    } catch (err) {
      alert(getErrorMessage(err, '프로젝트 삭제 중 오류가 발생했습니다.'));
    }
  };

  const handleAddFolder = async () => {
    if (!newFolder.folder_name) {
      alert('폴더명을 입력해주세요.');
      return;
    }
    try {
      await axios.post(`${config.apiUrl}/folders`, {
        ...newFolder,
        project_id: newFolder.project_id || selectedProjectId
      });
      alert('폴더가 성공적으로 추가되었습니다.');
      setShowAddFolderModal(false);
      setNewFolder({
        folder_name: '',
        folder_type: 'environment',
        environment: 'dev',
        parent_folder_id: null,
        deployment_date: '',
        project_id: selectedProjectId
      });
      fetchFolders();
      fetchFolderTree();
    } catch (err) {
      alert(getErrorMessage(err, '폴더 추가 중 오류가 발생했습니다.'));
    }
  };

  const handleEditFolder = async () => {
    if (!editingFolder?.folder_name) {
      alert('폴더명을 입력해주세요.');
      return;
    }
    try {
      await axios.put(`${config.apiUrl}/folders/${editingFolder.id}`, {
        ...editingFolder,
        project_id: editingFolder.project_id || selectedProjectId
      });
      alert('폴더가 성공적으로 수정되었습니다.');
      setShowEditFolderModal(false);
      setEditingFolder(null);
      fetchFolders();
      fetchFolderTree();
    } catch (err) {
      alert(getErrorMessage(err, '폴더 수정 중 오류가 발생했습니다.'));
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('정말로 이 폴더를 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`${config.apiUrl}/folders/${folderId}`);
      alert('폴더가 성공적으로 삭제되었습니다.');
      fetchFolders();
      fetchFolderTree();
    } catch (err) {
      alert(getErrorMessage(err, '폴더 삭제 중 오류가 발생했습니다.'));
    }
  };

  if (loading && projects.length === 0) {
    return <div className="project-folder-loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="project-folder-error">{error}</div>;
  }

  return (
    <div className="project-folder-manager">
      <div className="project-folder-header">
        <h2>📁 프로젝트·폴더 관리</h2>
      </div>

      {/* 프로젝트 영역 */}
      <section className="project-folder-section">
        <h3>프로젝트</h3>
        <div className="section-header-actions">
          {canManageProjects() && (
            <button type="button" className="btn btn-add" onClick={() => setShowAddProjectModal(true)}>
              ➕ 새 프로젝트
            </button>
          )}
        </div>
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>프로젝트명</th>
                <th>설명</th>
                <th>추가기능</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="col-empty">
                    등록된 프로젝트가 없습니다.
                    {canManageProjects() && (
                      <button type="button" className="btn btn-add-inline" onClick={() => setShowAddProjectModal(true)}>
                        첫 번째 프로젝트 추가하기
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id}>
                    <td className="col-name">{project.name}</td>
                    <td className="col-description">{project.description || '설명 없음'}</td>
                    <td className="col-actions">
                      {canManageProjects() && (
                        <>
                          <button
                            type="button"
                            className="btn-text btn-edit"
                            onClick={() => {
                              setEditingProject(project);
                              setShowEditProjectModal(true);
                            }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="btn-text btn-delete"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 폴더 영역 - GNB와 동일: 프로젝트 선택 후 해당 프로젝트 폴더 테이블 */}
      <section className="project-folder-section">
        <h3>폴더</h3>
        <div className="section-header-actions folder-toolbar">
          <div className="project-filter">
            <label>프로젝트 선택</label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">선택하세요</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {canManageFolders() && selectedProjectId && (
            <button
              type="button"
              className="btn btn-add"
              onClick={() => {
                setNewFolder((prev) => ({ ...prev, project_id: selectedProjectId }));
                setShowAddFolderModal(true);
              }}
            >
              ➕ 새 폴더
            </button>
          )}
        </div>
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>폴더명</th>
                <th>타입</th>
                <th>환경</th>
                <th>배포일자</th>
                <th>추가기능</th>
              </tr>
            </thead>
            <tbody>
              {!selectedProjectId ? (
                <tr>
                  <td colSpan={5} className="col-empty">
                    위에서 프로젝트를 선택하세요.
                  </td>
                </tr>
              ) : foldersForProject.length === 0 ? (
                <tr>
                  <td colSpan={5} className="col-empty">
                    이 프로젝트에 등록된 폴더가 없습니다.
                    {canManageFolders() && (
                      <button
                        type="button"
                        className="btn btn-add-inline"
                        onClick={() => setShowAddFolderModal(true)}
                      >
                        첫 번째 폴더 추가하기
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                foldersForProject.map((folder) => (
                  <tr key={folder.id}>
                    <td className="col-name">{folder.folder_name}</td>
                    <td className="col-type">
                      <span className={`folder-type-badge ${folder.folder_type || ''}`}>
                        {folder.folder_type === 'environment'
                          ? '환경'
                          : folder.folder_type === 'deployment_date'
                            ? '배포일자'
                            : folder.folder_type === 'feature'
                              ? '기능명'
                              : folder.folder_type || '미분류'}
                      </span>
                    </td>
                    <td className="col-env">{folder.environment || '-'}</td>
                    <td className="col-date">{folder.deployment_date || '-'}</td>
                    <td className="col-actions">
                      {canManageFolders() && (
                        <>
                          <button
                            type="button"
                            className="btn-text btn-edit"
                            onClick={() => {
                              setEditingFolder({ ...folder, project_id: folder.project_id || selectedProjectId });
                              setShowEditFolderModal(true);
                            }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="btn-text btn-delete"
                            onClick={() => handleDeleteFolder(folder.id)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 프로젝트 추가 모달 */}
      {showAddProjectModal && (
        <div className="modal-overlay fullscreen-modal">
          <div className="modal fullscreen-modal-content">
            <div className="modal-header">
              <h3>새 프로젝트 추가</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddProjectModal(false);
                  setNewProject({ name: '', description: '' });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>프로젝트명</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="프로젝트명을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="프로젝트 설명을 입력하세요"
                  rows={5}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={handleAddProject}>
                추가
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddProjectModal(false);
                  setNewProject({ name: '', description: '' });
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 수정 모달 */}
      {showEditProjectModal && editingProject && (
        <div className="modal-overlay fullscreen-modal">
          <div className="modal fullscreen-modal-content">
            <div className="modal-header">
              <h3>프로젝트 수정</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditProjectModal(false);
                  setEditingProject(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>프로젝트명</label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  placeholder="프로젝트명을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="프로젝트 설명을 입력하세요"
                  rows={5}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={handleEditProject}>
                수정
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditProjectModal(false);
                  setEditingProject(null);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 폴더 추가 모달 */}
      {showAddFolderModal && (
        <div className="modal-overlay fullscreen-modal">
          <div className="modal fullscreen-modal-content">
            <div className="modal-header">
              <h3>새 폴더 추가</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddFolderModal(false);
                  setNewFolder({
                    folder_name: '',
                    folder_type: 'environment',
                    environment: 'dev',
                    parent_folder_id: null,
                    deployment_date: '',
                    project_id: selectedProjectId
                  });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>폴더명</label>
                <input
                  type="text"
                  value={newFolder.folder_name}
                  onChange={(e) => setNewFolder({ ...newFolder, folder_name: e.target.value })}
                  placeholder="폴더명을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>폴더 타입</label>
                <select
                  value={newFolder.folder_type}
                  onChange={(e) => setNewFolder({ ...newFolder, folder_type: e.target.value })}
                >
                  <option value="environment">환경 (Environment)</option>
                  <option value="deployment_date">배포일자 (Deployment Date)</option>
                  <option value="feature">기능명 (Feature)</option>
                </select>
              </div>
              <div className="form-group">
                <label>환경</label>
                <select
                  value={newFolder.environment}
                  onChange={(e) => setNewFolder({ ...newFolder, environment: e.target.value })}
                >
                  <option value="dev">DEV</option>
                  <option value="alpha">ALPHA</option>
                  <option value="production">PRODUCTION</option>
                </select>
              </div>
              <div className="form-group">
                <label>상위 폴더</label>
                <select
                  value={newFolder.parent_folder_id || ''}
                  onChange={(e) =>
                    setNewFolder({
                      ...newFolder,
                      parent_folder_id: e.target.value ? Number(e.target.value) : null
                    })
                  }
                >
                  <option value="">없음 (최상위)</option>
                  {getParentFolderOptions().map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>배포일자</label>
                <input
                  type="date"
                  value={newFolder.deployment_date}
                  onChange={(e) => setNewFolder({ ...newFolder, deployment_date: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={handleAddFolder}>
                추가
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddFolderModal(false);
                  setNewFolder({
                    folder_name: '',
                    folder_type: 'environment',
                    environment: 'dev',
                    parent_folder_id: null,
                    deployment_date: '',
                    project_id: selectedProjectId
                  });
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 폴더 수정 모달 */}
      {showEditFolderModal && editingFolder && (
        <div className="modal-overlay fullscreen-modal">
          <div className="modal fullscreen-modal-content">
            <div className="modal-header">
              <h3>폴더 수정</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditFolderModal(false);
                  setEditingFolder(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>폴더명</label>
                <input
                  type="text"
                  value={editingFolder.folder_name}
                  onChange={(e) => setEditingFolder({ ...editingFolder, folder_name: e.target.value })}
                  placeholder="폴더명을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>폴더 타입</label>
                <select
                  value={editingFolder.folder_type}
                  onChange={(e) => setEditingFolder({ ...editingFolder, folder_type: e.target.value })}
                >
                  <option value="environment">환경 (Environment)</option>
                  <option value="deployment_date">배포일자 (Deployment Date)</option>
                  <option value="feature">기능명 (Feature)</option>
                </select>
              </div>
              <div className="form-group">
                <label>환경</label>
                <select
                  value={editingFolder.environment}
                  onChange={(e) => setEditingFolder({ ...editingFolder, environment: e.target.value })}
                >
                  <option value="dev">DEV</option>
                  <option value="alpha">ALPHA</option>
                  <option value="production">PRODUCTION</option>
                </select>
              </div>
              <div className="form-group">
                <label>상위 폴더</label>
                <select
                  value={editingFolder.parent_folder_id || ''}
                  onChange={(e) =>
                    setEditingFolder({
                      ...editingFolder,
                      parent_folder_id: e.target.value ? Number(e.target.value) : null
                    })
                  }
                >
                  <option value="">없음 (최상위)</option>
                  {getParentFolderOptions().map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>배포일자</label>
                <input
                  type="date"
                  value={editingFolder.deployment_date || ''}
                  onChange={(e) => setEditingFolder({ ...editingFolder, deployment_date: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={handleEditFolder}>
                수정
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditFolderModal(false);
                  setEditingFolder(null);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFolderManager;
