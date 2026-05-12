class AppNotification {
  final String id;
  final String userId;
  final String type;
  final String fromUserId;
  final String fromUsername;
  final String? postId;
  final String message;
  final DateTime timestamp;
  final bool read;

  AppNotification({
    required this.id,
    required this.userId,
    required this.type,
    required this.fromUserId,
    required this.fromUsername,
    this.postId,
    required this.message,
    required this.timestamp,
    this.read = false,
  });

  factory AppNotification.fromFirestore(String id, Map<String, dynamic> data) {
    return AppNotification(
      id: id,
      userId: data['userId'] ?? '',
      type: data['type'] ?? 'general',
      fromUserId: data['fromUserId'] ?? '',
      fromUsername: data['fromUsername'] ?? 'Someone',
      postId: data['postId'],
      message: data['message'] ?? '',
      timestamp: (data['timestamp'] as dynamic)?.toDate() ?? DateTime.now(),
      read: data['read'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'type': type,
      'fromUserId': fromUserId,
      'fromUsername': fromUsername,
      'postId': postId,
      'message': message,
      'timestamp': timestamp,
      'read': read,
    };
  }
}
