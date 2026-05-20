import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('About'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: AppDecorations.cardDecoration,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.eco, size: 60, color: AppColors.primaryGreen),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Durian Lens',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Version 1.0.0',
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Durian Lens is an AI-powered durian identification app built for durian lovers in Malaysia and beyond. '
                    'Identify durian varieties, discover nearby stalls, learn ripeness tips, and connect with a community of enthusiasts.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, height: 1.5, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Container(
              decoration: AppDecorations.cardDecoration,
              child: const Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.code, color: AppColors.primaryGreen),
                    title: Text('Developed by'),
                    subtitle: Text('SITI NUR SYUHADAH BT MOHD ZAYADI'),
                  ),
                  Divider(height: 1),
                  ListTile(
                    leading: Icon(Icons.email, color: AppColors.primaryGreen),
                    title: Text('Contact'),
                    subtitle: Text('2024806602@student.uitm.edu.my'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
