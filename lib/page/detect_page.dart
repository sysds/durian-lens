import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/journal_entry.dart';
import '../services/durian_client.dart';
import '../services/journal_service.dart';
import '../services/report_service.dart';
import 'tips_page.dart';

class DetectPage extends StatefulWidget {
  const DetectPage({super.key});

  @override
  State<DetectPage> createState() => _DetectPageState();
}

class _DetectPageState extends State<DetectPage> {
  File? _image;
  String _resultText = 'Please take or choose photo';
  bool _isScanning = false;
  String? _lastLabel;
  File? _lastSavedFile;

  final DurianClient _client = DurianClient();
  final JournalService _journalService = JournalService();
  final ReportService _reportService = ReportService();

  Future<void> _pickAndUploadImage(ImageSource source) async {
    if (_isScanning) return;

    final picker = ImagePicker();
    final XFile? pickedFile = await picker.pickImage(
      source: source,
      imageQuality: 85,
    );

    if (pickedFile == null) return;

    final file = File(pickedFile.path);

    setState(() {
      _image = file;
      _isScanning = true;
      _resultText = 'Verify...';
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

      await _promptForNotesAndSave(
        label: label,
        confidence: confidence,
        photoPath: savedFile.path,
      );

      setState(() {
        _resultText = 'Category Durian: $label\nConfidence: ${confidence.toStringAsFixed(2)}%';
        _isScanning = false;
      });
    } else {
      setState(() {
        _resultText = 'Gagal hubungi server. Pastikan IP betul & server aktif.';
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

  Future<void> _promptForNotesAndSave({
    required String label,
    required double confidence,
    required String photoPath,
  }) async {
    if (!mounted) return;

    final notesResult = await showDialog<Map<String, String>>(
      context: context,
      barrierDismissible: false,
      builder: (context) => const _NotesDialog(),
    );

    final entry = JournalEntry(
      id: const Uuid().v4(),
      photoPath: photoPath,
      date: DateTime.now(),
      variety: label,
      confidence: confidence,
      taste: notesResult?['taste'],
      price: notesResult?['price'],
      seller: notesResult?['seller'],
      notes: notesResult?['notes'],
    );

    await _journalService.addEntry(entry);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF1F8E9),
      appBar: AppBar(
        title: const Text('Detection Durian'),
        backgroundColor: Colors.green.shade700,
        actions: [
          IconButton(
            icon: const Icon(Icons.lightbulb_outline),
            tooltip: 'Tips & Seasons',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TipsPage()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            Container(
              height: 310,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 14, offset: Offset(0, 8)),
                ],
              ),
              child: _image != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.file(_image!, fit: BoxFit.cover),
                    )
                  : const Center(
                      child: Icon(Icons.image_outlined, size: 100, color: Colors.grey),
                    ),
            ),
            const SizedBox(height: 22),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 12, offset: Offset(0, 6)),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    'Result',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.green),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _resultText,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  if (_lastLabel != null && !_isScanning)
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _showReportDialog,
                        icon: const Icon(Icons.report_problem_outlined, color: Colors.red),
                        label: const Text('Report Incorrect', style: TextStyle(color: Colors.red)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.red),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                  if (_isScanning)
                    const CircularProgressIndicator()
                  else ...[
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _pickAndUploadImage(ImageSource.camera),
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
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _pickAndUploadImage(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library),
                        label: const Text('Choose from Gallery'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.brown.shade600,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotesDialog extends StatefulWidget {
  const _NotesDialog();

  @override
  State<_NotesDialog> createState() => _NotesDialogState();
}

class _NotesDialogState extends State<_NotesDialog> {
  final tasteCtrl = TextEditingController();
  final priceCtrl = TextEditingController();
  final sellerCtrl = TextEditingController();
  final notesCtrl = TextEditingController();

  @override
  void dispose() {
    tasteCtrl.dispose();
    priceCtrl.dispose();
    sellerCtrl.dispose();
    notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Journal Notes'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: tasteCtrl, decoration: const InputDecoration(labelText: 'Taste / Flavour')),
            TextField(controller: priceCtrl, decoration: const InputDecoration(labelText: 'Price (RM)')),
            TextField(controller: sellerCtrl, decoration: const InputDecoration(labelText: 'Seller / Stall')),
            TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Extra Notes'), maxLines: 2),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Skip')),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, {
            'taste': tasteCtrl.text.trim(),
            'price': priceCtrl.text.trim(),
            'seller': sellerCtrl.text.trim(),
            'notes': notesCtrl.text.trim(),
          }),
          child: const Text('Save'),
        ),
      ],
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
          onPressed: () => Navigator.pop(context, {
            'corrected': _corrected,
            'comment': commentCtrl.text.trim(),
          }),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          child: const Text('Submit'),
        ),
      ],
    );
  }
}
