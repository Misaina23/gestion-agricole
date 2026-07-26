"""
Weather App Models
"""
from django.db import models
from core.models import TimeStampedModel


class WeatherStation(TimeStampedModel):
    """Weather station reference"""
    name = models.CharField(max_length=200, verbose_name='Nom')
    code = models.CharField(max_length=50, unique=True, verbose_name='Code')
    region = models.CharField(max_length=100, verbose_name='Region')
    commune = models.CharField(max_length=100, blank=True, null=True, verbose_name='Commune')
    latitude = models.FloatField(verbose_name='Latitude')
    longitude = models.FloatField(verbose_name='Longitude')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Station meteo'
        verbose_name_plural = 'Stations meteo'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class WeatherRecord(TimeStampedModel):
    """Weather observation record"""
    station = models.ForeignKey(WeatherStation, on_delete=models.CASCADE, related_name='records', verbose_name='Station')
    recorded_at = models.DateTimeField(verbose_name='Enregistre le')
    temperature = models.FloatField(blank=True, null=True, verbose_name='Temperature (C)')
    humidity = models.FloatField(blank=True, null=True, verbose_name='Humidite (%)')
    rainfall = models.FloatField(blank=True, null=True, verbose_name='Pluie (mm)')
    wind_speed = models.FloatField(blank=True, null=True, verbose_name='Vitesse du vent (km/h)')
    wind_direction = models.CharField(max_length=10, blank=True, null=True, verbose_name='Direction du vent')
    pressure = models.FloatField(blank=True, null=True, verbose_name='Pression (hPa)')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Releve meteo'
        verbose_name_plural = 'Releves meteo'
        ordering = ['-recorded_at']
        unique_together = ['station', 'recorded_at']

    def __str__(self):
        return f"{self.station.name} - {self.recorded_at}"


class WeatherAlert(TimeStampedModel):
    """Weather forecast alert"""
    ALERT_TYPE_CHOICES = [
        ('rain', 'Pluie'),
        ('storm', 'Tempête'),
        ('drought', 'Secheresse'),
        ('heat', 'Chaleur'),
        ('frost', 'Gel'),
        ('other', 'Autre'),
    ]

    weather_station = models.ForeignKey(
        WeatherStation,
        on_delete=models.CASCADE,
        related_name='alerts',
        verbose_name='Station meteo'
    )
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES, verbose_name="Type d'alerte")
    title = models.CharField(max_length=200, verbose_name='Titre')
    message = models.TextField(verbose_name='Message')
    forecast_start = models.DateTimeField(verbose_name='Debut prevu')
    forecast_end = models.DateTimeField(verbose_name='Fin prevue')
    is_sent = models.BooleanField(default=False, verbose_name='Envoyé')
    sent_at = models.DateTimeField(blank=True, null=True, verbose_name='Envoyé le')

    class Meta:
        verbose_name = 'Alerte meteo'
        verbose_name_plural = 'Alertes meteo'
        ordering = ['-forecast_start']

    def __str__(self):
        return f"{self.title} - {self.weather_station.name}"
