from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('producers', '0002_add_synced_field'),
        ('core', '0003_district'),
    ]

    operations = [
        migrations.AddField(
            model_name='producer',
            name='district',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='producers',
                to='core.district',
                verbose_name='District',
            ),
        ),
    ]
