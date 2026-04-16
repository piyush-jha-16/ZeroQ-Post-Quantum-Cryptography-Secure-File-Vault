from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import timedelta
from schemas import RegisterRequest, TokenResponse, LoginRequest, KeyBackupResponse
from models import User, KeyBackup
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db
from config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with post-quantum public keys."""
    # Check username uniqueness
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Create user with PQC public keys
    new_user = User(
        username=request.username,
        password_hash=password_hash,
        ml_kem_pub_key=request.ml_kem_pub_key,  # Already Base64
        ml_dsa_pub_key=request.ml_dsa_pub_key,  # Already Base64
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Persist encrypted key backup (ciphertext only)
    key_backup = KeyBackup(
        user_id=new_user.id,
        encrypted_private_keys=request.encrypted_private_keys,
        key_salt=request.key_salt,
        key_nonce=request.key_nonce,
    )
    db.add(key_backup)
    db.commit()
    
    return {"message": "User registered successfully"}


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    # Find user
    user = db.query(User).filter(User.username == request.username).first()
    
    # Verify credentials
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/key-backup", response_model=KeyBackupResponse)
async def get_key_backup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return encrypted key backup for the authenticated user."""
    backup = db.query(KeyBackup).filter(KeyBackup.user_id == current_user.id).first()
    if not backup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encrypted key backup not found for this account"
        )

    return {
        "encrypted_private_keys": backup.encrypted_private_keys,
        "key_salt": backup.key_salt,
        "key_nonce": backup.key_nonce,
    }
