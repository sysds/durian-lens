import 'dart:convert';
import 'package:http/http.dart' as http;

class WeatherInfo {
  final String description;
  final double temperature;
  final String iconCode;
  final String city;

  WeatherInfo({
    required this.description,
    required this.temperature,
    required this.iconCode,
    required this.city,
  });
}

class WeatherService {
  // Replace with your own OpenWeatherMap API key to enable live weather
  static const String _apiKey = '';

  Future<WeatherInfo?> getCurrentWeather(double lat, double lon) async {
    if (_apiKey.isEmpty) return null;

    try {
      final url =
          'https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lon&units=metric&appid=$_apiKey';
      final response = await http.get(Uri.parse(url));
      if (response.statusCode != 200) return null;

      final data = jsonDecode(response.body);
      return WeatherInfo(
        description: data['weather'][0]['description'] ?? 'Unknown',
        temperature: (data['main']['temp'] as num).toDouble(),
        iconCode: data['weather'][0]['icon'] ?? '01d',
        city: data['name'] ?? 'Unknown',
      );
    } catch (e) {
      return null;
    }
  }

  WeatherInfo getPlaceholderWeather() {
    return WeatherInfo(
      description: 'Sunny',
      temperature: 32.0,
      iconCode: '01d',
      city: 'Kuala Lumpur',
    );
  }
}
