def validate_user(username: str) -> bool:
    """Return True when username is non-empty."""
    return bool(username and username.strip())


def authenticate(username: str) -> bool:
    return validate_user(username)


class UserService:
    def check(self, username: str) -> bool:
        return validate_user(username)
