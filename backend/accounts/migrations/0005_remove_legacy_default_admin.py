from django.db import migrations


def remove_legacy_default_admin(apps, schema_editor):
    # This account came from the previous hard-coded migration, not from the
    # cooperative register.  Existing installations receive the same cleanup
    # as fresh installations.
    apps.get_model('accountsn', 'User').objects.filter(
        username='andrianisaina23@gmail.com'
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_code'),
    ]

    operations = [
        migrations.RunPython(remove_legacy_default_admin, migrations.RunPython.noop),
    ]
