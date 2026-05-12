import 'dart:convert';
import 'package:flutter/services.dart';

import '../models/durian_tip.dart';

class TipsService {
  List<DurianTip>? _tips;

  Future<List<DurianTip>> loadTips() async {
    if (_tips != null) return _tips!;
    final jsonString = await rootBundle.loadString('assets/durian_tips.json');
    final List<dynamic> jsonList = jsonDecode(jsonString);
    _tips = jsonList.map((e) => DurianTip.fromJson(e as Map<String, dynamic>)).toList();
    return _tips!;
  }

  DurianTip? getTipForVariety(String variety, List<DurianTip> tips) {
    final query = variety.trim().toLowerCase();
    try {
      return tips.firstWhere(
        (t) => t.variety.toLowerCase() == query,
      );
    } catch (_) {
      return null;
    }
  }
}
