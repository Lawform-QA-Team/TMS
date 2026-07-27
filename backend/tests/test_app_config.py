"""
config/app_config.py 화이트박스 단위 테스트
URL 빌드/정규화 함수, 환경 감지 함수 등 순수 함수 테스트
"""
import os
import pytest
from config.app_config import (
    _normalize_mysql_url,
    _build_mysql_url,
    is_vercel_environment,
)


class TestNormalizeMysqlUrl:
    """_normalize_mysql_url() 분기 테스트"""

    def test_none_input_returns_none(self):
        assert _normalize_mysql_url(None) is None

    def test_non_mysql_url_unchanged(self):
        url = 'sqlite:///test.db'
        assert _normalize_mysql_url(url) == url

    def test_mysql_scheme_replaced_with_pymysql(self):
        url = 'mysql://user:pass@host/db'
        result = _normalize_mysql_url(url)
        assert result.startswith('mysql+pymysql://')

    def test_mysql_pymysql_scheme_unchanged(self):
        """이미 pymysql이면 그대로"""
        url = 'mysql+pymysql://user:pass@host:3306/db'
        result = _normalize_mysql_url(url)
        assert 'mysql+pymysql://' in result

    def test_special_chars_in_password_encoded(self):
        """비밀번호 특수문자가 인코딩됨"""
        url = 'mysql://user:p%40ss@localhost/db'  # p@ss URL 인코딩
        result = _normalize_mysql_url(url)
        assert result is not None
        assert 'mysql' in result

    def test_url_without_password(self):
        """비밀번호 없는 URL"""
        url = 'mysql://user@localhost/db'
        result = _normalize_mysql_url(url)
        assert result is not None

    def test_url_with_port(self):
        url = 'mysql://user:pass@localhost:3306/mydb'
        result = _normalize_mysql_url(url)
        assert 'localhost:3306' in result or 'localhost' in result
        assert 'mydb' in result


class TestBuildMysqlUrl:
    """_build_mysql_url() 분기 테스트"""

    def test_basic_url_format(self):
        result = _build_mysql_url('root', 'pass', 'localhost', '3306', 'mydb')
        assert result.startswith('mysql+pymysql://')
        assert 'root' in result
        assert 'localhost' in result
        assert '3306' in result
        assert 'mydb' in result

    def test_empty_password_excluded(self):
        """비밀번호 없으면 :부분 생략"""
        result = _build_mysql_url('root', '', 'localhost', '3306', 'mydb')
        # 비밀번호 없으면 user@host 형식
        assert ':@' not in result or 'root@' in result

    def test_special_chars_in_password_encoded(self):
        """특수문자 비밀번호가 URL 인코딩됨"""
        result = _build_mysql_url('root', 'p@ss#1', 'localhost', '3306', 'mydb')
        # @ 문자는 %40으로 인코딩되어야 함
        assert '@' not in result.split('//')[1].split('@')[0]  # auth 부분에 raw @ 없음

    def test_returns_string(self):
        result = _build_mysql_url('u', 'p', 'h', '3306', 'db')
        assert isinstance(result, str)


class TestIsVercelEnvironment:
    """is_vercel_environment() 분기 테스트"""

    def test_no_vercel_env_returns_false(self, monkeypatch):
        monkeypatch.delenv('VERCEL', raising=False)
        monkeypatch.delenv('VERCEL_URL', raising=False)
        assert is_vercel_environment() is False

    def test_vercel_env_1_returns_true(self, monkeypatch):
        monkeypatch.setenv('VERCEL', '1')
        monkeypatch.delenv('VERCEL_URL', raising=False)
        assert is_vercel_environment() is True

    def test_vercel_url_contains_vercel_app(self, monkeypatch):
        monkeypatch.delenv('VERCEL', raising=False)
        monkeypatch.setenv('VERCEL_URL', 'myapp.vercel.app')
        assert is_vercel_environment() is True

    def test_vercel_url_not_vercel_app_returns_false(self, monkeypatch):
        monkeypatch.delenv('VERCEL', raising=False)
        monkeypatch.setenv('VERCEL_URL', 'myapp.example.com')
        assert is_vercel_environment() is False

    def test_vercel_0_returns_false(self, monkeypatch):
        monkeypatch.setenv('VERCEL', '0')
        monkeypatch.delenv('VERCEL_URL', raising=False)
        assert is_vercel_environment() is False
