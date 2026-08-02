import uuid

from django.db import migrations, models


def backfill_user_codes(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    db_alias = schema_editor.connection.alias
    used = set(User.objects.using(db_alias).values_list("code", flat=True))
    for user in User.objects.using(db_alias).filter(code__isnull=True):
        code = f"USR-{uuid.uuid4().hex[:8]}"
        while code in used:
            code = f"USR-{uuid.uuid4().hex[:8]}"
        used.add(code)
        User.objects.using(db_alias).filter(pk=user.pk).update(code=code)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_create_default_admin"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="code",
            field=models.CharField(
                blank=True,
                max_length=50,
                null=True,
                unique=True,
                verbose_name="Code utilisateur",
            ),
        ),
        migrations.RunPython(backfill_user_codes, reverse_code=migrations.RunPython.noop),
    ]
