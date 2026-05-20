import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

import '../models/community_post.dart';
import '../services/community_service.dart';
import '../theme/app_theme.dart';
import 'post_detail_page.dart';

class TopPostsPage extends StatelessWidget {
  const TopPostsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final service = CommunityService();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Top Posts'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: StreamBuilder<List<CommunityPost>>(
        stream: service.getTopPosts(limit: 50),
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
                  Icon(Icons.trending_up, size: 64, color: AppColors.textMuted),
                  SizedBox(height: 16),
                  Text('No popular posts yet', style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }

          // Sort by engagement (likes + commentsCount) and take top 3
          final sorted = posts.toList()
            ..sort((a, b) {
              final engagementA = a.likes + a.commentsCount;
              final engagementB = b.likes + b.commentsCount;
              return engagementB.compareTo(engagementA);
            });
          final topThree = sorted.take(3).toList();

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: topThree.length,
            itemBuilder: (context, index) {
              final post = topThree[index];
              return _TopPostCard(post: post, rank: index + 1);
            },
          );
        },
      ),
    );
  }
}

class _TopPostCard extends StatelessWidget {
  final CommunityPost post;
  final int rank;

  const _TopPostCard({required this.post, required this.rank});

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
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _rankColor(rank),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '#$rank',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
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
                          '${post.likes + post.commentsCount}',
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

            // Engagement stats bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Row(
                children: [
                  Icon(Icons.thumb_up_outlined, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text('${post.likes} likes', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  const SizedBox(width: 16),
                  Icon(Icons.comment_outlined, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text('${post.commentsCount} comments', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _rankColor(int rank) {
    switch (rank) {
      case 1:
        return Colors.amber.shade600;
      case 2:
        return Colors.blueGrey.shade400;
      case 3:
        return Colors.brown.shade400;
      default:
        return AppColors.primaryGreen;
    }
  }
}
