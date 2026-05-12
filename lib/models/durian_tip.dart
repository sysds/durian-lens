class DurianTip {
  final String variety;
  final String season;
  final String origin;
  final String ripenessTips;
  final String colorIndicators;
  final String texture;
  final String tasteProfile;
  final String priceRange;

  DurianTip({
    required this.variety,
    required this.season,
    required this.origin,
    required this.ripenessTips,
    required this.colorIndicators,
    required this.texture,
    required this.tasteProfile,
    required this.priceRange,
  });

  factory DurianTip.fromJson(Map<String, dynamic> json) => DurianTip(
        variety: json['variety'] as String,
        season: json['season'] as String,
        origin: json['origin'] as String,
        ripenessTips: json['ripenessTips'] as String,
        colorIndicators: json['colorIndicators'] as String,
        texture: json['texture'] as String,
        tasteProfile: json['tasteProfile'] as String,
        priceRange: json['priceRange'] as String,
      );
}
