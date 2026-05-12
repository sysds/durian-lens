class CommunityComment {
  final String id;
  final String postId;
  final String userId;
  final String username;
  final String text;
  final DateTime timestamp;
  final int likes;
  final int dislikes;

  CommunityComment({
    required this.id,
    required this.postId,
    required this.userId,
    required this.username,
    required this.text,
    required this.timestamp,
    this.likes = 0,
    this.dislikes = 0,
  });

  factory CommunityComment.fromFirestore(String id, Map<String, dynamic> data) {
    return CommunityComment(
      id: id,
      postId: data['postId'] ?? '',
      userId: data['userId'] ?? '',
      username: data['username'] ?? 'Anonymous',
      text: data['text'] ?? '',
      timestamp: (data['timestamp'] as dynamic)?.toDate() ?? DateTime.now(),
      likes: (data['likes'] as num?)?.toInt() ?? 0,
      dislikes: (data['dislikes'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'postId': postId,
      'userId': userId,
      'username': username,
      'text': text,
      'timestamp': timestamp,
      'likes': likes,
      'dislikes': dislikes,
    };
  }
}
