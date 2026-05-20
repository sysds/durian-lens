import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../models/durian_library.dart';
import '../services/journal_service.dart';
import '../theme/app_theme.dart';

class DetectPage extends StatefulWidget {
  final File? imageFile;
  final String? variety;
  final double? confidence;
  final String? entryId;
  final DateTime? date;

  const DetectPage({
    super.key,
    this.imageFile,
    this.variety,
    this.confidence,
    this.entryId,
    this.date,
  });

  @override
  State<DetectPage> createState() => _DetectPageState();
}

class _DetectPageState extends State<DetectPage> {
  DurianLibraryItem? _libraryItem;
  bool _loading = true;
  bool _reported = false;

  Future<void> _reportIncorrect() async {
    if (widget.entryId == null || _reported) return;
    
    final service = JournalService();
    final entries = service.getAllEntries();
    final index = entries.indexWhere((e) => e.id == widget.entryId);
    if (index == -1) return;

    final entry = entries[index];
    final updated = entry.copyWith(
      notes: (entry.notes?.isEmpty ?? true) ? 'Reported Incorrect' : '${entry.notes}\nReported Incorrect',
    );
    await service.updateEntry(updated);
    setState(() => _reported = true);
  }

  String _normalizeString(String text) {
    return text.toLowerCase().replaceAll(' ', '').replaceAll('-', '');
  }

  @override
  void initState() {
    super.initState();
    _loadLibraryData();
  }

  Future<void> _loadLibraryData() async {
    try {
      final jsonString = await rootBundle.loadString('assets/durian_library.json');
      final List<dynamic> jsonList = jsonDecode(jsonString);
      final items = jsonList.map((e) => DurianLibraryItem.fromJson(e as Map<String, dynamic>)).toList();

      if (widget.variety != null) {
        final query = widget.variety!.toLowerCase();

        // Handle generic or unrelated labels explicitly
        if (query == 'unknown' || query.contains('unrelated')) {
          _libraryItem = null;
          if (mounted) setState(() => _loading = false);
          return;
        }

        final normalizedQuery = _normalizeString(query);

        _libraryItem = items.firstWhere(
          (item) {
            final normalizedItemName = _normalizeString(item.name);
            final normalizedAliases = item.aliases.map(_normalizeString).toList();
            return normalizedItemName == normalizedQuery ||
                   normalizedAliases.contains(normalizedQuery);
          },
          orElse: () => null as dynamic,
        );
      }
    } catch (_) {
      // ignore
    }
    setState(() => _loading = false);
  }

  bool get _hasHighConfidence {
    final c = widget.confidence ?? 0;
    return c >= 80;
  }

  @override
  Widget build(BuildContext context) {
    final variety = widget.variety ?? 'Unknown';
    final confidence = widget.confidence ?? 0.0;
    final hasImage = widget.imageFile != null && widget.imageFile!.existsSync();
    final dateStr = widget.date != null ? DateFormat('d MMM yyyy, HH:mm').format(widget.date!) : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Green header with image
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primaryGreenLight, AppColors.primaryGreen],
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(28),
                  bottomRight: Radius.circular(28),
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Column(
                  children: [
                    // Top bar
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.arrow_back, color: Colors.white),
                            onPressed: () => Navigator.pop(context),
                          ),
                          const Spacer(),
                        ],
                      ),
                    ),

                    // Durian Image (user requested this at top)
                    if (hasImage)
                      Container(
                        margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                        height: 180,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.file(
                            widget.imageFile!,
                            fit: BoxFit.cover,
                          ),
                        ),
                      )
                    else
                      const Padding(
                        padding: EdgeInsets.only(bottom: 16),
                        child: Icon(Icons.eco, size: 64, color: Colors.white54),
                      ),

                    // Variety name & confidence
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                      child: Text(
                        variety,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
                      child: Text(
                        'Identified with ${confidence.toStringAsFixed(1)}% confidence',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    if (dateStr != null)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
                        child: Text(
                          'Scanned on $dateStr',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white.withValues(alpha: 0.7),
                          ),
                        ),
                      ),

                    // Tags
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                      child: Wrap(
                        spacing: 8,
                        alignment: WrapAlignment.center,
                        children: [
                          if (_hasHighConfidence)
                            _tag('High confidence', Colors.green.shade300, Icons.check),
                          if (_libraryItem != null)
                            _tag('In season', Colors.amber.shade300, Icons.calendar_today),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Content card
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverToBoxAdapter(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: AppDecorations.cardDecoration,
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _libraryItem == null
                        ? Column(
                            children: [
                              Icon(Icons.search_off, size: 48, color: Colors.grey.shade400),
                              const SizedBox(height: 16),
                              const Text(
                                'Variety Not Recognized',
                                style: AppTextStyles.cardTitle,
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'We couldn\'t identify a specific durian variety in this image. For better results, ensure the fruit is well-lit and the thorns or base are clearly visible.',
                                style: AppTextStyles.body,
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Try Again'),
                              ),
                            ],
                          )
                        : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          InfoRow(
                            icon: Icons.restaurant,
                            label: 'TASTE PROFILE',
                            value: _libraryItem?.tasteProfile ?? 'Rich, bittersweet, creamy, lingering',
                          ),
                          InfoRow(
                            icon: Icons.attach_money,
                            label: 'PRICE RANGE',
                            value: _libraryItem?.priceRange ?? 'RM 35-70 / kg',
                          ),
                          InfoRow(
                            icon: Icons.calendar_today,
                            label: 'PEAK SEASON',
                            value: _libraryItem?.season ?? 'June – August',
                          ),
                          InfoRow(
                            icon: Icons.lightbulb,
                            label: 'RIPENESS TIP',
                            value: _libraryItem?.ripenessTips ??
                                'Look for a slight crack at the base and strong aroma',
                          ),
                        ],
                      ),
              ),
            ),
          ),

          // Feedback Section
          if (widget.entryId != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                child: OutlinedButton.icon(
                  onPressed: _reported ? null : _reportIncorrect,
                  icon: Icon(_reported ? Icons.check : Icons.report_problem_outlined, size: 18),
                  label: Text(_reported ? 'Feedback Received' : 'Report Incorrect Detection'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _reported ? Colors.grey : Colors.red.shade400,
                    side: BorderSide(color: _reported ? Colors.grey : Colors.red.shade400),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ),

          // Bottom spacing
          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
        ],
      ),
    );
  }

  Widget _tag(String label, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
