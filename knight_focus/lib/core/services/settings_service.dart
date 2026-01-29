import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

/// Simple settings service using JSON file storage.
/// Can be replaced with Isar later for more complex data needs.
class SettingsService {
  static final SettingsService instance = SettingsService._();

  SettingsService._();

  Map<String, dynamic> _settings = {};
  File? _settingsFile;
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      final dir = await getApplicationDocumentsDirectory();
      _settingsFile = File('${dir.path}/knight_focus_settings.json');

      if (await _settingsFile!.exists()) {
        final content = await _settingsFile!.readAsString();
        _settings = jsonDecode(content) as Map<String, dynamic>;
      } else {
        _settings = _defaultSettings;
        await _save();
      }
    } catch (e) {
      debugPrint('Failed to load settings: $e');
      _settings = _defaultSettings;
    }

    _initialized = true;
  }

  Map<String, dynamic> get _defaultSettings => {
        'colorVariant': 'Colour1',
        'styleVariant': 'Outline',
        'scale': 1.0,
        'lastPositionX': 0,
        'lastPositionY': 0,
        'soundEnabled': true,
        'visible': true,
      };

  Future<void> _save() async {
    if (_settingsFile != null) {
      try {
        await _settingsFile!.writeAsString(jsonEncode(_settings));
      } catch (e) {
        debugPrint('Failed to save settings: $e');
      }
    }
  }

  // Getters
  String get colorVariant => _settings['colorVariant'] ?? 'Colour1';
  String get styleVariant => _settings['styleVariant'] ?? 'Outline';
  double get scale => (_settings['scale'] ?? 1.0).toDouble();
  int get lastPositionX => _settings['lastPositionX'] ?? 0;
  int get lastPositionY => _settings['lastPositionY'] ?? 0;
  bool get soundEnabled => _settings['soundEnabled'] ?? true;
  bool get visible => _settings['visible'] ?? true;

  // Setters
  Future<void> setColorVariant(String value) async {
    _settings['colorVariant'] = value;
    await _save();
  }

  Future<void> setStyleVariant(String value) async {
    _settings['styleVariant'] = value;
    await _save();
  }

  Future<void> setScale(double value) async {
    _settings['scale'] = value;
    await _save();
  }

  Future<void> setLastPosition(int x, int y) async {
    _settings['lastPositionX'] = x;
    _settings['lastPositionY'] = y;
    await _save();
  }

  Future<void> setSoundEnabled(bool value) async {
    _settings['soundEnabled'] = value;
    await _save();
  }

  Future<void> setVisible(bool value) async {
    _settings['visible'] = value;
    await _save();
  }
}
