from django.db import migrations


def create_default_admin(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    if not User.objects.filter(username='andrianisaina23@gmail.com').exists():
        user = User.objects.create_user(
            username='andrianisaina23@gmail.com',
            email='andrianisaina23@gmail.com',
            first_name='Admin',
            last_name='System',
            password='2311Saina',
            role='admin',
            registration_status='approved',
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_is_supervisor_user_platform_and_more'),
    ]

    operations = [
        migrations.RunPython(create_default_admin),
    ]
