class JournalEntry {
  final String id;
  final String photoPath;
  final DateTime date;
  final String variety;
  final double confidence;
  final String? taste;
  final String? price;
  final String? seller;
  final String? notes;

  JournalEntry({
    required this.id,
    required this.photoPath,
    required this.date,
    required this.variety,
    required this.confidence,
    this.taste,
    this.price,
    this.seller,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'photoPath': photoPath,
        'date': date.toIso8601String(),
        'variety': variety,
        'confidence': confidence,
        'taste': taste,
        'price': price,
        'seller': seller,
        'notes': notes,
      };

  factory JournalEntry.fromJson(Map<String, dynamic> json) => JournalEntry(
        id: json['id'] as String,
        photoPath: json['photoPath'] as String,
        date: DateTime.parse(json['date'] as String),
        variety: json['variety'] as String,
        confidence: (json['confidence'] as num).toDouble(),
        taste: json['taste'] as String?,
        price: json['price'] as String?,
        seller: json['seller'] as String?,
        notes: json['notes'] as String?,
      );

  JournalEntry copyWith({
    String? id,
    String? photoPath,
    DateTime? date,
    String? variety,
    double? confidence,
    String? taste,
    String? price,
    String? seller,
    String? notes,
  }) =>
      JournalEntry(
        id: id ?? this.id,
        photoPath: photoPath ?? this.photoPath,
        date: date ?? this.date,
        variety: variety ?? this.variety,
        confidence: confidence ?? this.confidence,
        taste: taste ?? this.taste,
        price: price ?? this.price,
        seller: seller ?? this.seller,
        notes: notes ?? this.notes,
      );
}
