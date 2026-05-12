import 'dart:math';

import 'package:geolocator/geolocator.dart';

import '../models/store_model.dart';

class LocationService {
  static final List<DurianStore> _mockStores = [
    DurianStore(id: '1', name: 'Durian SS2', latitude: 3.1184, longitude: 101.6208, address: 'Jalan SS2/72, Petaling Jaya, Selangor', phone: '03-7865 1234', rating: 4.5),
    DurianStore(id: '2', name: 'Donald Durian', latitude: 3.1538, longitude: 101.7147, address: 'Jalan Imbi, Kuala Lumpur', phone: '03-2142 5678', rating: 4.3),
    DurianStore(id: '3', name: 'Bao Jiak Durian', latitude: 3.0823, longitude: 101.5822, address: 'Jalan Universiti, Petaling Jaya', phone: '012-345 6789', rating: 4.7),
    DurianStore(id: '4', name: 'Durian Hill', latitude: 3.2148, longitude: 101.7470, address: 'Jalan Genting Klang, Setapak, Kuala Lumpur', phone: '03-4021 9876', rating: 4.2),
    DurianStore(id: '5', name: 'Raub Durian Orchard', latitude: 3.7936, longitude: 101.8574, address: 'Kampung Sungai Ruan, Raub, Pahang', phone: '09-355 4321', rating: 4.8),
    DurianStore(id: '6', name: 'Bentong Durian Farm', latitude: 3.5222, longitude: 101.9093, address: 'Karak Highway, Bentong, Pahang', phone: '09-222 1111', rating: 4.6),
    DurianStore(id: '7', name: 'Penang Durian Stall', latitude: 5.4141, longitude: 100.3288, address: 'Jalan Macalister, Georgetown, Penang', phone: '04-226 7788', rating: 4.4),
    DurianStore(id: '8', name: 'Balik Pulau Durian', latitude: 5.3505, longitude: 100.2025, address: 'Jalan Balik Pulau, Penang', phone: '04-866 2233', rating: 4.9),
    DurianStore(id: '9', name: 'Durian King JB', latitude: 1.4927, longitude: 103.7414, address: 'Jalan Besar, Taman Sentosa, Johor Bahru', phone: '07-336 4455', rating: 4.3),
    DurianStore(id: '10', name: 'Kluang Durian Farm', latitude: 2.0250, longitude: 103.3328, address: 'Jalan Mersing, Kluang, Johor', phone: '07-771 8899', rating: 4.5),
    DurianStore(id: '11', name: 'Genting Durian Corner', latitude: 3.4239, longitude: 101.7932, address: 'Gohtong Jaya, Genting Highlands, Pahang', phone: '03-6100 1122', rating: 4.1),
    DurianStore(id: '12', name: 'Kajang Durian Stall', latitude: 2.9927, longitude: 101.7909, address: 'Jalan Reko, Kajang, Selangor', phone: '03-8736 3344', rating: 4.4),
    DurianStore(id: '13', name: 'Cameron Durian Farm', latitude: 4.4736, longitude: 101.3854, address: 'Ringlet, Cameron Highlands, Pahang', phone: '05-495 5566', rating: 4.6),
    DurianStore(id: '14', name: 'Ipoh Durian Street', latitude: 4.5975, longitude: 101.0901, address: 'Jalan Theatre, Ipoh, Perak', phone: '05-254 6677', rating: 4.3),
    DurianStore(id: '15', name: 'Taiping Durian Stall', latitude: 4.8513, longitude: 100.7408, address: 'Jalan Kota, Taiping, Perak', phone: '05-808 9900', rating: 4.2),
  ];

  Future<Position?> getCurrentPosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return null;
      }
    }

    return await Geolocator.getCurrentPosition();
  }

  List<DurianStore> getNearbyStores(double lat, double lng, {double radiusKm = 50}) {
    return _mockStores.where((store) {
      final distance = _haversine(lat, lng, store.latitude, store.longitude);
      return distance <= radiusKm;
    }).toList()
      ..sort((a, b) {
        final da = _haversine(lat, lng, a.latitude, a.longitude);
        final db = _haversine(lat, lng, b.latitude, b.longitude);
        return da.compareTo(db);
      });
  }

  List<DurianStore> getAllStores() => _mockStores;

  double _haversine(double lat1, double lon1, double lat2, double lon2) {
    const R = 6371;
    final dLat = _toRad(lat2 - lat1);
    final dLon = _toRad(lon2 - lon1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRad(lat1)) * cos(_toRad(lat2)) * sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return R * c;
  }

  double _toRad(double deg) => deg * pi / 180;
}
