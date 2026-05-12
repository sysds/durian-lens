class DurianLibraryItem {
  final String id;
  final String name;
  final List<String> aliases;
  final String origin;
  final String season;
  final String tasteProfile;
  final String texture;
  final String colour;
  final String ripenessTips;
  final String priceRange;
  final int popularity;

  DurianLibraryItem({
    required this.id,
    required this.name,
    required this.aliases,
    required this.origin,
    required this.season,
    required this.tasteProfile,
    required this.texture,
    required this.colour,
    required this.ripenessTips,
    required this.priceRange,
    required this.popularity,
  });

  factory DurianLibraryItem.fromJson(Map<String, dynamic> json) {
    return DurianLibraryItem(
      id: json['id'] as String,
      name: json['name'] as String,
      aliases: List<String>.from(json['aliases'] as List),
      origin: json['origin'] as String,
      season: json['season'] as String,
      tasteProfile: json['tasteProfile'] as String,
      texture: json['texture'] as String,
      colour: json['colour'] as String,
      ripenessTips: json['ripenessTips'] as String,
      priceRange: json['priceRange'] as String,
      popularity: (json['popularity'] as num).toInt(),
    );
  }
}
