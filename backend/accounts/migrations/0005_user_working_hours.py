from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_category_user_company_name_user_phone_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='working_hours',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
