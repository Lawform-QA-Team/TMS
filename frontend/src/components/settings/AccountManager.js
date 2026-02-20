import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';
import { formatUTCToKST } from '@tms/utils/dateUtils';
import '@tms/components/settings/AccountManager.css';

axios.defaults.baseURL = config.apiUrl;

const AccountManager = () => {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // axios 기본 설정 - 모든 요청에 토큰 자동 포함
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // 새 사용자 데이터
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'user'
  });

  // 수정할 사용자 데이터
  const [editUser, setEditUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'user',
    is_active: true
  });

  // 비밀번호 변경 데이터
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 프로필 수정 데이터
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      // profileData 업데이트
      setProfileData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || ''
      });
    }
  }, [currentUser]);


  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      if (!token) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        return;
      }
      if (!currentUser) {
        setUsers([]);
        return;
      }

      const url = (currentUser.role === 'admin') ? '/users' : '/users/list';
      const response = await axios.get(url);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (!silent) {
        if (err.response?.status === 403) {
          setError('권한이 없습니다. 다시 로그인해주세요.');
          localStorage.removeItem('token');
          window.location.reload();
        } else {
          setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
        }
      }
      throw err;
    } finally {
      if (!silent) setLoading(false);
    }
  };



  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email) {
      alert('사용자명과 이메일은 필수입니다.');
      return;
    }

    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
        // 비밀번호가 없으면 기본 비밀번호(1q2w#E$R)가 자동으로 설정됩니다.
      };
      
      const response = await axios.post('/users', userData);
      
      if (response.data.default_password) {
        alert(`사용자가 성공적으로 추가되었습니다.\n기본 비밀번호: ${response.data.default_password}`);
      } else {
        alert('사용자가 성공적으로 추가되었습니다.');
      }
      
      setShowAddUserModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'User'
      });
      fetchUsers();
    } catch (err) {
      alert('사용자 추가 중 오류가 발생했습니다: ' + err.response?.data?.error || err.message);
    }
  };

  const handleEditUser = async () => {
    if (!editUser.username || !editUser.email) {
      alert('사용자명과 이메일은 필수입니다.');
      return;
    }

    try {
      const updateData = {
        username: editUser.username,
        email: editUser.email,
        role: editUser.role,
        is_active: editUser.is_active
      };
      
      // 비밀번호가 입력된 경우에만 포함
      if (editUser.password) {
        updateData.password = editUser.password;
      }
      
      await axios.put(`/users/${selectedUser.id}`, updateData);
      alert('사용자 정보가 성공적으로 수정되었습니다.');
      setShowEditUserModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert('사용자 수정 중 오류가 발생했습니다: ' + err.response?.data?.error || err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/users/${userId}`);
      alert('사용자가 성공적으로 삭제되었습니다.');
      fetchUsers();
    } catch (err) {
      alert('사용자 삭제 중 오류가 발생했습니다: ' + err.response?.data?.error || err.message);
    }
  };

  const [togglingUserId, setTogglingUserId] = useState(null);

  const handleToggleActive = async (user) => {
    if (togglingUserId !== null) return;
    const newActive = !user.is_active;
    setTogglingUserId(user.id);

    // 낙관적 업데이트: 토글이 즉시 움직이도록 먼저 화면 반영
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: newActive } : u))
    );

    try {
      await axios.put(`/users/${user.id}`, { is_active: newActive });
      // 서버 반영 성공 후 목록만 조용히 다시 불러옴 (실패해도 화면은 유지)
      fetchUsers(true).catch(() => {});
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: user.is_active } : u))
      );
      alert('상태 변경 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    } finally {
      setTogglingUserId(null);
    }
  };

  const getRoleLabel = (role) => {
    const labels = { admin: '관리자', user: '일반', guest: '게스트' };
    return labels[role] || role || '일반';
  };

  const getDisplayName = (user) => {
    if (user.last_name || user.first_name) {
      return `${user.last_name || ''}${user.first_name || ''}`.trim();
    }
    return user.username || user.email || '-';
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      if (response.ok) {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.json();
        alert('비밀번호 변경 중 오류가 발생했습니다: ' + (errorData.error || '알 수 없는 오류'));
      }
    } catch (err) {
      alert('비밀번호 변경 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      // 프로필 수정 API 호출
      const response = await fetch(`${config.apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: profileData.first_name,
          last_name: profileData.last_name
        })
      });

      if (response.ok) {
        alert('프로필이 성공적으로 수정되었습니다.');
        setShowProfileModal(false);
        // AuthContext에서 사용자 정보 새로고침
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert('프로필 수정 중 오류가 발생했습니다: ' + (errorData.error || '알 수 없는 오류'));
      }
    } catch (err) {
      alert('프로필 수정 중 오류가 발생했습니다: ' + err.message);
    }
  };


  const openEditUserModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      role: user.role || 'user',
      is_active: user.is_active
    });
    setShowEditUserModal(true);
  };

  const canDeleteUser = (user) => {
    // admin만 사용자 삭제 가능
    return currentUser?.role === 'admin' && user.id !== currentUser?.id;
  };

  const canEditUser = (user) => {
    // admin은 모든 사용자 수정 가능
    // user는 자신만 수정 가능
    return currentUser?.role === 'admin' || user.id === currentUser?.id;
  };

  const canViewUsers = () => {
    // 모든 인증된 사용자는 사용자 목록 조회 가능 (권한에 따라 다른 정보 표시)
    return currentUser && currentUser.role !== 'guest';
  };

  const canAddUser = () => {
    // admin만 새 사용자 추가 가능
    return currentUser?.role === 'admin';
  };

  if (loading) {
    return <div className="account-loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="account-error">{error}</div>;
  }

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>계정 관리</h2>
        {canAddUser() && (
          <button 
            className="btn btn-add"
            onClick={() => setShowAddUserModal(true)}
          >
            ➕ 새 사용자 추가
          </button>
        )}
      </div>

      <div className="account-content">
        {/* 내 계정 정보 - 사용자 목록과 동일한 테이블 형태 */}
        <div className="account-section account-section-table">
          <h3>내 계정 정보</h3>
          {currentUser?.role === 'guest' && (
            <div className="guest-notice">
              <p>⚠️ 게스트 계정으로는 제한된 기능만 사용할 수 있습니다.</p>
            </div>
          )}
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>계정(이메일)</th>
                  <th>권한</th>
                  <th>활성화/비활성화 상태</th>
                  <th>추가정보</th>
                  <th>추가기능</th>
                </tr>
              </thead>
              <tbody>
                {!currentUser ? (
                  <tr>
                    <td colSpan={6} className="col-empty">계정 정보를 불러오는 중...</td>
                  </tr>
                ) : (
                  <tr>
                    <td className="col-name">{getDisplayName(currentUser)}</td>
                    <td className="col-email">{currentUser.email || '-'}</td>
                    <td className="col-permissions">
                      <span className={`role-badge role-badge-inline ${(currentUser.role || 'user').toLowerCase()}`}>
                        {getRoleLabel(currentUser.role)}
                      </span>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${currentUser.is_active ? 'active' : 'inactive'}`}>
                        {currentUser.is_active ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="col-extra-info">
                      <span className="extra-info-text">
                        {currentUser?.created_at && (
                          <>
                            생성: {formatUTCToKST(currentUser.created_at)}
                            {currentUser?.last_login && <br />}
                          </>
                        )}
                        {currentUser?.last_login && <>마지막 로그인: {formatUTCToKST(currentUser.last_login)}</>}
                        {!currentUser?.created_at && !currentUser?.last_login && '-'}
                      </span>
                    </td>
                    <td className="col-actions">
                      {currentUser?.role !== 'guest' && (
                        <>
                          <button
                            type="button"
                            className="btn-text btn-edit"
                            onClick={() => setShowProfileModal(true)}
                          >
                            프로필 수정
                          </button>
                          <button
                            type="button"
                            className="btn-text btn-password"
                            onClick={() => setShowPasswordModal(true)}
                          >
                            비밀번호 변경
                          </button>
                        </>
                      )}
                      {currentUser?.role === 'guest' && (
                        <span className="guest-readonly">읽기 전용</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사용자 목록 - 테이블 형태 */}
        {canViewUsers() && (
          <div className="account-section account-section-table">
            <h3>사용자 목록</h3>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>계정(이메일)</th>
                    <th>권한</th>
                    <th>활성화/비활성화 상태</th>
                    <th>추가기능</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="col-name">{getDisplayName(user)}</td>
                      <td className="col-email">{user.email || '-'}</td>
                      <td className="col-permissions">
                        <span className={`role-badge role-badge-inline ${(user.role || 'user').toLowerCase()}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="col-status">
                        {currentUser?.role === 'admin' && user.id !== currentUser?.id ? (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={user.is_active}
                            disabled={togglingUserId === user.id}
                            className={`toggle-switch ${user.is_active ? 'on' : 'off'} ${togglingUserId === user.id ? 'toggle-busy' : ''}`}
                            onClick={() => handleToggleActive(user)}
                          >
                            <span className="toggle-slider">
                              {togglingUserId === user.id ? '...' : (user.is_active ? 'ON' : 'OFF')}
                            </span>
                          </button>
                        ) : (
                          <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? 'ON' : 'OFF'}
                          </span>
                        )}
                      </td>
                      <td className="col-actions">
                        {canEditUser(user) && (
                          <button
                            type="button"
                            className="btn-text btn-edit"
                            onClick={() => openEditUserModal(user)}
                          >
                            수정
                          </button>
                        )}
                        {canDeleteUser(user) && (
                          <button
                            type="button"
                            className="btn-text btn-delete"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 새 사용자 추가 모달 */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3>새 사용자 추가</h3>
            </div>
            <div className="modal-content-grid">
              <div className="modal-section">
                <h4>기본 정보</h4>
                <div className="form-group">
                  <label>ID:</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="사용자명을 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label>이메일:</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>이름:</label>
                    <input
                      type="text"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>성:</label>
                    <input
                      type="text"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                      placeholder="성을 입력하세요"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-section">
                <h4>계정 설정</h4>
                <div className="form-group">
                  <label>역할:</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">User (일반 사용자)</option>
                    <option value="admin">Admin (관리자)</option>
                    <option value="guest">Guest (게스트)</option>
                  </select>
                </div>
                <div className="form-group">
                  <small className="form-help">
                    * 비밀번호는 기본값(1q2w#E$R)으로 설정됩니다.
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleAddUser}>
                  추가
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 수정 모달 */}
      {showEditUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3>사용자 정보 수정</h3>
            </div>
            <div className="modal-content-grid">
              <div className="modal-section">
                <h4>기본 정보</h4>
                <div className="form-group">
                  <label>ID:</label>
                  <input
                    type="text"
                    value={editUser.username}
                    onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                    placeholder="사용자명을 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label>이메일:</label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>성:</label>
                    <input
                      type="text"
                      value={editUser.last_name}
                      onChange={(e) => setEditUser({...editUser, last_name: e.target.value})}
                      placeholder="성을 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>이름:</label>
                    <input
                      type="text"
                      value={editUser.first_name}
                      onChange={(e) => setEditUser({...editUser, first_name: e.target.value})}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-section">
                <h4>계정 설정</h4>
                <div className="form-group">
                  <label>역할:</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                  >
                    <option value="user">User (일반 사용자)</option>
                    <option value="admin">Admin (관리자)</option>
                    <option value="guest">Guest (게스트)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>계정 상태:</label>
                  <select
                    value={editUser.is_active}
                    onChange={(e) => setEditUser({...editUser, is_active: e.target.value === 'true'})}
                  >
                    <option value={true}>활성</option>
                    <option value={false}>비활성</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>새 비밀번호 (선택사항):</label>
                  <input
                    type="password"
                    value={editUser.password}
                    onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                    placeholder="변경하지 않으려면 비워두세요"
                  />
                  <small className="form-help">
                    비밀번호를 입력하면 기존 비밀번호가 변경됩니다.
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleEditUser}>
                  수정
                </button>
                <button className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>비밀번호 변경</h3>
            </div>
            <div className="modal-body">
            <div className="form-group">
              <label>현재 비밀번호:</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                placeholder="현재 비밀번호를 입력하세요"
              />
            </div>
            <div className="form-group">
              <label>새 비밀번호:</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                placeholder="새 비밀번호를 입력하세요"
              />
            </div>
            <div className="form-group">
              <label>새 비밀번호 확인:</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="새 비밀번호를 다시 입력하세요"
              />
            </div>
            </div>
            <div className="modal-footer">
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handlePasswordChange}>
                  변경
                </button>
                <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 수정 모달 */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3>프로필 수정</h3>
            </div>
            <div className="modal-content-grid">
              <div className="modal-section">
                <h4>기본 정보</h4>
                <div className="form-group">
                  <label>ID:</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                    placeholder="사용자명을 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label>이메일:</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="modal-section">
                <h4>개인 정보</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>성:</label>
                    <input
                      type="text"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                      placeholder="성을 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>이름:</label>
                    <input
                      type="text"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                </div>
              </div>

              
            </div>
            <div className="modal-footer">
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleProfileUpdate}>
                  수정
                </button>
                <button className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager; 