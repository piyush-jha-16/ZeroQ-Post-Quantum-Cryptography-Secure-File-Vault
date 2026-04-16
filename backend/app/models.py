import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, LargeBinary, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    ml_kem_pub_key = Column(Text, nullable=False)  # Base64-encoded
    ml_dsa_pub_key = Column(Text, nullable=False)  # Base64-encoded
    created_at = Column(DateTime, default=datetime.utcnow)


class FileRecord(Base):
    __tablename__ = "file_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    encrypted_file_blob = Column(LargeBinary, nullable=False)
    kem_ciphertext = Column(Text, nullable=False)  # Base64-encoded
    aes_nonce = Column(Text, nullable=False)  # Base64-encoded
    digital_signature = Column(Text, nullable=False)  # Base64-encoded
    original_filename = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Indexes for common queries
    __table_args__ = (
        Index("ix_file_records_receiver_id", "receiver_id"),
        Index("ix_file_records_sender_id", "sender_id"),
    )


class KeyBackup(Base):
    __tablename__ = "key_backups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    encrypted_private_keys = Column(Text, nullable=False)  # Base64-encoded encrypted JSON payload
    key_salt = Column(Text, nullable=False)  # Base64-encoded KDF salt
    key_nonce = Column(Text, nullable=False)  # Base64-encoded AES-GCM nonce
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
