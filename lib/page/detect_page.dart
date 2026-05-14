import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/durian_library.dart';
import '../theme/app_theme.dart';

class DetectPage extends StatefulWidget {
  final File? imageFile;
  final String? variety;
  final double? confidence;

  const DetectPage({
    super.key,
    this.imageFile,
    this.variety,
    this.confidence,
  });

  @override
  State<DetectPage> createState() => _DetectPageState();
}

class _DetectPageState extends State<DetectPage> {
  DurianLibraryItem? _libraryItem;
  bool _loading = true;

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
        _libraryItem = items.firstWhere(
          (item) =>
              item.name.toLowerCase() == query ||
              item.aliases.any((a) => a.toLowerCase() == query) ||
              item.name.toLowerCase().contains(query),
          orElse: () => items.firstWhere(
            (item) => item.name.toLowerCase().contains('musang'),
            orElse: () => items.first,
          ),
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
                padding: const EdgeInsets.all(20),
                decoration: AppDecorations.cardDecoration,
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
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
