import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:share_plus/share_plus.dart';

class TopPostsPage extends StatelessWidget {
  const TopPostsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final currentUserId = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Top Community Posts'),
        backgroundColor: Colors.green[700],
      ),
      body: StreamBuilder<QuerySnapshot>(
        // Fetch posts and sort by engagement (likes + comments)
        // Note: For production, consider a 'score' field to avoid complex client-side sorting
        stream: FirebaseFirestore.instance.collection('posts').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No posts found in the community.'));
          }

          // Logic to get Top 3 based on (Likes + Comments)
          var docs = snapshot.data!.docs;
          docs.sort((a, b) {
            var likesA = a.get('likes') as List? ?? [];
            var likesB = b.get('likes') as List? ?? [];
            int engagementA = likesA.length + (a.get('commentsCount') as int? ?? 0);
            int engagementB = likesB.length + (b.get('commentsCount') as int? ?? 0);
            return engagementB.compareTo(engagementA);
          });

          var topThree = docs.take(3).toList();

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: topThree.length,
            itemBuilder: (context, index) {
              var post = topThree[index];
              var postData = post.data() as Map<String, dynamic>;
              bool isOwner = postData['authorId'] == currentUserId;
              List likes = postData['likes'] ?? [];
              bool isLiked = likes.contains(currentUserId);

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.green[100],
                        child: Text(postData['authorName'][0].toUpperCase()),
                      ),
                      title: Text(
                        isOwner ? "${postData['authorName']} (You)" : postData['authorName'],
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isOwner ? Colors.blue[800] : Colors.black,
                        ),
                      ),
                      subtitle: const Text("Community Member"),
                      trailing: isOwner
                          ? IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _deletePost(context, post.id),
                            )
                          : null,
                    ),
                    if (postData['imageUrl'] != null && postData['imageUrl'].toString().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            postData['imageUrl'],
                            height: 200,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => 
                                const Icon(Icons.broken_image, size: 50),
                          ),
                        ),
                      ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Text(
                        postData['content'] ?? "",
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        // Professional Like Button - Toggles state
                        _ActionButton(
                          icon: isLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
                          label: '${likes.length}',
                          color: isLiked ? Colors.blue : Colors.grey,
                          onTap: () => _toggleLike(post.id, currentUserId, likes),
                        ),
                        _ActionButton(
                          icon: Icons.comment_outlined,
                          label: '${postData['commentsCount']}',
                          onTap: () {
                            // Navigate to comments logic here
                          },
                        ),
                        _ActionButton(
                          icon: Icons.share_outlined,
                          label: 'Share',
                          onTap: () {
                            Share.share('Check out this post by ${postData['authorName']}: ${postData['content']}');
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _toggleLike(String postId, String? userId, List likes) async {
    if (userId == null) return;
    
    try {
      DocumentReference postRef = FirebaseFirestore.instance.collection('posts').doc(postId);
      
      if (likes.contains(userId)) {
        await postRef.update({
          'likes': FieldValue.arrayRemove([userId])
        });
      } else {
        await postRef.update({
          'likes': FieldValue.arrayUnion([userId])
        });
      }
    } catch (e) {
      debugPrint("Error toggling like: $e");
    }
  }

  Future<void> _deletePost(BuildContext context, String postId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Post?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await FirebaseFirestore.instance.collection('posts').doc(postId).delete();
    }
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = Colors.grey,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}