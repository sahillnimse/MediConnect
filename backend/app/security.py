"""Password hashing and stateless token auth using only the standard library.

Keeps the dependency surface tiny (no passlib / PyJWT). Tokens are JSON
payloads, base64url-encoded and HMAC-SHA256 signed with SECRET_KEY.
"""
import base64
import hashlib
import hmac
import json
import os
import time

APP_ENV = os.environ.get("APP_ENV", "development")
SECRET_KEY = os.environ.get("CONNECTOR_SECRET", "")
if not SECRET_KEY:
    if APP_ENV != "development":
        raise RuntimeError(
            "CONNECTOR_SECRET environment variable must be set in production."
        )
    SECRET_KEY = "dev-secret-change-me"
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days
_PBKDF2_ROUNDS = 200_000


# ── Passwords ──────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, rounds, salt_hex, hash_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds)
        )
        return hmac.compare_digest(dk.hex(), hash_hex)
    except (ValueError, AttributeError):
        return False


# ── Tokens ─────────────────────────────────────────────────────────────────
def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64d(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_token(*, user_id: int, role: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,          # patient | hospital | admin
        "email": email,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    body = _b64e(json.dumps(payload, separators=(",", ":")).encode())
    sig = hmac.new(SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()
    return f"{body}.{_b64e(sig)}"


def decode_token(token: str) -> dict | None:
    try:
        body, sig = token.split(".")
        expected = hmac.new(SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64e(expected), sig):
            return None
        payload = json.loads(_b64d(body))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except (ValueError, KeyError, json.JSONDecodeError):
        return None
