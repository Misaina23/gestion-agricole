"""
Serializers for Accounts App
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    registration_status_display = serializers.CharField(source='get_registration_status_display', read_only=True)
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'code', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'platform', 'platform_display',
            'registration_status', 'registration_status_display',
            'phone', 'region', 'commune', 'avatar', 'is_field_agent',
            'is_supervisor', 'is_active', 'last_sync', 'last_login',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'last_login', 'created_at', 'updated_at', 'last_sync']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'platform',
            'phone', 'region', 'commune', 'is_field_agent', 'is_supervisor'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Les mots de passe ne correspondent pas.'
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users"""
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'role', 'platform',
            'registration_status', 'phone', 'region', 'commune',
            'avatar', 'is_field_agent', 'is_supervisor', 'is_active'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Les nouveaux mots de passe ne correspondent pas.'
            })
        return attrs


class LoginSerializer(serializers.Serializer):
    """Serializer for login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class TokenObtainPairWithEmailSerializer(TokenObtainPairSerializer):
    """Allow login with username or email"""
    username_field = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = (attrs.pop('username_field', None) or attrs.pop('username', '') or '').strip()
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError('Identifiants requis.')

        user = User.objects.filter(username=identifier).first()
        if not user:
            user = User.objects.filter(email__iexact=identifier).first()

        if not user or not user.check_password(password) or not user.is_active:
            raise serializers.ValidationError('Identifiants incorrects ou compte inactif.')

        attrs['username'] = user.username
        return super().validate({'username': user.username, 'password': password})


class RegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration (public endpoint)"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    is_admin = serializers.BooleanField(required=False, default=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'region', 'commune',
            'is_supervisor', 'is_admin', 'platform'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Les mots de passe ne correspondent pas.'
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        is_admin = validated_data.pop('is_admin', False)
        is_supervisor = validated_data.pop('is_supervisor', False)
        
        role = 'admin' if is_admin else 'manager' if is_supervisor else 'agent'
        
        user = User.objects.create(
            **validated_data,
            role=role,
            registration_status='approved',
            is_active=True,
            is_staff=is_admin or is_supervisor,
        )
        user.set_password(password)
        user.save()
        return user


