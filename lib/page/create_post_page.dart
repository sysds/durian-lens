import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../services/community_service.dart';
import '../theme/app_theme.dart';

class CreatePostPage extends StatefulWidget {
  const CreatePostPage({super.key});

  @override
  State<CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends State<CreatePostPage> {
  final TextEditingController _captionCtrl = TextEditingController();
  final CommunityService _service = CommunityService();
  File? _imageFile;
  bool _loading = false;
  String _category = 'general';

  @override
  void dispose() {
    _captionCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file != null) {
      setState(() => _imageFile = File(file.path));
    }
  }

  Future<String?> _uploadImage() async {
    if (_imageFile == null) return null;
    try {
      final ref = FirebaseStorage.instance
          .ref()
          .child('community_images/${DateTime.now().millisecondsSinceEpoch}.jpg');
      final uploadTask = await ref.putFile(_imageFile!);
      if (uploadTask.state == TaskState.success) {
        return await ref.getDownloadURL();
      }
      return null;
    } on FirebaseException catch (e) {
      debugPrint('Firebase Storage error: ${e.code} - ${e.message}');
      rethrow;
    } catch (e) {
      debugPrint('Image upload error: $e');
      rethrow;
    }
  }

  Future<void> _submit() async {
    final caption = _captionCtrl.text.trim();
    if (caption.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please write a caption')));
      return;
    }

    setState(() => _loading = true);

    String? imageUrl;
    if (_imageFile != null) {
      try {
        imageUrl = await _uploadImage();
      } on FirebaseException catch (e) {
        String message;
        if (e.code == 'object-not-found' || e.code == 'bucket-not-found') {
          message = 'Image upload failed: Firebase Storage is not set up correctly. '
              'Please check your Firebase Console > Storage rules and ensure the bucket exists.';
        } else if (e.code == 'unauthorized') {
          message = 'Image upload failed: You do not have permission. '
              'Please check Storage rules allow authenticated uploads.';
        } else {
          message = 'Image upload failed (${e.code}): ${e.message}';
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message), duration: const Duration(seconds: 5)),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Image upload failed: $e'), duration: const Duration(seconds: 4)),
          );
        }
      }
    }

    try {
      await _service.createPost(
        caption: caption,
        imageUrl: imageUrl,
        category: _category,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(imageUrl == null && _imageFile != null
                ? 'Post published without image due to upload error.'
                : 'Post published!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving post: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Create Post'),
        backgroundColor: AppColors.primaryGreen,
        actions: [
          TextButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Post', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category
            Wrap(
              spacing: 8,
              children: [
                'general',
                'qna',
                'review',
                'tip',
              ].map((cat) {
                final selected = _category == cat;
                return ChoiceChip(
                  label: Text(cat.toUpperCase()),
                  selected: selected,
                  selectedColor: AppColors.primaryGreen,
                  backgroundColor: Colors.white,
                  labelStyle: TextStyle(
                    color: selected ? Colors.white : AppColors.textSecondary,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(color: selected ? AppColors.primaryGreen : AppColors.divider),
                  ),
                  showCheckmark: false,
                  onSelected: (_) => setState(() => _category = cat),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Caption
            TextField(
              controller: _captionCtrl,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'What is on your mind?',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 16),

            // Image preview
            if (_imageFile != null)
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.file(_imageFile!, height: 200, width: double.infinity, fit: BoxFit.cover),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: CircleAvatar(
                      backgroundColor: Colors.black54,
                      radius: 18,
                      child: IconButton(
                        icon: const Icon(Icons.close, color: Colors.white, size: 18),
                        onPressed: () => setState(() => _imageFile = null),
                      ),
                    ),
                  ),
                ],
              ),

            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.photo_library),
              label: const Text('Add Photo'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
