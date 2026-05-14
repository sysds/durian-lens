import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/settings_service.dart';
import '../theme/app_theme.dart';
import 'about_page.dart';
import 'feedback_page.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

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
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Appearance
          Container(
            decoration: AppDecorations.cardDecoration,
            child: Column(
              children: [
                const ListTile(
                  leading: Icon(Icons.palette, color: AppColors.primaryGreen),
                  title: Text('Appearance'),
                  subtitle: Text('Choose your preferred theme'),
                ),
                const Divider(height: 1, indent: 16, endIndent: 16),
                ValueListenableBuilder<ThemeMode>(
                  valueListenable: SettingsService.themeMode,
                  builder: (context, mode, _) {
                    return Column(
                      children: [
                        _themeTile('Light', Icons.wb_sunny, mode == ThemeMode.light, () {
                          SettingsService.setThemeMode(ThemeMode.light);
                        }),
                        _themeTile('Dark', Icons.nights_stay, mode == ThemeMode.dark, () {
                          SettingsService.setThemeMode(ThemeMode.dark);
                        }),
                        _themeTile('System Default', Icons.settings_suggest, mode == ThemeMode.system, () {
                          SettingsService.setThemeMode(ThemeMode.system);
                        }),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // General
          Container(
            decoration: AppDecorations.cardDecoration,
            child: Column(
              children: [
                _menuTile(Icons.feedback_outlined, 'Give Feedback', () => _navigate(context, const FeedbackPage())),
                const Divider(height: 1, indent: 16, endIndent: 16),
                _menuTile(Icons.share, 'Recommend Durian Lens', () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Share functionality coming soon')),
                  );
                }),
                const Divider(height: 1, indent: 16, endIndent: 16),
                _menuTile(Icons.contact_mail, 'Contact & Social', () {
                  showModalBottomSheet(
                    context: context,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    builder: (_) => SafeArea(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ListTile(
                            leading: const Icon(Icons.email, color: AppColors.primaryGreen),
                            title: const Text('Email Us'),
                            subtitle: const Text('support@durianlens.app'),
                            onTap: () => _launchUrl('mailto:support@durianlens.app'),
                          ),
                          ListTile(
                            leading: const Icon(Icons.link, color: AppColors.primaryGreen),
                            title: const Text('Instagram'),
                            subtitle: const Text('@durianlens'),
                            onTap: () => _launchUrl('https://instagram.com/durianlens'),
                          ),
                          ListTile(
                            leading: const Icon(Icons.link, color: AppColors.primaryGreen),
                            title: const Text('Facebook'),
                            subtitle: const Text('facebook.com/durianlens'),
                            onTap: () => _launchUrl('https://facebook.com/durianlens'),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // About
          Container(
            decoration: AppDecorations.cardDecoration,
            child: Column(
              children: [
                _menuTile(Icons.info_outline, 'About', () => _navigate(context, const AboutPage())),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _themeTile(String label, IconData icon, bool selected, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: selected ? AppColors.primaryGreen : AppColors.textMuted),
      title: Text(label),
      trailing: selected ? const Icon(Icons.check, color: AppColors.primaryGreen) : null,
      onTap: onTap,
    );
  }

  Widget _menuTile(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primaryGreen),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}
