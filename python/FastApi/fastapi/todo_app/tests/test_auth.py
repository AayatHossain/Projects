from fastapi import HTTPException

from .utils import *
from ..routers.auth import authentication

def test_authenticate(user_client,db_session):
    user = authentication("jon", "testpassword", db_session)
    assert user is not None
    userdb = db_session.query(User).filter(User.username=="jon").first()
    assert userdb is not None
    assert bcrypt_context.verify("testpassword", userdb.hashed_password)

    with pytest.raises(HTTPException) as excinfo:
        authentication("jonasd", "testpassword", db_session)
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "invalid credentials"

    with pytest.raises(HTTPException) as excinfo:
        authentication("jon", "asdassdadas", db_session)
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "invalid credentials"