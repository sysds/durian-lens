import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/community_post.dart';
import '../services/community_service.dart';
import 'create_post_page.dart';
import 'notifications_page.dart';
import 'post_detail_page.dart';

class CommunityPage extends StatefulWidget {
  const CommunityPage({super.key});

  @override
  State<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends State<CommunityPage> {
  final CommunityService _service = CommunityService();
  String _filter = 'latest';

  final List<Map<String, dynamic>> _filters = [
    {'key': 'latest', 'label': 'Latest', 'icon': Icons.access_time},
    {'key': 'popular', 'label': 'Popular', 'icon': Icons.trending_up},
    {'key': 'nearby', 'label': 'Nearby', 'icon': Icons.location_on},
    {'key': 'your_posts', 'label': 'Your Posts', 'icon': Icons.person},
    {'key': 'qna', 'label': 'QnA', 'icon': Icons.help_outline},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF1F8E9),
      appBar: AppBar(
        title: const Text('Community'),
        backgroundColor: Colors.green.shade700,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsPage())),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          SizedBox(
            height: 50,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final f = _filters[index];
                final selected = _filter == f['key'];
                return ChoiceChip(
                  label: Text(f['label']),
                  selected: selected,
                  selectedColor: Colors.green.shade200,
                  onSelected: (_) => setState(() => _filter = f['key']),
                  avatar: Icon(f['icon'], size: 16, color: selected ? Colors.green.shade800 : Colors.grey),
                );
              },
            ),
          ),

          // Post Feed
          Expanded(
            child: StreamBuilder<List<CommunityPost>>(
              stream: _service.getPosts(filter: _filter),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                final posts = snapshot.data ?? [];
                if (posts.isEmpty) {
                  return const Center(child: Text('No posts yet. Be the first!'));
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: posts.length,
                  itemBuilder: (context, index) => _PostCard(post: posts[index]),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostPage())),
        backgroundColor: Colors.green.shade700,
        icon: const Icon(Icons.add),
        label: const Text('Post'),
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  final CommunityPost post;
  const _PostCard({required this.post});

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('d MMM yyyy, HH:mm').format(post.timestamp);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => PostDetailPage(post: post)),
        ),
        borderRadius: BorderRadius.circular(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: Colors.green.shade100,
                    backgroundImage: post.userPhotoUrl != null ? NetworkImage(post.userPhotoUrl!) : null,
                    child: post.userPhotoUrl == null ? const Icon(Icons.person, color: Colors.green) : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(post.username, style: const TextStyle(fontWeight: FontWeight.bold)),
                        Text(timeStr, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                      ],
                    ),
                  ),
                  if (post.category == 'qna')
                    Chip(
                      label: const Text('QnA', style: TextStyle(fontSize: 10)),
                      backgroundColor: Colors.blue.shade50,
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                ],
              ),
            ),

            // Caption
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(post.caption, style: const TextStyle(fontSize: 15)),
            ),
            const SizedBox(height: 10),

            // Image
            if (post.imageUrl != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
                child: Image.network(
                  post.imageUrl!,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 200,
                    color: Colors.grey.shade300,
                    child: const Center(child: Icon(Icons.broken_image)),
                  ),
                ),
              ),

            // Actions
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(Icons.thumb_up_outlined, size: 18, color: Colors.grey.shade700),
                  const SizedBox(width: 4),
                  Text('${post.likes}'),
                  const SizedBox(width: 16),
                  Icon(Icons.thumb_down_outlined, size: 18, color: Colors.grey.shade700),
                  const SizedBox(width: 4),
                  Text('${post.dislikes}'),
                  const SizedBox(width: 16),
                  Icon(Icons.comment_outlined, size: 18, color: Colors.grey.shade700),
                  const SizedBox(width: 4),
                  Text('${post.commentsCount}'),
                  const Spacer(),
                  Icon(Icons.share_outlined, size: 18, color: Colors.grey.shade700),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
