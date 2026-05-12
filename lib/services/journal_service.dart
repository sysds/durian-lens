import 'package:hive_flutter/hive_flutter.dart';

import '../models/journal_entry.dart';

class JournalService {
  static const String _boxName = 'journal_entries';

  Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox<Map>(_boxName);
  }

  Box<Map> get _box => Hive.box<Map>(_boxName);

  Future<void> addEntry(JournalEntry entry) async {
    await _box.put(entry.id, entry.toJson());
  }

  Future<void> updateEntry(JournalEntry entry) async {
    await _box.put(entry.id, entry.toJson());
  }

  Future<void> deleteEntry(String id) async {
    await _box.delete(id);
  }

  List<JournalEntry> getAllEntries() {
    final values = _box.values.toList().reversed.toList();
    return values.map((v) {
      final map = Map<String, dynamic>.from(v);
      return JournalEntry.fromJson(map);
    }).toList();
  }

  Future<void> clearAll() async {
    await _box.clear();
  }
}
