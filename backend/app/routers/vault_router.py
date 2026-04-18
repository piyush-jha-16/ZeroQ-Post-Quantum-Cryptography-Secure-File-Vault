import base64
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import FileRecord, User
from schemas import DownloadResponse, FileMetadata, VaultStatsResponse

router = APIRouter(tags=["vault"])


@router.get("/users/{username}/keys")
def get_user_keys(username: str, db: Session = Depends(get_db)):
    """Retrieve public keys for a specific user."""
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "username": user.username,
        "ml_kem_pub_key": user.ml_kem_pub_key,
        "ml_dsa_pub_key": user.ml_dsa_pub_key,
    }


@router.post("/vault/upload")
async def upload_file(
    receiver_username: str = Form(...),
    kem_ciphertext: str = Form(...),
    aes_nonce: str = Form(...),
    digital_signature: str = Form(...),
    original_filename: str = Form(...),
    encrypted_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload an encrypted file to the vault."""
    # Find receiver
    receiver = db.query(User).filter(User.username == receiver_username).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receiver user not found"
        )
    
    # Read encrypted file bytes
    file_bytes = await encrypted_file.read()
    
    # Create file record
    file_record = FileRecord(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        encrypted_file_blob=file_bytes,
        kem_ciphertext=kem_ciphertext,
        aes_nonce=aes_nonce,
        digital_signature=digital_signature,
        original_filename=original_filename,
    )
    
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    
    return {
        "file_id": str(file_record.id),
        "message": "File uploaded successfully"
    }


@router.get("/vault/inbox", response_model=list[FileMetadata])
def get_inbox(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all files in the current user's inbox."""
    files = db.query(FileRecord, User.username).join(
        User, FileRecord.sender_id == User.id
    ).filter(
        FileRecord.receiver_id == current_user.id
    ).order_by(
        desc(FileRecord.created_at)
    ).all()
    
    result = []
    for file_record, sender_username in files:
        result.append(FileMetadata(
            id=file_record.id,
            sender_username=sender_username,
            original_filename=file_record.original_filename,
            created_at=file_record.created_at,
        ))
    
    return result


@router.get("/vault/stats", response_model=VaultStatsResponse)
def get_vault_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return dashboard counters for the current user."""
    total_files_shared = db.query(FileRecord).filter(
        FileRecord.sender_id == current_user.id
    ).count()

    files_received = db.query(FileRecord).filter(
        FileRecord.receiver_id == current_user.id
    ).count()

    return {
        "total_files_shared": total_files_shared,
        "files_received": files_received,
    }


@router.get("/vault/download/{file_id}", response_model=DownloadResponse)
def download_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download an encrypted file from the vault."""
    # Find file record
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check authorization
    if file_record.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to download this file"
        )
    
    # Fetch sender
    sender = db.query(User).filter(User.id == file_record.sender_id).first()
    
    # Encode encrypted blob as Base64
    encrypted_blob_b64 = base64.b64encode(file_record.encrypted_file_blob).decode('utf-8')
    
    return {
        "kem_ciphertext": file_record.kem_ciphertext,
        "aes_nonce": file_record.aes_nonce,
        "digital_signature": file_record.digital_signature,
        "encrypted_file_blob": encrypted_blob_b64,
        "sender_username": sender.username,
        "sender_ml_dsa_pub_key": sender.ml_dsa_pub_key,
    }
