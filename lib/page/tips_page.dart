import 'package:flutter/material.dart';

import '../models/durian_tip.dart';
import '../services/tips_service.dart';

class TipsPage extends StatefulWidget {
  const TipsPage({super.key});

  @override
  State<TipsPage> createState() => _TipsPageState();
}

class _TipsPageState extends State<TipsPage> {
  final TipsService _tipsService = TipsService();
  late Future<List<DurianTip>> _tipsFuture;

  @override
  void initState() {
    super.initState();
    _tipsFuture = _tipsService.loadTips();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF1F8E9),
      appBar: AppBar(
        title: const Text('Ripeness Tips & Seasons'),
        backgroundColor: Colors.green.shade700,
      ),
      body: FutureBuilder<List<DurianTip>>(
        future: _tipsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('Failed to load tips'));
          }

          final tips = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: tips.length,
            itemBuilder: (context, index) {
              final tip = tips[index];
              return _buildTipCard(tip);
            },
          );
        },
      ),
    );
  }

  Widget _buildTipCard(DurianTip tip) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 14, offset: Offset(0, 8)),
        ],
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
        collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: Text(
          tip.variety,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          'Season: ${tip.season}',
          style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.w500),
        ),
        children: [
          _infoRow(Icons.calendar_today, 'Season', tip.season),
          _infoRow(Icons.location_on, 'Origin', tip.origin),
          _infoRow(Icons.color_lens, 'Colour Indicators', tip.colorIndicators),
          _infoRow(Icons.touch_app, 'Texture', tip.texture),
          _infoRow(Icons.lightbulb, 'Ripeness Tips', tip.ripenessTips),
          _infoRow(Icons.restaurant, 'Taste Profile', tip.tasteProfile),
          _infoRow(Icons.attach_money, 'Price Range', tip.priceRange),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.green.shade700),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                ),
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
