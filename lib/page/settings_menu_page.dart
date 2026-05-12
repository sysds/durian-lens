import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'about_page.dart';
import 'feedback_page.dart';
import 'tutorial_page.dart';

class SettingsMenuPage extends StatelessWidget {
  const SettingsMenuPage({super.key});

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _navigate(BuildContext context, Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF1F8E9),
      appBar: AppBar(
        title: const Text('Menu'),
        backgroundColor: Colors.green.shade700,
      ),
      body: ListView(
        children: [
          _menuTile(Icons.settings, 'Settings', () {}),
          _menuTile(Icons.feedback, 'Give Feedback', () => _navigate(context, const FeedbackPage())),
          _menuTile(Icons.share, 'Recommend Durian Lens', () {
            // In a real app, use Share.share
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Share functionality coming soon')),
            );
          }),
          _menuTile(Icons.contact_mail, 'Contact & Social', () {
            showModalBottomSheet(
              context: context,
              builder: (_) => SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ListTile(
                      leading: const Icon(Icons.email, color: Colors.green),
                      title: const Text('Email Us'),
                      subtitle: const Text('support@durianlens.app'),
                      onTap: () => _launchUrl('mailto:support@durianlens.app'),
                    ),
                    ListTile(
                      leading: const Icon(Icons.link, color: Colors.green),
                      title: const Text('Instagram'),
                      subtitle: const Text('@durianlens'),
                      onTap: () => _launchUrl('https://instagram.com/durianlens'),
                    ),
                    ListTile(
                      leading: const Icon(Icons.link, color: Colors.green),
                      title: const Text('Facebook'),
                      subtitle: const Text('facebook.com/durianlens'),
                      onTap: () => _launchUrl('https://facebook.com/durianlens'),
                    ),
                  ],
                ),
              ),
            );
          }),
          _menuTile(Icons.info_outline, 'About', () => _navigate(context, const AboutPage())),
          _menuTile(Icons.school, 'Quickstart (Tutorial)', () => _navigate(context, const TutorialPage())),
        ],
      ),
    );
  }

  Widget _menuTile(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: Colors.green.shade700),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
