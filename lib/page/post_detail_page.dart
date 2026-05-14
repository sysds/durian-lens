import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import '../models/community_comment.dart';
import '../models/community_post.dart';
import '../services/community_service.dart';
import '../theme/app_theme.dart';

class PostDetailPage extends StatefulWidget {
  final CommunityPost post;
  const PostDetailPage({super.key, required this.post});

  @override
  State<PostDetailPage> createState() => _PostDetailPageState();
}

class _PostDetailPageState extends State<PostDetailPage> {
  final CommunityService _service = CommunityService();
  final TextEditingController _commentCtrl = TextEditingController();
  late int _likes;
  late int _dislikes;
  bool _likeLoading = false;

  @override
  void initState() {
    super.initState();
    _likes = widget.post.likes;
    _dislikes = widget.post.dislikes;
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitComment() async {
    final text = _commentCtrl.text.trim();
    if (text.isEmpty) return;
    await _service.addComment(widget.post.id, text);
    _commentCtrl.clear();
    if (mounted) FocusScope.of(context).unfocus();
  }

  Future<void> _handleLike(bool isLike) async {
    if (_likeLoading) return;
    setState(() => _likeLoading = true);
    await _service.toggleLike(widget.post.id, isLike);
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
    final timeStr = DateFormat('d MMM yyyy, HH:mm').format(widget.post.timestamp);
    final initials = widget.post.username.isNotEmpty ? widget.post.username[0].toUpperCase() : '?';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Post'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Post header
                  Row(
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
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.post.username, style: const TextStyle(fontWeight: FontWeight.bold)),
                            Text(timeStr, style: AppTextStyles.caption),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(widget.post.caption, style: const TextStyle(fontSize: 16, height: 1.4)),
                  const SizedBox(height: 16),

                  if (widget.post.imageUrl != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        widget.post.imageUrl!,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          height: 200,
                          color: AppColors.divider,
                          child: const Center(child: Icon(Icons.broken_image)),
                        ),
                      ),
                    ),

                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _actionButton(Icons.thumb_up_outlined, '$_likes', () => _handleLike(true)),
                      const SizedBox(width: 16),
                      _actionButton(Icons.thumb_down_outlined, '$_dislikes', () => _handleLike(false)),
                      const SizedBox(width: 16),
                      _actionButton(Icons.share_outlined, 'Share', _sharePost),
                    ],
                  ),
                  const Divider(height: 32),

                  // Comments
                  const Text('Comments', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 8),
                  StreamBuilder<List<CommunityComment>>(
                    stream: _service.getComments(widget.post.id),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      final comments = snapshot.data ?? [];
                      if (comments.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Center(child: Text('No comments yet. Start the conversation!')),
                        );
                      }
                      return ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: comments.length,
                        separatorBuilder: (_, __) => const Divider(),
                        itemBuilder: (context, index) {
                          final c = comments[index];
                          return _CommentTile(comment: c);
                        },
                      );
                    },
                  ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),

          // Comment Input
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, -2))],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentCtrl,
                      decoration: InputDecoration(
                        hintText: 'Write a comment...',
                        filled: true,
                        fillColor: AppColors.background,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.primaryGreen,
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 18),
                      onPressed: _submitComment,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionButton(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.textSecondary),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}

class _CommentTile extends StatelessWidget {
  final CommunityComment comment;
  const _CommentTile({required this.comment});

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('d MMM, HH:mm').format(comment.timestamp);
    final initials = comment.username.isNotEmpty ? comment.username[0].toUpperCase() : '?';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.15),
          child: Text(
            initials,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(comment.username, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(width: 8),
                  Text(timeStr, style: AppTextStyles.caption),
                ],
              ),
              const SizedBox(height: 4),
              Text(comment.text, style: const TextStyle(fontSize: 14)),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.thumb_up_outlined, size: 14, color: AppColors.textMuted),
                  const SizedBox(width: 4),
                  Text('${comment.likes}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  const SizedBox(width: 12),
                  const Icon(Icons.thumb_down_outlined, size: 14, color: AppColors.textMuted),
                  const SizedBox(width: 4),
                  Text('${comment.dislikes}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
