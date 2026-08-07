"""Add UserAiConfigs table

Revision ID: add_user_ai_config
Revises: add_ai_conversations
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_user_ai_config'
down_revision = 'add_ai_conversations'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'UserAiConfigs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(20), nullable=False, server_default='openai'),
        sa.Column('api_key', sa.String(500), nullable=True),
        sa.Column('model_name', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['Users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )


def downgrade():
    op.drop_table('UserAiConfigs')
