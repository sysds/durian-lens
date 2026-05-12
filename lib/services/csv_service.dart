import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../models/journal_entry.dart';

class CsvService {
  static String _escape(String? value) {
    if (value == null || value.isEmpty) return '';
    final escaped = value.replaceAll('"', '""');
    if (escaped.contains(',') || escaped.contains('\n') || escaped.contains('"')) {
      return '"$escaped"';
    }
    return escaped;
  }

  static Future<void> exportToCsv(List<JournalEntry> entries) async {
    final buffer = StringBuffer();
    buffer.writeln('Date,Variety,Confidence (%),Taste,Price,Seller,Notes');

    for (final e in entries) {
      buffer.writeln(
        '${_escape(e.date.toIso8601String())},'
        '${_escape(e.variety)},'
        '${e.confidence.toStringAsFixed(2)},'
        '${_escape(e.taste)},'
        '${_escape(e.price)},'
        '${_escape(e.seller)},'
        '${_escape(e.notes)}',
      );
    }

    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/durian_journal_export.csv');
    await file.writeAsString(buffer.toString());

    await Share.shareXFiles(
      [XFile(file.path)],
      subject: 'Durian Journal Export',
    );
  }
}
