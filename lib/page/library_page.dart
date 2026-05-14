import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/durian_library.dart';
import '../theme/app_theme.dart';

class LibraryPage extends StatefulWidget {
  const LibraryPage({super.key});

  @override
  State<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends State<LibraryPage> {
  List<DurianLibraryItem> _items = [];
  List<DurianLibraryItem> _filtered = [];
  bool _loading = true;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _loadLibrary();
  }

  Future<void> _loadLibrary() async {
    final jsonString = await rootBundle.loadString('assets/durian_library.json');
    final List<dynamic> jsonList = jsonDecode(jsonString);
    _items = jsonList.map((e) => DurianLibraryItem.fromJson(e as Map<String, dynamic>)).toList();
    _items.sort((a, b) => b.popularity.compareTo(a.popularity));
    _filtered = List.from(_items);
    setState(() => _loading = false);
  }

  void _search(String query) {
    setState(() {
      _query = query.toLowerCase();
      _filtered = _items.where((item) {
        return item.name.toLowerCase().contains(_query) ||
            item.aliases.any((a) => a.toLowerCase().contains(_query));
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Durian Library'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    onChanged: _search,
                    decoration: InputDecoration(
                      hintText: 'Search durian type...',
                      prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    itemCount: _filtered.length,
                    itemBuilder: (context, index) {
                      final item = _filtered[index];
                      return _buildItemCard(item);
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildItemCard(DurianLibraryItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: AppDecorations.cardDecoration,
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          item.name,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        subtitle: Text(
          '${item.origin} • ${item.season}',
          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.star, size: 16, color: Colors.amber),
            Text('${item.popularity}'),
          ],
        ),
        children: [
          _infoRow(Icons.restaurant, 'Taste Profile', item.tasteProfile),
          _infoRow(Icons.texture, 'Texture', item.texture),
          _infoRow(Icons.color_lens, 'Colour', item.colour),
          _infoRow(Icons.lightbulb, 'Ripeness Tips', item.ripenessTips),
          _infoRow(Icons.attach_money, 'Price Range', item.priceRange),
          if (item.aliases.isNotEmpty)
            _infoRow(Icons.label, 'Also Known As', item.aliases.join(', ')),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.primaryGreen),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
