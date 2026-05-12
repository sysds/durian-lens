import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/durian_library.dart';

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
      backgroundColor: const Color(0xffF1F8E9),
      appBar: AppBar(
        title: const Text('Durian Library'),
        backgroundColor: Colors.green.shade700,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: TextField(
                    onChanged: _search,
                    decoration: InputDecoration(
                      hintText: 'Search durian type...',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    ),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
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
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(item.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
        subtitle: Text('${item.origin} • ${item.season}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
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
          Icon(icon, size: 18, color: Colors.green.shade700),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
