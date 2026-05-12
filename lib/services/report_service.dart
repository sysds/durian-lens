import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

class ReportService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  Future<void> submitReport({
    required String predictedLabel,
    required String correctedLabel,
    required String comment,
    File? imageFile,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    final uid = user?.uid ?? 'anonymous';

    String? imageUrl;
    if (imageFile != null && imageFile.existsSync()) {
      final ref = _storage.ref().child('report_images/${DateTime.now().millisecondsSinceEpoch}.jpg');
      await ref.putFile(imageFile);
      imageUrl = await ref.getDownloadURL();
    }

    await _firestore.collection('incorrect_predictions').add({
      'predictedLabel': predictedLabel,
      'correctedLabel': correctedLabel,
      'comment': comment,
      'imageUrl': imageUrl,
      'timestamp': FieldValue.serverTimestamp(),
      'userId': uid,
    });
  }
}
