import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../models/community_comment.dart';
import '../models/community_post.dart';
import '../models/notification_model.dart';

class CommunityService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Posts
  Stream<List<CommunityPost>> getPosts({String filter = 'latest'}) {
    Query query = _db.collection('community_posts');

    switch (filter) {
      case 'popular':
        query = query.orderBy('likes', descending: true);
        break;
      case 'nearby':
      // nearby requires location; handled client-side
        query = query.orderBy('timestamp', descending: true);
        break;
      case 'your_posts':
        final uid = FirebaseAuth.instance.currentUser?.uid;
        query = query.where('userId', isEqualTo: uid).orderBy('timestamp', descending: true);
        break;
      case 'qna':
        query = query.where('category', isEqualTo: 'qna').orderBy('timestamp', descending: true);
        break;
      default:
        query = query.orderBy('timestamp', descending: true);
    }

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return CommunityPost.fromFirestore(doc.id, doc.data() as Map<String, dynamic>);
      }).toList();
    });
  }

  Future<String> createPost({
    required String caption,
    String? imageUrl,
    String? videoUrl,
    String category = 'general',
    double? latitude,
    double? longitude,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    final uid = user?.uid ?? 'anonymous';

    final docRef = await _db.collection('community_posts').add({
      'userId': uid,
      'username': user?.displayName ?? 'Durian User',
      'userPhotoUrl': user?.photoURL,
      'caption': caption,
      'imageUrl': imageUrl,
      'videoUrl': videoUrl,
      'timestamp': FieldValue.serverTimestamp(),
      'likes': 0,
      'dislikes': 0,
      'commentsCount': 0,
      'category': category,
      'latitude': latitude,
      'longitude': longitude,
    });
    return docRef.id;
  }

Future<void> toggleLike(String postId, bool isLike) async {
  final uid = FirebaseAuth.instance.currentUser?.uid;
  if (uid == null) return;

  final likeRef = _db
      .collection('community_posts')
      .doc(postId)
      .collection('reactions')
      .doc(uid);
  final postRef = _db.collection('community_posts').doc(postId);

  await _db.runTransaction((transaction) async {
    final likeSnapshot = await transaction.get(likeRef);
    final postSnapshot = await transaction.get(postRef);
    
    if (!postSnapshot.exists) return;
    
    final currentLikes = (postSnapshot.data()?['likes'] as int?) ?? 0;
    final currentDislikes = (postSnapshot.data()?['dislikes'] as int?) ?? 0;
    
    if (likeSnapshot.exists) {
      final currentType = likeSnapshot.data()?['type'] as String;
      
      if (currentType == (isLike ? 'like' : 'dislike')) {
        // Remove reaction
        transaction.delete(likeRef);
        if (isLike) {
          transaction.update(postRef, {'likes': currentLikes - 1});
        } else {
          transaction.update(postRef, {'dislikes': currentDislikes - 1});
        }
      } else {
        // Switch reaction (e.g., from like to dislike)
        transaction.update(likeRef, {'type': isLike ? 'like' : 'dislike'});
        if (isLike) {
          transaction.update(postRef, {
            'likes': currentLikes + 1,
            'dislikes': currentDislikes - 1,
          });
        } else {
          transaction.update(postRef, {
            'likes': currentLikes - 1,
            'dislikes': currentDislikes + 1,
          });
        }
      }
    } else {
      // First time reacting
      transaction.set(likeRef, {'type': isLike ? 'like' : 'dislike', 'userId': uid});
      if (isLike) {
        transaction.update(postRef, {'likes': currentLikes + 1});
      } else {
        transaction.update(postRef, {'dislikes': currentDislikes + 1});
      }
    }
  });
}

  // Comments
  Stream<List<CommunityComment>> getComments(String postId) {
    return _db
        .collection('community_posts')
        .doc(postId)
        .collection('comments')
        .orderBy('timestamp', descending: false)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return CommunityComment.fromFirestore(doc.id, doc.data());
      }).toList();
    });
  }

  Future<void> addComment(String postId, String text) async {
    final user = FirebaseAuth.instance.currentUser;
    final uid = user?.uid ?? 'anonymous';

    await _db.collection('community_posts').doc(postId).collection('comments').add({
      'postId': postId,
      'userId': uid,
      'username': user?.displayName ?? 'Durian User',
      'text': text,
      'timestamp': FieldValue.serverTimestamp(),
      'likes': 0,
      'dislikes': 0,
    });

    await _db.collection('community_posts').doc(postId).update({
      'commentsCount': FieldValue.increment(1),
    });
  }

  Stream<List<CommunityPost>> getPopularPosts({int limit = 20}) {
    return _db
        .collection('community_posts')
        .orderBy('likes', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return CommunityPost.fromFirestore(doc.id, doc.data());
      }).toList();
    });
  }

  // Notifications
  Stream<List<AppNotification>> getNotifications() {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return Stream.value([]);

    return _db
        .collection('notifications')
        .where('userId', isEqualTo: uid)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return AppNotification.fromFirestore(doc.id, doc.data());
      }).toList();
    });
  }

  Future<void> markNotificationRead(String notificationId) async {
    await _db.collection('notifications').doc(notificationId).update({'read': true});
  }
}
