from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

# user model
User = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password: # input check
            return None
        try:
            if "@" in username:   # username check 
                user = User.objects.get(email=username)
            else:
                user = User.objects.get(username=username) # username check
        except User.DoesNotExist:
            return None
        # password check
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
