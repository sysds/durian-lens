import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import '../models/community_post.dart';
import '../services/community_service.dart';
import '../theme/app_theme.dart';
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
  bool _searching = false;
  String _query = '';
  final TextEditingController _searchCtrl = TextEditingController();

  final List<Map<String, dynamic>> _filters = [
    {'key': 'latest', 'label': 'Latest'},
    {'key': 'popular', 'label': 'Popular'},
    {'key': 'nearby', 'label': 'Nearby'},
    {'key': 'your_posts', 'label': 'Your posts'},
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<CommunityPost> _filterPosts(List<CommunityPost> posts) {
    if (_query.isEmpty) return posts;
    final q = _query.toLowerCase();
    return posts.where((p) {
      return p.caption.toLowerCase().contains(q) ||
          p.username.toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostPage())),
        backgroundColor: AppColors.primaryGreen,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Post', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: Column(
        children: [
          // Green Header
          Container(
            decoration: AppDecorations.greenHeaderDecoration,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 12, 20),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _searching
                              ? TextField(
                                  controller: _searchCtrl,
                                  autofocus: true,
                                  style: const TextStyle(color: Colors.white),
                                  decoration: InputDecoration(
                                    hintText: 'Search posts or users...',
                                    hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
                                    border: InputBorder.none,
                                    suffixIcon: IconButton(
                                      icon: const Icon(Icons.close, color: Colors.white),
                                      onPressed: () {
                                        setState(() {
                                          _searching = false;
                                          _query = '';
                                          _searchCtrl.clear();
                                        });
                                      },
                                    ),
                                  ),
                                  onChanged: (v) => setState(() => _query = v),
                                )
                              : const Text(
                                  'Community',
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const NotificationsPage()),
                          ),
                        ),
                        IconButton(
                          icon: Icon(_searching ? Icons.close : Icons.search, color: Colors.white),
                          onPressed: () {
                            setState(() {
                              _searching = !_searching;
                              if (!_searching) {
                                _query = '';
                                _searchCtrl.clear();
                              }
                            });
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Filter tabs
          Container(
            color: AppColors.background,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filters.map((f) {
                  final selected = _filter == f['key'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(f['label']),
                      selected: selected,
                      selectedColor: AppColors.primaryGreen,
                      backgroundColor: Colors.white,
                      labelStyle: TextStyle(
                        color: selected ? Colors.white : AppColors.textSecondary,
                        fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                        fontSize: 13,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(
                          color: selected ? AppColors.primaryGreen : AppColors.divider,
                        ),
                      ),
                      showCheckmark: false,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      onSelected: (_) => setState(() => _filter = f['key']),
                    ),
                  );
                }).toList(),
              ),
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
                final posts = _filterPosts(snapshot.data ?? []);
                if (posts.isEmpty) {
                  return const Center(child: Text('No posts yet. Be the first!'));
                }
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                  itemCount: posts.length,
                  itemBuilder: (context, index) => _PostCard(post: posts[index]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PostCard extends StatefulWidget {
  final CommunityPost post;
  const _PostCard({required this.post});

  @override
  State<_PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<_PostCard> {
  late int _likes;
  late int _dislikes;
  bool _likeLoading = false;

  @override
  void initState() {
    super.initState();
    _likes = widget.post.likes;
    _dislikes = widget.post.dislikes;
  }

  Future<void> _handleLike(bool isLike) async {
    if (_likeLoading) return;
    setState(() => _likeLoading = true);

    final service = CommunityService();
    await service.toggleLike(widget.post.id, isLike);

    setState(() {
      if (isLike) {
        _likes++;
      } else {
        _dislikes++;
      }
      _likeLoading = false;
    });
  }

  void _sharePost() {
    final text = '${widget.post.username} posted on Durian Lens:\n\n${widget.post.caption}';
    Share.share(text, subject: 'Durian Lens Community Post');
  }

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('d MMM').format(widget.post.timestamp);
    final initials = widget.post.username.isNotEmpty ? widget.post.username[0].toUpperCase() : '?';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: AppDecorations.cardDecoration,
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => PostDetailPage(post: widget.post)),
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
                    backgroundImage: widget.post.userPhotoUrl != null ? NetworkImage(widget.post.userPhotoUrl!) : null,
                    child: widget.post.userPhotoUrl == null
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
                          widget.post.username,
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
                  if (widget.post.category == 'qna')
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'QnA',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Caption
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                widget.post.caption,
                style: const TextStyle(fontSize: 15, height: 1.4),
              ),
            ),
            const SizedBox(height: 12),

            // Image (only if exists)
            if (widget.post.imageUrl != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
                child: Image.network(
                  widget.post.imageUrl!,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _imagePlaceholder(),
                ),
              ),

            // Actions
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  InkWell(
                    onTap: _likeLoading ? null : () => _handleLike(true),
                    child: _actionIcon(Icons.thumb_up_outlined, '$_likes'),
                  ),
                  const SizedBox(width: 16),
                  InkWell(
                    onTap: _likeLoading ? null : () => _handleLike(false),
                    child: _actionIcon(Icons.thumb_down_outlined, '$_dislikes'),
                  ),
                  const SizedBox(width: 16),
                  _actionIcon(Icons.comment_outlined, '${widget.post.commentsCount}'),
                  const Spacer(),
                  InkWell(
                    onTap: _sharePost,
                    child: const Icon(Icons.share_outlined, size: 18, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      height: 160,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primaryGreenLight.withValues(alpha: 0.6),
            AppColors.primaryGreen.withValues(alpha: 0.4),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Icon(Icons.image, size: 48, color: Colors.white.withValues(alpha: 0.6)),
      ),
    );
  }

  Widget _actionIcon(IconData icon, String count) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(count, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
      ],
    );
  }
}
