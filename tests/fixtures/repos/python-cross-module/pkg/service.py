from pkg.auth import validate_user


class AccountService:
    def login(self, username: str) -> bool:
        return validate_user(username)
