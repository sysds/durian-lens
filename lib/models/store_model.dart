class DurianStore {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final String address;
  final String? phone;
  final double rating;

  DurianStore({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.address,
    this.phone,
    this.rating = 0.0,
  });
}
