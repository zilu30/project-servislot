from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0004_booking_notes'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(
            name='RecurringSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('days_of_week', models.JSONField(default=list)),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('slot_duration', models.PositiveIntegerField(default=30)),
                ('is_active', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('provider', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='recurring_schedule',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
