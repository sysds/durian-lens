import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

class DurianClient {
  static const String serverUrl = "http://10.20.75.74:8000/predict";

  Future<Map<String, dynamic>?> detectDurian(XFile image) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse(serverUrl),
      );

      request.files.add(
        await http.MultipartFile.fromPath('file', image.path),
      );

      final streamedResponse = await request.send().timeout(const Duration(seconds: 10));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print("Server Error: ${response.body}");
        debugPrint("Server Error: ${response.statusCode} - ${response.body}");
        return null;
      }
    } catch (e) {
      print("Connection Error: $e");
      debugPrint("Connection Error: $e");
      return null;
    }
  }
}