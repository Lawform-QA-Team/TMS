"""Add login_type to UserSessions and create LoginFailLogs

Revision ID: add_login_history
Revises: add_system_config
Create Date: 2026-05-11
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_login_history'
down_revision = 'add_system_config'
branch_labels = None
depends_on = None


def upgrade():
    # UserSessions에 login_type 컬럼 추가
    with op.batch_alter_table('UserSessions') as batch_op:
        batch_op.add_column(sa.Column('login_type', sa.String(20), nullable=True, server_default='password'))

    # LoginFailLogs 테이블 생성
    op.create_table(
        'LoginFailLogs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('username', sa.String(80), nullable=False),
        sa.Column('login_type', sa.String(20), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('LoginFailLogs')
    with op.batch_alter_table('UserSessions') as batch_op:
        batch_op.drop_column('login_type')
