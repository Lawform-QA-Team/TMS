"""Add AiConversations and AiConversationMessages tables

Revision ID: add_ai_conversations
Revises: add_login_history
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_ai_conversations'
down_revision = 'add_login_history'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'AiConversations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('folder_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['Users.id']),
        sa.ForeignKeyConstraint(['folder_id'], ['Folders.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'AiConversationMessages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['AiConversations.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        'ix_ai_conversation_messages_conversation_id',
        'AiConversationMessages',
        ['conversation_id']
    )


def downgrade():
    op.drop_index('ix_ai_conversation_messages_conversation_id', table_name='AiConversationMessages')
    op.drop_table('AiConversationMessages')
    op.drop_table('AiConversations')
