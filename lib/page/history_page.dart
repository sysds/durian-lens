import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/journal_entry.dart';
import '../services/csv_service.dart';
import '../services/journal_service.dart';
import '../theme/app_theme.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  final JournalService _journalService = JournalService();

  void _refresh() => setState(() {});

  Future<void> _exportCsv() async {
    final entries = _journalService.getAllEntries();
    if (entries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No entries to export')),
      );
      return;
    }
    await CsvService.exportToCsv(entries);
  }

  Future<void> _deleteEntry(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Entry?'),
        content: const Text('This will permanently remove the journal entry.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await _journalService.deleteEntry(id);
      _refresh();
    }
  }

  Future<void> _editNotes(JournalEntry entry) async {
    final tasteCtrl = TextEditingController(text: entry.taste ?? '');
    final priceCtrl = TextEditingController(text: entry.price ?? '');
    final sellerCtrl = TextEditingController(text: entry.seller ?? '');
    final notesCtrl = TextEditingController(text: entry.notes ?? '');

    final result = await showDialog<Map<String, String>?>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Edit Notes'),
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
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
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
      ),
    );

    tasteCtrl.dispose();
    priceCtrl.dispose();
    sellerCtrl.dispose();
    notesCtrl.dispose();

    if (result == null) return;

    final updated = entry.copyWith(
      taste: result['taste']!.isEmpty ? null : result['taste'],
      price: result['price']!.isEmpty ? null : result['price'],
      seller: result['seller']!.isEmpty ? null : result['seller'],
      notes: result['notes']!.isEmpty ? null : result['notes'],
    );

    await _journalService.updateEntry(updated);
    _refresh();
  }

  Color _bannerColor(String variety) {
    final v = variety.toLowerCase();
    if (v.contains('musang') || v.contains('king')) {
      return AppColors.musangKingGreen;
    }
    if (v.contains('black') || v.contains('thorn')) {
      return AppColors.blackThornOrange;
    }
    if (v.contains('d24')) {
      return Colors.brown.shade400;
    }
    return AppColors.primaryGreen;
  }

  @override
  Widget build(BuildContext context) {
    final entries = _journalService.getAllEntries();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Green Header
          GreenHeader(
            title: 'Detection History',
            height: 100,
            actions: [
              IconButton(
                icon: const Icon(Icons.filter_list, color: Colors.white),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.download, color: Colors.white),
                onPressed: _exportCsv,
              ),
            ],
          ),

          // Body
          Expanded(
            child: entries.isEmpty
                ? const Center(
                    child: Text(
                      'No history yet',
                      style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: entries.length,
                    itemBuilder: (context, index) {
                      final item = entries[index];
                      return _buildEntryCard(item);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEntryCard(JournalEntry item) {
    final banner = _bannerColor(item.variety);
    final dateStr = DateFormat('d MMM yyyy, HH:mm').format(item.date);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: AppDecorations.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Colored banner
          Container(
            height: 110,
            width: double.infinity,
            decoration: BoxDecoration(
              color: banner,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Stack(
              children: [
                // Leaf icon background
                Positioned(
                  right: 20,
                  top: 20,
                  child: Icon(
                    Icons.eco,
                    size: 60,
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
                ),
                // Variety chip
                Positioned(
                  left: 16,
                  bottom: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      item.variety,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                // Confidence
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${item.confidence.toStringAsFixed(1)}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    Text(
                      dateStr,
                      style: AppTextStyles.caption,
                    ),
                    const Spacer(),
                    IconButton(
                      icon: Icon(Icons.edit_note, color: AppColors.primaryGreen.withValues(alpha: 0.7)),
                      onPressed: () => _editNotes(item),
                      tooltip: 'Edit Notes',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                    const SizedBox(width: 16),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                      onPressed: () => _deleteEntry(item.id),
                      tooltip: 'Delete',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                if (item.taste != null && item.taste!.isNotEmpty)
                  _noteLine(Icons.restaurant, 'Taste', item.taste!),
                if (item.price != null && item.price!.isNotEmpty)
                  _noteLine(Icons.attach_money, 'Price', item.price!),
                if (item.seller != null && item.seller!.isNotEmpty)
                  _noteLine(Icons.store, 'Seller', item.seller!),
                if (item.notes != null && item.notes!.isNotEmpty)
                  _noteLine(Icons.notes, 'Notes', item.notes!),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _noteLine(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                children: [
                  TextSpan(text: '$label: ', style: const TextStyle(fontWeight: FontWeight.w600)),
                  TextSpan(text: value),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
