import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/journal_entry.dart';
import '../services/durian_client.dart';
import '../services/journal_service.dart';
import '../services/location_service.dart';
import '../services/weather_service.dart';
import '../theme/app_theme.dart';
import 'detect_page.dart';
import 'history_page.dart';
import 'library_page.dart';
import 'map_page.dart';
import 'settings_page.dart';
import 'top_videos_page.dart';
import 'about_page.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
  bool _isScanning = false;
  JournalEntry? _lastScan;

  final DurianClient _client = DurianClient();
  final JournalService _journalService = JournalService();
  final WeatherService _weatherService = WeatherService();
  final LocationService _locationService = LocationService();

  WeatherInfo? _weather;

  @override
  void initState() {
    super.initState();
    _loadLocationAndWeather();
    _loadLastScan();
  }

  void _loadLastScan() {
    final entries = _journalService.getAllEntries();
    if (entries.isNotEmpty) {
      setState(() {
        _lastScan = entries.first;
      });
    }
  }

  Future<void> _loadLocationAndWeather() async {
    final pos = await _locationService.getCurrentPosition();
    if (pos != null) {
      final weather = await _weatherService.getCurrentWeather(pos.latitude, pos.longitude);
      setState(() {
        _weather = weather ?? _weatherService.getPlaceholderWeather();
      });
    } else {
      setState(() {
        _weather = _weatherService.getPlaceholderWeather();
      });
    }
  }

  Future<void> _pickAndDetect(ImageSource source) async {
    if (_isScanning) return;

    final picker = ImagePicker();
    final XFile? pickedFile = await picker.pickImage(source: source, imageQuality: 85);
    if (pickedFile == null) return;

    final file = File(pickedFile.path);

    setState(() => _isScanning = true);

    final data = await _client.detectDurian(pickedFile);

    if (!mounted) return;

    if (data != null) {
      final label = data['label']?.toString() ?? 'Unknown';
      final confidence = double.tryParse(data['confidence'].toString()) ?? 0.0;

      final savedFile = await _copyImageToAppDocs(file);

      final entry = JournalEntry(
        id: const Uuid().v4(),
        photoPath: savedFile.path,
        date: DateTime.now(),
        variety: label,
        confidence: confidence,
      );
      await _journalService.addEntry(entry);

      setState(() {
        _lastScan = entry;
        _isScanning = false;
      });

      // Navigate to result page
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => DetectPage(
              imageFile: savedFile,
              variety: label,
              confidence: confidence,
            ),
          ),
        );
      }
    } else {
      setState(() => _isScanning = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to reach server. Check IP and server status.')),
        );
      }
    }
  }

  Future<File> _copyImageToAppDocs(File source) async {
    final docsDir = await getApplicationDocumentsDirectory();
    final fileName = 'durian_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final dest = File('${docsDir.path}/$fileName');
    return source.copy(dest.path);
  }

  void _navigate(Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Green Header
          Container(
            decoration: AppDecorations.greenHeaderDecoration,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Durian Lens',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _greeting(),
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.white.withValues(alpha: 0.8),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (_weather != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.wb_sunny, color: Colors.white, size: 16),
                                const SizedBox(width: 6),
                                Text(
                                  '${_weather!.temperature.toStringAsFixed(0)}°C • ${_weather!.description}',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        const SizedBox(width: 8),
                        PopupMenuButton<String>(
                          icon: const Icon(Icons.more_vert, color: Colors.white),
                          color: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          onSelected: (value) {
                            if (value == 'settings') {
                              _navigate(const SettingsPage());
                            } else if (value == 'about') {
                              _navigate(const AboutPage());
                            }
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: 'settings',
                              child: Row(
                                children: [
                                  Icon(Icons.settings, color: AppColors.primaryGreen, size: 20),
                                  SizedBox(width: 12),
                                  Text('Settings'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: 'about',
                              child: Row(
                                children: [
                                  Icon(Icons.info_outline, color: AppColors.primaryGreen, size: 20),
                                  SizedBox(width: 12),
                                  Text('About'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Camera Area
                  Container(
                    height: 240,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppColors.primaryGreen.withValues(alpha: 0.25),
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: DashedBorderBox(
                      child: _isScanning
                          ? const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                CircularProgressIndicator(color: AppColors.primaryGreen),
                                SizedBox(height: 12),
                                Text(
                                  'Identifying...',
                                  style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.w500),
                                ),
                              ],
                            )
                          : InkWell(
                              onTap: () => _pickAndDetect(ImageSource.camera),
                              borderRadius: BorderRadius.circular(20),
                              child: const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.camera_alt, size: 48, color: AppColors.primaryGreen),
                                  SizedBox(height: 12),
                                  Text(
                                    'Tap to identify your durian',
                                    style: TextStyle(
                                      fontSize: 15,
                                      color: AppColors.primaryGreen,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Gallery Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _isScanning ? null : () => _pickAndDetect(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library, size: 18),
                      label: const Text('Choose from Gallery'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primaryGreen,
                        side: const BorderSide(color: AppColors.primaryGreen),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Last Scan
                  if (_lastScan != null) ...[
                    const Text('LAST SCAN', style: AppTextStyles.sectionTitle),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: AppDecorations.cardDecoration,
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'VARIETY DETECTED',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textMuted,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _lastScan!.variety,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Expanded(
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: LinearProgressIndicator(
                                          value: _lastScan!.confidence / 100,
                                          backgroundColor: AppColors.divider,
                                          valueColor: const AlwaysStoppedAnimation(AppColors.primaryGreen),
                                          minHeight: 6,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      '${_lastScan!.confidence.toStringAsFixed(1)}% confidence',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.primaryGreen.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.eco, color: AppColors.primaryGreen),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Explore
                  const Text('EXPLORE', style: AppTextStyles.sectionTitle),
                  const SizedBox(height: 12),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.65,
                    children: [
                      ExploreCard(
                        title: 'History',
                        subtitle: 'View past scans',
                        icon: Icons.history,
                        iconColor: Colors.blue.shade700,
                        onTap: () => _navigate(const HistoryPage()),
                      ),
                      ExploreCard(
                        title: 'Map & Stores',
                        subtitle: 'Find nearby stalls',
                        icon: Icons.location_on,
                        iconColor: Colors.red.shade400,
                        onTap: () => _navigate(const MapPage()),
                      ),
                      ExploreCard(
                        title: 'Library',
                        subtitle: 'Durian varieties',
                        icon: Icons.menu_book,
                        iconColor: Colors.orange.shade700,
                        onTap: () => _navigate(const LibraryPage()),
                      ),
                      ExploreCard(
                        title: 'Top Videos',
                        subtitle: 'Popular posts',
                        icon: Icons.play_circle_fill,
                        iconColor: Colors.purple.shade600,
                        onTap: () => _navigate(const TopVideosPage()),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DashedBorderBox extends StatelessWidget {
  final Widget child;
  const DashedBorderBox({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedBorderPainter(),
      child: Center(child: child),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primaryGreen.withValues(alpha: 0.3)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    const radius = 20.0;
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(8, 8, size.width - 16, size.height - 16),
      const Radius.circular(radius),
    );

    final path = Path()..addRRect(rrect);
    final dashPath = Path();
    const dashWidth = 8.0;
    const dashSpace = 6.0;
    double distance = 0.0;

    for (final metric in path.computeMetrics()) {
      while (distance < metric.length) {
        dashPath.addPath(
          metric.extractPath(distance, distance + dashWidth),
          Offset.zero,
        );
        distance += dashWidth + dashSpace;
      }
    }

    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
