class CommunityPost {
  final String id;
  final String userId;
  final String username;
  final String? userPhotoUrl;
  final String caption;
  final String? imageUrl;
  final String? videoUrl;
  final DateTime timestamp;
  final int likes;
  final int dislikes;
  final int commentsCount;
  final String category;
  final double? latitude;
  final double? longitude;

  CommunityPost({
    required this.id,
    required this.userId,
    required this.username,
    this.userPhotoUrl,
    required this.caption,
    this.imageUrl,
    this.videoUrl,
    required this.timestamp,
    this.likes = 0,
    this.dislikes = 0,
    this.commentsCount = 0,
    this.category = 'general',
    this.latitude,
    this.longitude,
  });

  factory CommunityPost.fromFirestore(String id, Map<String, dynamic> data) {
    return CommunityPost(
      id: id,
      userId: data['userId'] ?? '',
      username: data['username'] ?? 'Anonymous',
      userPhotoUrl: data['userPhotoUrl'],
      caption: data['caption'] ?? '',
      imageUrl: data['imageUrl'],
      videoUrl: data['videoUrl'],
      timestamp: (data['timestamp'] as dynamic)?.toDate() ?? DateTime.now(),
      likes: (data['likes'] as num?)?.toInt() ?? 0,
      dislikes: (data['dislikes'] as num?)?.toInt() ?? 0,
      commentsCount: (data['commentsCount'] as num?)?.toInt() ?? 0,
      category: data['category'] ?? 'general',
      latitude: data['latitude'] != null ? (data['latitude'] as num).toDouble() : null,
      longitude: data['longitude'] != null ? (data['longitude'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'username': username,
      'userPhotoUrl': userPhotoUrl,
      'caption': caption,
      'imageUrl': imageUrl,
      'videoUrl': videoUrl,
      'timestamp': timestamp,
      'likes': likes,
      'dislikes': dislikes,
      'commentsCount': commentsCount,
      'category': category,
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}
