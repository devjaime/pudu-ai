from pkg.auth import validate_user


def test_validate_user_accepts_name():
    assert validate_user("ada") is True
