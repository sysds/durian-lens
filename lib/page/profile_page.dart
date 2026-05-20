import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../auth/login_page.dart';
import '../theme/app_theme.dart';
import 'feedback_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _uploadingImage = false;
  bool _isEditing = false;

  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _usernameCtrl = TextEditingController();
  final TextEditingController _bioCtrl = TextEditingController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _usernameCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked == null) return;

    setState(() => _uploadingImage = true);

    try {
      final user = FirebaseAuth.instance.currentUser!;
      final ref = FirebaseStorage.instance
          .ref()
          .child('profile_images/${user.uid}_${DateTime.now().millisecondsSinceEpoch}.jpg');
      final uploadTask = await ref.putFile(File(picked.path));

      if (uploadTask.state == TaskState.success) {
        final url = await ref.getDownloadURL();
        await user.updatePhotoURL(url);
        await FirebaseFirestore.instance.collection('users').doc(user.uid).update({
          'photoURL': url,
        });
      }
    } on FirebaseException catch (e) {
      _showStorageError(e);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to upload image: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _uploadingImage = false);
    }
  }

  void _showStorageError(FirebaseException e) {
    String message;
    if (e.code == 'object-not-found' || e.code == 'bucket-not-found') {
      message = 'Image upload failed: Firebase Storage is not set up. '
          'Go to Firebase Console > Storage and get started.';
    } else if (e.code == 'unauthorized') {
      message = 'Image upload failed: Check Storage rules allow authenticated uploads.';
    } else {
      message = 'Image upload failed (${e.code}): ${e.message}';
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), duration: const Duration(seconds: 5)),
      );
    }
  }

  Future<void> _saveProfile(Map<String, dynamic> currentData) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final name = _nameCtrl.text.trim();
    final username = _usernameCtrl.text.trim();
    final bio = _bioCtrl.text.trim();

    final updates = <String, dynamic>{};
    if (name.isNotEmpty && name != currentData['name']) {
      updates['name'] = name;
      updates['displayName'] = name;
      await user.updateDisplayName(name);
    }
    if (username != (currentData['username'] ?? '')) {
      updates['username'] = username.isNotEmpty ? username : null;
    }
    if (bio != (currentData['bio'] ?? '')) {
      updates['bio'] = bio.isNotEmpty ? bio : null;
    }

    if (updates.isNotEmpty) {
      await FirebaseFirestore.instance.collection('users').doc(user.uid).update(updates);
    }

    setState(() => _isEditing = false);
  }

  Future<void> _logout() async {
    await FirebaseAuth.instance.signOut();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('users').doc(user.uid).snapshots(),
        builder: (context, snapshot) {
          final data = snapshot.data?.data() as Map<String, dynamic>? ?? {};
          final photoUrl = data['photoURL'] as String? ?? user.photoURL;
          final name = data['name'] as String? ?? user.displayName ?? 'Durian User';
          final username = data['username'] as String?;
          final email = data['email'] as String? ?? user.email ?? '';
          final bio = data['bio'] as String? ?? '';

          if (!_isEditing) {
            _nameCtrl.text = name;
            _usernameCtrl.text = username ?? '';
            _bioCtrl.text = bio;
          }

          final initials = name.isNotEmpty ? name[0].toUpperCase() : '?';

          return Column(
            children: [
              _buildHeader(user, photoUrl, initials, name, email),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildProfileCard(name, username, email, bio, data),
                      const SizedBox(height: 16),
                      _buildMenuCard(),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _logout,
                          icon: const Icon(Icons.logout),
                          label: const Text('Log Out'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.redAccent,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildHeader(User user, String? photoUrl, String initials, String name, String email) {
    return Container(
      decoration: AppDecorations.greenHeaderDecoration,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Profile',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  if (!_isEditing)
                    IconButton(
                      icon: const Icon(Icons.edit, color: Colors.white),
                      onPressed: () => setState(() => _isEditing = true),
                    )
                  else
                    TextButton(
                      onPressed: () async {
                        final data = (await FirebaseFirestore.instance
                            .collection('users')
                            .doc(user.uid)
                            .get())
                            .data() ?? {};
                        await _saveProfile(data);
                      },
                      child: const Text(
                        'Save',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Stack(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.white.withValues(alpha: 0.2),
                    backgroundImage: photoUrl != null ? NetworkImage(photoUrl) : null,
                    child: photoUrl == null
                        ? Text(
                            initials,
                            style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          )
                        : null,
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: GestureDetector(
                      onTap: _uploadingImage ? null : _pickAndUploadImage,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: _uploadingImage
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen),
                              )
                            : const Icon(Icons.camera_alt, size: 18, color: AppColors.primaryGreen),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                name,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                email,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileCard(String name, String? username, String email, String bio, Map<String, dynamic> data) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: AppDecorations.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'About Me',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),

          // Name
          _buildFieldRow(
            icon: Icons.person,
            label: 'Name',
            child: _isEditing
                ? TextField(
                    controller: _nameCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Your name',
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      border: OutlineInputBorder(),
                    ),
                  )
                : Text(name, style: const TextStyle(fontSize: 15)),
          ),
          const SizedBox(height: 12),

          // Username
          _buildFieldRow(
            icon: Icons.alternate_email,
            label: 'Username',
            child: _isEditing
                ? TextField(
                    controller: _usernameCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Set a username',
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      border: OutlineInputBorder(),
                    ),
                  )
                : Text(
                    username?.isNotEmpty == true ? '@$username' : 'No username set',
                    style: TextStyle(
                      fontSize: 15,
                      color: username?.isNotEmpty == true ? AppColors.textPrimary : AppColors.textMuted,
                    ),
                  ),
          ),
          const SizedBox(height: 12),

          // Email
          _buildFieldRow(
            icon: Icons.email,
            label: 'Email',
            child: Text(email, style: const TextStyle(fontSize: 15)),
          ),
          const SizedBox(height: 12),

          // Bio
          _buildFieldRow(
            icon: Icons.info_outline,
            label: 'Bio',
            child: _isEditing
                ? TextField(
                    controller: _bioCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Tell us about yourself...',
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      border: OutlineInputBorder(),
                    ),
                  )
                : Text(
                    bio.isNotEmpty ? bio : 'No bio yet',
                    style: TextStyle(
                      fontSize: 15,
                      color: bio.isNotEmpty ? AppColors.textPrimary : AppColors.textMuted,
                      height: 1.4,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldRow({required IconData icon, required String label, required Widget child}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppColors.primaryGreen),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              child,
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMenuCard() {
    return Container(
      decoration: AppDecorations.cardDecoration,
      child: Column(
        children: [
          _menuItem(Icons.feedback_outlined, 'Give Feedback', () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const FeedbackPage()));
          }),
          const Divider(height: 1, indent: 16, endIndent: 16),
          _menuItem(Icons.share_outlined, 'Share Durian Lens', () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Share functionality coming soon')),
            );
          }),
        ],
      ),
    );
  }

  Widget _menuItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primaryGreen),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}
