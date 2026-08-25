const config = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
    uploadUrl: process.env.REACT_APP_UPLOAD_URL || 'http://localhost:8000/uploads'
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || '',
    uploadUrl: process.env.REACT_APP_UPLOAD_URL || ''
  }
};

// 환경에 따라 동적으로 설정 선택
const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

// 환경 정보는 로그에 출력하지 않음
// prod: REACT_APP_API_URL = CloudFront 도메인
// REACT_APP_API_URL 에 /api 추가

export default currentConfig;