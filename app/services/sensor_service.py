"""
app/services/sensor_service.py
───────────────────────────────
Business logic for sensor data validation and unit conversion.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.models.sensor import SensorReadings

logger = logging.getLogger(__name__)

# ADC range on the ESP32 (12-bit, 0 V → 3.3 V)
ADC_MIN: int = 0
ADC_MAX: int = 4095

# Capacitive soil-moisture sensor calibration points
# These values must match the sensor output in dry / saturated soil.
MOISTURE_ADC_DRY: int = 3200   # ADC reading in completely dry soil
MOISTURE_ADC_WET: int = 1400   # ADC reading in saturated soil


def convert_moisture_percent(adc_value: int) -> float:
    """
    Convert a raw ADC reading from a capacitive soil-moisture sensor to a
    percentage value (0–100 %).

    The conversion is a linear interpolation between the calibration points
    ``MOISTURE_ADC_DRY`` and ``MOISTURE_ADC_WET``.

    Args:
        adc_value: Raw 12-bit ADC reading (0–4095).

    Returns:
        Moisture percentage clamped to [0.0, 100.0].
    """
    # Clamp input to valid ADC range
    adc_value = max(ADC_MIN, min(ADC_MAX, adc_value))

    # Invert: higher ADC → drier soil
    percent = (MOISTURE_ADC_DRY - adc_value) / (MOISTURE_ADC_DRY - MOISTURE_ADC_WET) * 100.0
    return round(max(0.0, min(100.0, percent)), 2)


def validate_readings(readings: SensorReadings) -> tuple[bool, list[str]]:
    """
    Validate a :class:`~app.models.sensor.SensorReadings` instance against
    expected physical ranges and internal consistency rules.

    Args:
        readings: The parsed sensor payload to validate.

    Returns:
        A tuple ``(is_valid, issues)`` where *is_valid* is ``True`` when
        no critical problems were found, and *issues* is a (possibly empty)
        list of human-readable warning / error strings.
    """
    issues: list[str] = []

    # ── Soil moisture ─────────────────────────────────────────────────────────
    for field, value in [
        ("soil_moisture_1", readings.soil_moisture_1),
        ("soil_moisture_2", readings.soil_moisture_2),
    ]:
        if value is not None and not (0.0 <= value <= 100.0):
            issues.append(f"{field} out of range: {value}")

    # ── Air temperature / humidity (DHT22) ────────────────────────────────────
    if readings.temperature_air is not None:
        if not (-40.0 <= readings.temperature_air <= 85.0):
            issues.append(f"temperature_air out of DHT22 range: {readings.temperature_air}")

    if readings.humidity_air is not None:
        if not (0.0 <= readings.humidity_air <= 100.0):
            issues.append(f"humidity_air out of range: {readings.humidity_air}")

    # ── Soil temperature (DS18B20) ────────────────────────────────────────────
    if readings.temperature_soil is not None:
        if not (-55.0 <= readings.temperature_soil <= 125.0):
            issues.append(f"temperature_soil out of DS18B20 range: {readings.temperature_soil}")

    # ── Rain sensor ───────────────────────────────────────────────────────────
    if readings.rain_analog is not None:
        if not (0.0 <= readings.rain_analog <= 100.0):
            issues.append(f"rain_analog out of range: {readings.rain_analog}")

    # ── Ultrasonic water level ────────────────────────────────────────────────
    if readings.water_level_cm is not None:
        if readings.water_level_cm < 0:
            issues.append(f"water_level_cm negative: {readings.water_level_cm}")
        if readings.water_level_cm > 500:
            # Likely a sensor failure (HC-SR04 max reliable range ~400 cm)
            issues.append(f"water_level_cm suspiciously large: {readings.water_level_cm}")

    # ── Cross-sensor sanity ───────────────────────────────────────────────────
    if (
        readings.rain_digital is True
        and readings.rain_analog is not None
        and readings.rain_analog < 5.0
    ):
        issues.append(
            "rain_digital indicates rain but rain_analog is very low "
            f"({readings.rain_analog}%) — possible sensor wiring issue."
        )

    is_valid = all(
        "out of range" not in issue and "negative" not in issue
        for issue in issues
    )

    if issues:
        logger.warning("Sensor validation issues: %s", issues)

    return is_valid, issues


def average_moisture(readings: SensorReadings) -> Optional[float]:
    """
    Return the average soil-moisture reading across the two sensors.

    Returns ``None`` when both sensors are unavailable.

    Args:
        readings: Parsed sensor payload.

    Returns:
        Average moisture percentage, or ``None``.
    """
    values = [
        v
        for v in [readings.soil_moisture_1, readings.soil_moisture_2]
        if v is not None
    ]
    if not values:
        return None
    return round(sum(values) / len(values), 2)
