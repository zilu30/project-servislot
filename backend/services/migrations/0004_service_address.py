from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0003_service_latitude_service_longitude_service_rating'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='address',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
