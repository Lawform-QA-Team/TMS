import React from 'react';

function GrafanaDashboard() {
  const url = process.env.REACT_APP_GRAFANA_PUBLIC_DASHBOARD_URL;

  if (!url) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Grafana 대시보드 URL이 설정되지 않았습니다.<br />
        <code>REACT_APP_GRAFANA_PUBLIC_DASHBOARD_URL</code> 환경변수를 설정해주세요.
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <iframe
        src={url}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Grafana Dashboard"
        allowFullScreen
      />
    </div>
  );
}

export default GrafanaDashboard;
