from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class RegisterRequest(BaseModel):
    username: str
    password: str
    ml_kem_pub_key: str
    ml_dsa_pub_key: str
    encrypted_private_keys: str
    key_salt: str
    key_nonce: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class KeyBackupResponse(BaseModel):
    encrypted_private_keys: str
    key_salt: str
    key_nonce: str


class UserKeysResponse(BaseModel):
    username: str
    ml_kem_pub_key: str
    ml_dsa_pub_key: str


class UploadPayload(BaseModel):
    receiver_username: str
    kem_ciphertext: str
    aes_nonce: str
    digital_signature: str
    original_filename: str


class FileMetadata(BaseModel):
    id: UUID
    sender_username: str
    original_filename: str
    created_at: datetime


class DownloadResponse(BaseModel):
    kem_ciphertext: str
    aes_nonce: str
    digital_signature: str
    encrypted_file_blob: str  # Base64-encoded
    sender_username: str
    sender_ml_dsa_pub_key: str


class VaultStatsResponse(BaseModel):
    total_files_shared: int
    files_received: int
