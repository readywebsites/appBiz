from rest_framework import permissions
from .models import RoleChoices

class IsSuperAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == RoleChoices.SUPER_ADMIN or request.user.is_superuser))

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role in (RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN) or request.user.is_superuser
            )
        )

class IsStaffOrAdmin(permissions.BasePermission):
    """Allows access to any internal business team member (Sales, Project, Finance, Support, Admin)"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.role in (
                RoleChoices.SUPER_ADMIN,
                RoleChoices.ADMIN,
                RoleChoices.SALES_MANAGER,
                RoleChoices.SALES_EXECUTIVE,
                RoleChoices.PROJECT_MANAGER,
                RoleChoices.PROJECT_MEMBER,
                RoleChoices.FINANCE,
                RoleChoices.SUPPORT,
            )
            or request.user.is_staff
            or request.user.is_superuser
        )

class IsSalesStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.role in (
                RoleChoices.SUPER_ADMIN,
                RoleChoices.ADMIN,
                RoleChoices.SALES_MANAGER,
                RoleChoices.SALES_EXECUTIVE,
            )
            or request.user.is_superuser
        )

class IsProjectStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.role in (
                RoleChoices.SUPER_ADMIN,
                RoleChoices.ADMIN,
                RoleChoices.PROJECT_MANAGER,
                RoleChoices.PROJECT_MEMBER,
            )
            or request.user.is_superuser
        )

class IsFinanceStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.role in (
                RoleChoices.SUPER_ADMIN,
                RoleChoices.ADMIN,
                RoleChoices.FINANCE,
            )
            or request.user.is_superuser
        )

class IsSupportStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.role in (
                RoleChoices.SUPER_ADMIN,
                RoleChoices.ADMIN,
                RoleChoices.SUPPORT,
            )
            or request.user.is_superuser
        )

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Object-level permission allowing the owner (customer) of the object or any staff member.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False

        # Staff can view/edit
        if request.user.role != RoleChoices.CUSTOMER or request.user.is_staff or request.user.is_superuser:
            return True

        # Check object owner
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "customer"):
            return obj.customer == request.user
        if hasattr(obj, "client"):
            return obj.client == request.user
        return False

