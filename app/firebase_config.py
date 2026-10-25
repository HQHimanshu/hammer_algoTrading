"""Firebase Admin and Cloud Firestore configuration and client initialization.

Dedicated single initialization module for the Firebase project `hammer-algotrading`.
Supports Application Default Credentials (ADC) or explicit service-account JSON paths.
"""

import logging
import os
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger("algopilot.firebase")

DEFAULT_FIREBASE_PROJECT_ID = "hammer-algotrading"


class FirebaseInitializationError(Exception):
    """Raised when Firebase Admin SDK or Firestore client fails to initialize."""


def init_firestore(
    project_id: str = DEFAULT_FIREBASE_PROJECT_ID,
    service_account_path: Optional[str] = None,
) -> firestore.Client:
    """Initialize Firebase Admin SDK once and return the Cloud Firestore client.

    Authentication hierarchy:
    1. Explicit service account JSON path (if configured and file exists).
    2. GOOGLE_APPLICATION_CREDENTIALS environment variable.
    3. Google Application Default Credentials (ADC) or Firestore Emulator.

    Fails safely and explicitly if credentials or project are invalid.
    Never silently fakes database operations.
    """
    try:
        # Check if already initialized to prevent duplicate app errors
        if not firebase_admin._apps:
            cred = None

            if service_account_path and service_account_path.strip():
                resolved_path = os.path.abspath(service_account_path.strip())
                if not os.path.isfile(resolved_path):
                    raise FirebaseInitializationError(
                        f"Firebase service account file does not exist at path: '{resolved_path}'"
                    )
                logger.info("Initializing Firebase Admin with service account certificate from: %s", resolved_path)
                cred = credentials.Certificate(resolved_path)
            elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
                gac_path = os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
                logger.info("Initializing Firebase Admin using GOOGLE_APPLICATION_CREDENTIALS: %s", gac_path)
                cred = credentials.ApplicationDefault()
            else:
                logger.info(
                    "Attempting Firebase Admin initialization with Application Default Credentials for project: %s",
                    project_id,
                )
                try:
                    cred = credentials.ApplicationDefault()
                except Exception as adc_err:
                    logger.warning("Application Default Credentials unavailable: %s. Using default project options.", adc_err)

            app_options = {"projectId": project_id}
            if cred:
                firebase_admin.initialize_app(cred, app_options)
            else:
                firebase_admin.initialize_app(options=app_options)

            logger.info("Firebase Admin initialized successfully for project: %s", project_id)

        # Get Firestore client instance
        db_client = firestore.client()
        return db_client

    except FirebaseInitializationError:
        raise
    except Exception as exc:
        err_msg = (
            f"Failed to initialize Firebase Cloud Firestore for project '{project_id}': {type(exc).__name__}: {str(exc)}"
        )
        logger.error(err_msg)
        raise FirebaseInitializationError(err_msg) from exc
