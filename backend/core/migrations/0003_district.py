from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_season_target_weight'),
    ]

    operations = [
        migrations.CreateModel(
            name='District',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Nom')),
                ('code', models.CharField(max_length=20, unique=True, verbose_name='Code')),
                ('is_active', models.BooleanField(default=True, verbose_name='Actif')),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='districts', to='core.region', verbose_name='Region')),
            ],
            options={
                'verbose_name': 'District',
                'verbose_name_plural': 'Districts',
                'ordering': ['region', 'name'],
            },
        ),
        migrations.AddField(
            model_name='commune',
            name='district',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='communes', to='core.district', verbose_name='District'),
        ),
    ]
