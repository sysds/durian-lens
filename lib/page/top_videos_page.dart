import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/community_post.dart';
import '../services/community_service.dart';
import '../theme/app_theme.dart';
import 'post_detail_page.dart';

class TopVideosPage extends StatelessWidget {
  const TopVideosPage({super.key});

  @override
  Widget build(BuildContext context) {
    final service = CommunityService();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Top Videos'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: StreamBuilder<List<CommunityPost>>(
        stream: service.getPopularPosts(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final posts = snapshot.data ?? [];
          if (posts.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.play_circle_outline, size: 64, color: AppColors.textMuted),
                  SizedBox(height: 16),
                  Text('No popular posts yet', style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: posts.length,
            itemBuilder: (context, index) {
              final post = posts[index];
              return _PopularPostCard(post: post);
            },
          );
        },
      ),
    );
  }
}

class _PopularPostCard extends StatelessWidget {
  final CommunityPost post;
  const _PopularPostCard({required this.post});

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('d MMM').format(post.timestamp);
    final initials = post.username.isNotEmpty ? post.username[0].toUpperCase() : '?';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: AppDecorations.cardDecoration,
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => PostDetailPage(post: post)),
        ),
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.15),
                    backgroundImage: post.userPhotoUrl != null ? NetworkImage(post.userPhotoUrl!) : null,
                    child: post.userPhotoUrl == null
                        ? Text(
                            initials,
                            style: const TextStyle(
                              color: AppColors.primaryGreen,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post.username,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          timeStr,
                          style: AppTextStyles.caption,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.local_fire_department, size: 14, color: Colors.amber.shade700),
                        const SizedBox(width: 4),
                        Text(
                          '${post.likes}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.amber.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Caption
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                post.caption,
                style: const TextStyle(fontSize: 15, height: 1.4),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 12),

            // Image if exists
            if (post.imageUrl != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
                child: Image.network(
                  post.imageUrl!,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 160,
                    color: AppColors.divider,
                    child: const Center(child: Icon(Icons.broken_image)),
                  ),
                ),
              ),

            if (post.imageUrl == null)
              const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
