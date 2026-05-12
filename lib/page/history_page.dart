import 'dart:io';

import 'package:flutter/material.dart';

import '../models/journal_entry.dart';
import '../services/csv_service.dart';
import '../services/journal_service.dart';

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
        title: const Text('Delete Entry?'),
        content: const Text('This will permanently remove the journal entry.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
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

  @override
  Widget build(BuildContext context) {
    final entries = _journalService.getAllEntries();

    return Scaffold(
      backgroundColor: const Color(0xffF1F8E9),
      appBar: AppBar(
        title: const Text('Detection History'),
        backgroundColor: Colors.green.shade700,
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            tooltip: 'Export CSV',
            onPressed: _exportCsv,
          ),
        ],
      ),
      body: entries.isEmpty
          ? const Center(child: Text('No history yet', style: TextStyle(fontSize: 16)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: entries.length,
              itemBuilder: (context, index) {
                final item = entries[index];
                return _buildEntryCard(item);
              },
            ),
    );
  }

  Widget _buildEntryCard(JournalEntry item) {
    final file = File(item.photoPath);
    final hasImage = file.existsSync();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 14, offset: Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
            child: hasImage
                ? Image.file(
                    file,
                    height: 220,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  )
                : Container(
                    height: 220,
                    width: double.infinity,
                    color: Colors.grey.shade300,
                    child: const Icon(Icons.broken_image, size: 64, color: Colors.grey),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.green.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        item.variety,
                        style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.edit_note, color: Colors.blue),
                      onPressed: () => _editNotes(item),
                      tooltip: 'Edit Notes',
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: () => _deleteEntry(item.id),
                      tooltip: 'Delete',
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  'Confidence: ${item.confidence.toStringAsFixed(2)}%',
                  style: const TextStyle(fontSize: 15, color: Colors.black54),
                ),
                const SizedBox(height: 6),
                Text(
                  item.date.toLocal().toString().split('.').first,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
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
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 6),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 13, color: Colors.black87),
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
