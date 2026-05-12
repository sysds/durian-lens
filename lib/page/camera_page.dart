import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/journal_entry.dart';
import '../services/durian_client.dart';
import '../services/journal_service.dart';
import '../services/location_service.dart';
import '../services/report_service.dart';
import '../services/weather_service.dart';
import 'history_page.dart';
import 'library_page.dart';
import 'map_page.dart';
import 'settings_menu_page.dart';
import 'top_videos_page.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
  File? _image;
  String _resultText = 'Take a photo to identify your durian';
  bool _isScanning = false;
  String? _lastLabel;
  File? _lastSavedFile;

  final DurianClient _client = DurianClient();
  final JournalService _journalService = JournalService();
  final ReportService _reportService = ReportService();
  final WeatherService _weatherService = WeatherService();
  final LocationService _locationService = LocationService();

  WeatherInfo? _weather;

  @override
  void initState() {
    super.initState();
    _loadLocationAndWeather();
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

    setState(() {
      _image = file;
      _isScanning = true;
      _resultText = 'Identifying...';
      _lastLabel = null;
      _lastSavedFile = null;
    });

    final data = await _client.detectDurian(pickedFile);

    if (!mounted) return;

    if (data != null) {
      final label = data['label']?.toString() ?? 'Unknown';
      final confidence = double.tryParse(data['confidence'].toString()) ?? 0.0;

      final savedFile = await _copyImageToAppDocs(file);
      _lastSavedFile = savedFile;
      _lastLabel = label;

      // Auto-save basic entry without forcing notes popup
      final entry = JournalEntry(
        id: const Uuid().v4(),
        photoPath: savedFile.path,
        date: DateTime.now(),
        variety: label,
        confidence: confidence,
      );
      await _journalService.addEntry(entry);

      setState(() {
        _resultText = '$label\nConfidence: ${confidence.toStringAsFixed(2)}%';
        _isScanning = false;
      });
    } else {
      setState(() {
        _resultText = 'Failed to reach server. Check IP and server status.';
        _isScanning = false;
      });
    }
  }

  Future<File> _copyImageToAppDocs(File source) async {
    final docsDir = await getApplicationDocumentsDirectory();
    final fileName = 'durian_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final dest = File('${docsDir.path}/$fileName');
    return source.copy(dest.path);
  }

  Future<void> _showReportDialog() async {
    if (_lastLabel == null || _lastSavedFile == null) return;

    final result = await showDialog<Map<String, String>?>(
      context: context,
      builder: (context) => _ReportDialog(predictedLabel: _lastLabel!),
    );
    if (result == null) return;

    try {
      await _reportService.submitReport(
        predictedLabel: _lastLabel!,
        correctedLabel: result['corrected']!,
        comment: result['comment']!,
        imageFile: _lastSavedFile,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Report submitted. Thank you!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit report: $e')),
        );
      }
    }
  }

  void _navigate(Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = DateFormat('EEEE, d MMMM yyyy').format(now);

    return Scaffold(
      backgroundColor: const Color(0xffF1F8E9),
      appBar: AppBar(
        title: const Text('Durian Lens'),
        backgroundColor: Colors.green.shade700,
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () => _navigate(const SettingsMenuPage()),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date & Weather
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(dateStr, style: TextStyle(fontSize: 14, color: Colors.grey.shade700)),
                      const SizedBox(height: 4),
                      if (_weather != null)
                        Row(
                          children: [
                            Icon(Icons.wb_sunny, color: Colors.orange.shade600, size: 20),
                            const SizedBox(width: 6),
                            Text(
                              '${_weather!.temperature.toStringAsFixed(0)}°C • ${_weather!.description}',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                            ),
                          ],
                        )
                      else
                        const SizedBox(height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Detection Result / Image
            Container(
              height: 280,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 14, offset: Offset(0, 8))],
              ),
              child: _image != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.file(_image!, fit: BoxFit.cover),
                    )
                  : const Center(child: Icon(Icons.camera_alt, size: 80, color: Colors.grey)),
            ),
            const SizedBox(height: 16),

            // Result Text
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
              ),
              child: Column(
                children: [
                  Text(
                    _resultText,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  if (_lastLabel != null && !_isScanning) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _showReportDialog,
                        icon: const Icon(Icons.report_problem_outlined, color: Colors.red, size: 18),
                        label: const Text('Report Incorrect', style: TextStyle(color: Colors.red)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.red),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Action Buttons
            if (_isScanning)
              const Center(child: CircularProgressIndicator())
            else
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _pickAndDetect(ImageSource.camera),
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Take Photo'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.shade700,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _pickAndDetect(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library),
                      label: const Text('Gallery'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.brown.shade600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 24),

            // Feature Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _featureCard('History', Icons.history, Colors.blue.shade700, () => _navigate(const HistoryPage())),
                _featureCard('Map & Stores', Icons.map, Colors.green.shade700, () => _navigate(const MapPage())),
                _featureCard('Durian Library', Icons.menu_book, Colors.orange.shade700, () => _navigate(const LibraryPage())),
                _featureCard('Top Videos', Icons.play_circle_fill, Colors.purple.shade700, () => _navigate(const TopVideosPage())),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _featureCard(String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }
}

class _ReportDialog extends StatefulWidget {
  final String predictedLabel;
  const _ReportDialog({required this.predictedLabel});

  @override
  State<_ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<_ReportDialog> {
  String _corrected = 'Black Thorn';
  final commentCtrl = TextEditingController();
  final List<String> _varieties = const ['Black Thorn', 'D24', 'Musang King', 'Other'];

  @override
  void dispose() {
    commentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Report Incorrect Prediction'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Predicted: ${widget.predictedLabel}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            InputDecorator(
              decoration: const InputDecoration(labelText: 'Correct Variety'),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _corrected,
                  isExpanded: true,
                  items: _varieties.map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
                  onChanged: (v) => setState(() => _corrected = v!),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: commentCtrl,
              decoration: const InputDecoration(labelText: 'Comment (optional)'),
              maxLines: 2,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, {'corrected': _corrected, 'comment': commentCtrl.text.trim()}),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          child: const Text('Submit'),
        ),
      ],
    );
  }
}
